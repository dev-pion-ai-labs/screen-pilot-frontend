"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { supabase } from "@/integrations/supabase/client"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    BookOpen,
    Plus,
    Search,
    Bell,
    Edit3,
    Trash2,
    X,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Profile {
    id: string
    full_name: string
    email: string
    role: string
}

interface GlossaryEntry {
    id: string
    word: string
    meaning: string
    examples: string[]
    added_by: string
    requested_by: string | null
    created_at: string
    updated_at: string
    added_by_profile?: {
        full_name: string
    }
    requested_by_profile?: {
        full_name: string
    }
}

interface GlossaryRequest {
    id: string
    word: string
    requested_by_ids: string[]
    context: string | null
    status: 'pending' | 'approved' | 'rejected'
    created_at: string
    resolved_at: string | null
    resolved_by: string | null
    glossary_id: string | null
    rejection_reason: string | null
}

interface Notification {
    id: string
    request_id: string
    teacher_id: string
    is_read: boolean
    is_dismissed: boolean
    created_at: string
    request?: GlossaryRequest
}

export default function Glossary() {
    const { profile } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [entries, setEntries] = useState<GlossaryEntry[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filterLetter, setFilterLetter] = useState<string>("all")

    // Student states
    const [requestModalOpen, setRequestModalOpen] = useState(false)
    const [myRequestsOpen, setMyRequestsOpen] = useState(false)
    const [studentRequests, setStudentRequests] = useState<GlossaryRequest[]>([])
    const [newRequestWord, setNewRequestWord] = useState("")
    const [newRequestContext, setNewRequestContext] = useState("")

    // Teacher states
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [addModalOpen, setAddModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<GlossaryEntry | null>(null)
    const [selectedRequest, setSelectedRequest] = useState<GlossaryRequest | null>(null)

    // Form states
    const [formWord, setFormWord] = useState("")
    const [formMeaning, setFormMeaning] = useState("")
    const [formExamples, setFormExamples] = useState<string[]>(["", "", ""])
    const [rejectionReason, setRejectionReason] = useState("")
    const [isRejecting, setIsRejecting] = useState(false)

    const isTeacher = profile?.role === 'teacher'
    const isStudent = profile?.role === 'student'

    useEffect(() => {
        fetchGlossaryEntries()
        if (isStudent) {
            fetchStudentRequests()
        }
        if (isTeacher) {
            fetchTeacherNotifications()
        }
    }, [profile])

    const fetchGlossaryEntries = async () => {
        try {
            const { data, error } = await supabase
                .from('glossary')
                .select(`
          *,
          added_by_profile:profiles!glossary_added_by_fkey(full_name),
          requested_by_profile:profiles!glossary_requested_by_fkey(full_name)
        `)
                .order('word', { ascending: true })

            if (error) throw error
            setEntries(data || [])
        } catch (error) {
            console.error('Error fetching glossary:', error)
            toast({
                title: "Error",
                description: "Failed to load glossary entries",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchStudentRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('glossary_requests')
                .select('*')
                .contains('requested_by_ids', JSON.stringify([profile?.id]))
                .order('created_at', { ascending: false })

            if (error) throw error
            setStudentRequests(data || [])
        } catch (error) {
            console.error('Error fetching student requests:', error)
        }
    }

    const fetchTeacherNotifications = async () => {
        try {
            // Get all pending requests
            const { data: requests, error: requestsError } = await supabase
                .from('glossary_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false })

            if (requestsError) throw requestsError

            // Transform to match notification structure
            const notifications = (requests || []).map(request => ({
                id: request.id,
                request_id: request.id,
                teacher_id: profile?.id || '',
                is_read: false,
                is_dismissed: false,
                created_at: request.created_at,
                request: request
            }))

            setNotifications(notifications)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        }
    }

    const handleStudentRequest = async () => {
        if (!newRequestWord.trim()) {
            toast({
                title: "Error",
                description: "Please enter a word",
                variant: "destructive"
            })
            return
        }

        try {
            // Check if word already exists in glossary
            const { data: existing } = await supabase
                .from('glossary')
                .select('word')
                .ilike('word', newRequestWord.trim())
                .single()

            if (existing) {
                toast({
                    title: "Word Already Exists",
                    description: "This word is already in the glossary",
                    variant: "destructive"
                })
                return
            }

            // Check if there's a pending request for this word
            const { data: existingRequest } = await supabase
                .from('glossary_requests')
                .select('*')
                .ilike('word', newRequestWord.trim())
                .eq('status', 'pending')
                .single()

            if (existingRequest) {
                // Update existing request - add student ID if not already there
                const requestedByIds = existingRequest.requested_by_ids || []
                if (!requestedByIds.includes(profile?.id)) {
                    requestedByIds.push(profile?.id)

                    const updatedContext = existingRequest.context
                        ? `${existingRequest.context}\n\n---\n\n${newRequestContext}`
                        : newRequestContext

                    const { error } = await supabase
                        .from('glossary_requests')
                        .update({
                            requested_by_ids: requestedByIds,
                            context: updatedContext,
                            created_at: new Date().toISOString() // Update timestamp
                        })
                        .eq('id', existingRequest.id)

                    if (error) throw error

                    toast({
                        title: "Request Updated",
                        description: "Your request has been added to the existing request for this word"
                    })
                } else {
                    toast({
                        title: "Already Requested",
                        description: "You have already requested this word"
                    })
                }
            } else {
                // Create new request
                const { error } = await supabase
                    .from('glossary_requests')
                    .insert({
                        word: newRequestWord.trim(),
                        requested_by_ids: [profile?.id],
                        context: newRequestContext.trim() || null,
                        status: 'pending'
                    })

                if (error) throw error

                toast({
                    title: "Request Submitted",
                    description: "Teachers will be notified of your request"
                })
            }

            setRequestModalOpen(false)
            setNewRequestWord("")
            setNewRequestContext("")
            fetchStudentRequests()
        } catch (error) {
            console.error('Error submitting request:', error)
            toast({
                title: "Error",
                description: "Failed to submit request",
                variant: "destructive"
            })
        }
    }

    const handleAddWord = async (fromRequest: boolean = false) => {
        if (!formWord.trim() || !formMeaning.trim()) {
            toast({
                title: "Error",
                description: "Word and meaning are required",
                variant: "destructive"
            })
            return
        }

        try {
            const examples = formExamples.filter(ex => ex.trim())

            const { data, error } = await supabase
                .from('glossary')
                .insert({
                    word: formWord.trim(),
                    meaning: formMeaning.trim(),
                    examples: examples,
                    added_by: profile?.id,
                    requested_by: fromRequest ? selectedRequest?.requested_by_ids[0] : null
                })
                .select()
                .single()

            if (error) throw error

            // If from request, update request status
            if (fromRequest && selectedRequest) {
                await supabase
                    .from('glossary_requests')
                    .update({
                        status: 'approved',
                        resolved_at: new Date().toISOString(),
                        resolved_by: profile?.id,
                        glossary_id: data.id
                    })
                    .eq('id', selectedRequest.id)


            }

            toast({
                title: "Success",
                description: "Word added to glossary"
            })

            setAddModalOpen(false)
            resetForm()
            fetchGlossaryEntries()
            if (isTeacher) fetchTeacherNotifications()
        } catch (error) {
            console.error('Error adding word:', error)
            toast({
                title: "Error",
                description: "Failed to add word",
                variant: "destructive"
            })
        }
    }

    const handleRejectRequest = async () => {
        if (!selectedRequest || !rejectionReason.trim()) {
            toast({
                title: "Error",
                description: "Please provide a rejection reason",
                variant: "destructive"
            })
            return
        }

        try {
            await supabase
                .from('glossary_requests')
                .update({
                    status: 'rejected',
                    resolved_at: new Date().toISOString(),
                    resolved_by: profile?.id,
                    rejection_reason: rejectionReason
                })
                .eq('id', selectedRequest.id)

            // Mark notifications as dismissed


            toast({
                title: "Request Rejected",
                description: "Student will be notified"
            })

            setAddModalOpen(false)
            setIsRejecting(false)
            setRejectionReason("")
            setSelectedRequest(null)
            fetchTeacherNotifications()
        } catch (error) {
            console.error('Error rejecting request:', error)
            toast({
                title: "Error",
                description: "Failed to reject request",
                variant: "destructive"
            })
        }
    }

    const handleEditWord = async () => {
        if (!selectedEntry || !formWord.trim() || !formMeaning.trim()) {
            return
        }

        try {
            const examples = formExamples.filter(ex => ex.trim())

            const { error } = await supabase
                .from('glossary')
                .update({
                    word: formWord.trim(),
                    meaning: formMeaning.trim(),
                    examples: examples
                })
                .eq('id', selectedEntry.id)

            if (error) throw error

            toast({
                title: "Success",
                description: "Word updated successfully"
            })

            setEditModalOpen(false)
            resetForm()
            fetchGlossaryEntries()
        } catch (error) {
            console.error('Error updating word:', error)
            toast({
                title: "Error",
                description: "Failed to update word",
                variant: "destructive"
            })
        }
    }

    const handleDeleteWord = async (id: string) => {
        if (!confirm("Are you sure you want to delete this word?")) return

        try {
            const { error } = await supabase
                .from('glossary')
                .delete()
                .eq('id', id)

            if (error) throw error

            toast({
                title: "Success",
                description: "Word deleted successfully"
            })

            fetchGlossaryEntries()
        } catch (error) {
            console.error('Error deleting word:', error)
            toast({
                title: "Error",
                description: "Failed to delete word",
                variant: "destructive"
            })
        }
    }

    const openAddFromRequest = (request: GlossaryRequest) => {
        setSelectedRequest(request)
        setFormWord(request.word)
        setFormMeaning("")
        setFormExamples(["", "", ""])
        setIsRejecting(false)
        setAddModalOpen(true)
    }

    const openEditModal = (entry: GlossaryEntry) => {
        setSelectedEntry(entry)
        setFormWord(entry.word)
        setFormMeaning(entry.meaning)
        setFormExamples([
            ...entry.examples,
            ...Array(Math.max(0, 3 - entry.examples.length)).fill("")
        ])
        setEditModalOpen(true)
    }

    const resetForm = () => {
        setFormWord("")
        setFormMeaning("")
        setFormExamples(["", "", ""])
        setSelectedEntry(null)
        setSelectedRequest(null)
        setIsRejecting(false)
        setRejectionReason("")
    }



    const filteredEntries = entries.filter(entry => {
        const matchesSearch = entry.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
            entry.meaning.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterLetter === "all" ||
            entry.word.toLowerCase().startsWith(filterLetter.toLowerCase())
        return matchesSearch && matchesFilter
    })

    const pendingNotifications = notifications.filter(n => !n.is_read && !n.is_dismissed)

    if (loading) {
        return (
            <AuthGuard allowedRoles={["teacher", "student"]}>
                <ModernDashboardLayout>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                    </div>
                </ModernDashboardLayout>
            </AuthGuard>
        )
    }

    return (
        <AuthGuard allowedRoles={["teacher", "student"]}>
            <ModernDashboardLayout>
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                Film Terminology Glossary
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {entries.length} terms available
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isStudent && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setMyRequestsOpen(true)}
                                    >
                                        <Clock className="h-4 w-4 mr-2" />
                                        My Requests
                                    </Button>
                                    <Button
                                        onClick={() => setRequestModalOpen(true)}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Request Word
                                    </Button>
                                </>
                            )}
                            {isTeacher && (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => setNotificationsOpen(true)}
                                        className="relative"
                                    >
                                        <Bell className="h-4 w-4 mr-2" />
                                        Requests
                                        {pendingNotifications.length > 0 && (
                                            <Badge className="ml-2 bg-red-500">
                                                {pendingNotifications.length}
                                            </Badge>
                                        )}
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            resetForm()
                                            setAddModalOpen(true)
                                        }}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add New Word
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        placeholder="Search terms..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Select value={filterLetter} onValueChange={setFilterLetter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => (
                                            <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Glossary Entries */}
                    <div className="space-y-4">
                        {filteredEntries.map(entry => (
                            <Card key={entry.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                {entry.word}
                                            </h3>
                                            <p className="text-gray-700 mb-3">{entry.meaning}</p>
                                            {entry.examples && entry.examples.length > 0 && (
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-gray-600">Examples:</p>
                                                    <ul className="list-disc list-inside space-y-1">
                                                        {entry.examples.map((ex, idx) => (
                                                            <li key={idx} className="text-sm text-gray-600">{ex}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                                <span>Added by: {entry.added_by_profile?.full_name}</span>
                                                {entry.requested_by_profile && (
                                                    <span>Requested by: {entry.requested_by_profile.full_name}</span>
                                                )}
                                                <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {isTeacher && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditModal(entry)}
                                                >
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteWord(entry.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {filteredEntries.length === 0 && (
                            <Card>
                                <CardContent className="pt-6 text-center py-12">
                                    <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">No terms found</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>

                {/* Student: Request Word Modal */}
                <Dialog open={requestModalOpen} onOpenChange={setRequestModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Request New Word</DialogTitle>
                            <DialogDescription>
                                Request a new term to be added to the glossary
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <Label>Word *</Label>
                                <Input
                                    value={newRequestWord}
                                    onChange={(e) => setNewRequestWord(e.target.value)}
                                    placeholder="Enter the word"
                                />
                            </div>
                            <div>
                                <Label>Context (Optional)</Label>
                                <Textarea
                                    value={newRequestContext}
                                    onChange={(e) => setNewRequestContext(e.target.value)}
                                    placeholder="Where did you encounter this word?"
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRequestModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleStudentRequest}>
                                Submit Request
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Student: My Requests Panel */}
                <Dialog open={myRequestsOpen} onOpenChange={setMyRequestsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>My Word Requests</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {studentRequests.map(request => (
                                <Card key={request.id}>
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-bold">{request.word}</h4>
                                                    <Badge variant={
                                                        request.status === 'pending' ? 'secondary' :
                                                            request.status === 'approved' ? 'default' : 'destructive'
                                                    }>
                                                        {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                                                        {request.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                        {request.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                                                        {request.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                {request.context && (
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        Context: {request.context}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    Requested {new Date(request.created_at).toLocaleDateString()}
                                                    {request.requested_by_ids.length > 1 &&
                                                        ` • Also requested by ${request.requested_by_ids.length - 1} other student(s)`
                                                    }
                                                </p>
                                                {request.status === 'rejected' && request.rejection_reason && (
                                                    <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                                                        <p className="text-sm text-red-700">
                                                            <strong>Reason:</strong> {request.rejection_reason}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            {request.status === 'approved' && request.glossary_id && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setMyRequestsOpen(false)
                                                        // Scroll to the word in glossary
                                                        const element = document.getElementById(`word-${request.glossary_id}`)
                                                        element?.scrollIntoView({ behavior: 'smooth' })
                                                    }}
                                                >
                                                    View in Glossary
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {studentRequests.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>You haven't requested any words yet</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Teacher: Notifications Panel */}
                <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                                <span>Word Requests</span>
                                {pendingNotifications.length > 0 && (
                                    <Badge variant="destructive">
                                        {pendingNotifications.length} pending
                                    </Badge>
                                )}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {notifications.map(notification => (
                                <Card key={notification.id} className={cn(
                                    !notification.is_read && "border-purple-300 bg-purple-50"
                                )}>
                                    <CardContent className="pt-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg mb-1">
                                                    {notification.request?.word}
                                                </h4>
                                                <p className="text-sm text-gray-600 mb-2">
                                                    Requested by {notification.request?.requested_by_ids.length} student(s)
                                                </p>
                                                {notification.request?.context && (
                                                    <p className="text-sm text-gray-700 mb-2 italic">
                                                        "{notification.request.context}"
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    {new Date(notification.created_at).toLocaleDateString()}
                                                </p>
                                            </div>

                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <Button
                                                size="sm"
                                                onClick={() => {
                                                    if (notification.request) {
                                                        openAddFromRequest(notification.request)
                                                        setNotificationsOpen(false)
                                                    }
                                                }}
                                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                            >
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Add This Word
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (notification.request) {
                                                        setSelectedRequest(notification.request)
                                                        setIsRejecting(true)
                                                        setAddModalOpen(true)
                                                        setNotificationsOpen(false)
                                                    }
                                                }}
                                            >
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Reject Request
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {notifications.length === 0 && (
                                <div className="text-center py-12 text-gray-500">
                                    <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No pending requests</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Teacher: Add/Edit Word Modal */}
                <Dialog open={addModalOpen || editModalOpen} onOpenChange={(open) => {
                    if (!open) {
                        setAddModalOpen(false)
                        setEditModalOpen(false)
                        resetForm()
                    }
                }}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {selectedRequest
                                    ? `Add Requested Word: "${selectedRequest.word}"`
                                    : editModalOpen
                                        ? 'Edit Term'
                                        : 'Add New Term'}
                            </DialogTitle>
                            {selectedRequest && (
                                <DialogDescription>
                                    Requested by {selectedRequest.requested_by_ids.length} student(s)
                                    {selectedRequest.context && ` • Context: "${selectedRequest.context}"`}
                                </DialogDescription>
                            )}
                        </DialogHeader>

                        {!isRejecting ? (
                            <div className="space-y-4">
                                <div>
                                    <Label>Word *</Label>
                                    <Input
                                        value={formWord}
                                        onChange={(e) => setFormWord(e.target.value)}
                                        placeholder="Enter the word"
                                        disabled={!!selectedRequest}
                                    />
                                </div>
                                <div>
                                    <Label>Meaning *</Label>
                                    <Textarea
                                        value={formMeaning}
                                        onChange={(e) => setFormMeaning(e.target.value)}
                                        placeholder="Enter the definition"
                                        rows={4}
                                    />
                                </div>
                                <div>
                                    <Label>Examples</Label>
                                    <div className="space-y-2">
                                        {formExamples.map((example, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <Input
                                                    value={example}
                                                    onChange={(e) => {
                                                        const newExamples = [...formExamples]
                                                        newExamples[idx] = e.target.value
                                                        setFormExamples(newExamples)
                                                    }}
                                                    placeholder={`Example ${idx + 1}`}
                                                />
                                                {idx >= 3 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            const newExamples = formExamples.filter((_, i) => i !== idx)
                                                            setFormExamples(newExamples)
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFormExamples([...formExamples, ""])}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Example
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 rounded border border-red-200">
                                    <p className="text-sm text-red-700 mb-2">
                                        You are about to reject this request. Please provide a reason.
                                    </p>
                                </div>
                                <div>
                                    <Label>Rejection Reason *</Label>
                                    <Textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Explain why this request is being rejected..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {!isRejecting ? (
                                <>
                                    {selectedRequest && (
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsRejecting(true)}
                                            className="mr-auto"
                                        >
                                            Reject Request
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setAddModalOpen(false)
                                            setEditModalOpen(false)
                                            resetForm()
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => editModalOpen ? handleEditWord() : handleAddWord(!!selectedRequest)}
                                    >
                                        {editModalOpen ? 'Save Changes' : 'Add to Glossary'}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsRejecting(false)
                                            setRejectionReason("")
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleRejectRequest}
                                    >
                                        Confirm Rejection
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </ModernDashboardLayout>
        </AuthGuard>
    )
}