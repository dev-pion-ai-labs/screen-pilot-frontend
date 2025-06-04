"use client"

import type React from "react"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Clapperboard, GraduationCap, BookOpen, Shield, ArrowLeft, UserPlus } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signUp(email, password, fullName, role)

      if (!error) {
        toast({
          title: "Welcome to Screen Pilot!",
          description: "Account created successfully. Let's start your creative journey.",
        })
      } else {
        toast({
          title: "Signup failed",
          description: "Unable to create account. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast({
        title: "Signup failed",
        description: "Unable to create account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
        <div className="p-6">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Link to="/" className="flex items-center text-white hover:text-white/80 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <img src="/logo.png" alt="Screen Pilot AI Mentorship Interface" className="h-12 w-16" />
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold -ml-2">Screen Pilot</span>
                <span className="text-sm bg-white/20 px-2 py-1 rounded-full">ACFM</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center px-4 pb-12">
          <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
            <div className="hidden lg:block text-white space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl font-bold leading-tight">
                  Join the Future of
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    Screenwriting
                  </span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Start your creative journey with AI-powered mentorship that encourages creativity and builds
                  confidence in screenwriting.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90">Choose your role:</h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <GraduationCap className="h-6 w-6 text-blue-300" />
                    <div>
                      <div className="font-medium">Student</div>
                      <div className="text-sm text-white/70">Learn with AI mentorship & get script feedback</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <BookOpen className="h-6 w-6 text-purple-300" />
                    <div>
                      <div className="font-medium">Teacher</div>
                      <div className="text-sm text-white/70">Create assignments & track student progress</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <Shield className="h-6 w-6 text-pink-300" />
                    <div>
                      <div className="font-medium">Administrator</div>
                      <div className="text-sm text-white/70">Manage system settings & user analytics</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                  <div className="lg:hidden flex items-center justify-center gap-2 text-purple-600">
                    <Clapperboard className="h-6 w-6" />
                    <span className="text-xl font-bold">Screen Pilot</span>
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Create Account</CardTitle>
                  <CardDescription className="text-gray-600">
                    Join Screen Pilot and start your screenwriting journey with AI-powered mentorship
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-700 font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 font-medium">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@acfm.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">
                        Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-700 font-medium">
                        Role
                      </Label>
                      <Select onValueChange={setRole} required>
                        <SelectTrigger className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-blue-500" />
                              Student
                            </div>
                          </SelectItem>
                          <SelectItem value="teacher">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-purple-500" />
                              Teacher
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-pink-500" />
                              Administrator
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-6">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white font-medium text-lg shadow-lg"
                      disabled={loading || !role}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-5 w-5" />
                          Create Account
                        </>
                      )}
                    </Button>

                    <div className="text-center">
                      <p className="text-gray-600">
                        Already have an account?{" "}
                        <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium hover:underline">
                          Sign in here
                        </Link>
                      </p>
                    </div>

                    <div className="text-center pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500">
                        By creating an account, you agree to our{" "}
                        <Link to="/terms" className="text-purple-600 hover:text-purple-700 hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-purple-600 hover:text-purple-700 hover:underline">
                          Privacy Policy
                        </Link>
                      </p>
                    </div>
                  </CardFooter>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
