"use client"

import type React from "react"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Clapperboard, ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { supabase } from "@/integrations/supabase/client"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const { toast } = useToast()

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsEmailSent(true)
        toast({
          title: "Password Reset Email Sent",
          description: "Please check your email for password reset instructions.",
        })
      }
    } catch (error) {
      console.error("Forgot password error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
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
            <div className="w-full max-w-md mx-auto">
              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Check Your Email</CardTitle>
                  <CardDescription className="text-gray-600">
                    We've sent password reset instructions to <strong>{email}</strong>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Next Steps:</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-700">
                          <li>Check your email inbox (and spam folder)</li>
                          <li>Click the "Reset Password" link in the email</li>
                          <li>Create your new password</li>
                          <li>Sign in with your new password</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-gray-600">
                    Didn't receive the email? Check your spam folder or{" "}
                    <button
                      onClick={() => {
                        setIsEmailSent(false)
                        setEmail("")
                      }}
                      className="text-purple-600 hover:text-purple-700 font-medium"
                    >
                      try again
                    </button>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Link to="/login" className="w-full">
                    <Button variant="outline" className="w-full h-12">
                      Back to Sign In
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
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
                  Forgot Your
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    Password?
                  </span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  No worries! We'll send you reset instructions to get you back into your Screen Pilot account.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90">How it works:</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <div>
                      <div className="font-medium">Enter your email</div>
                      <div className="text-sm text-white/70">The one you used to sign up</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <div>
                      <div className="font-medium">Check your inbox</div>
                      <div className="text-sm text-white/70">Click the reset link we send you</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <div>
                      <div className="font-medium">Create new password</div>
                      <div className="text-sm text-white/70">Set a strong, secure password</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Forgot Password Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                  <div className="lg:hidden flex items-center justify-center gap-2 text-purple-600">
                    <Clapperboard className="h-6 w-6" />
                    <span className="text-xl font-bold">Screen Pilot</span>
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Reset Password</CardTitle>
                  <CardDescription className="text-gray-600">
                    Enter your email address and we'll send you a link to reset your password
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleForgotPassword}>
                  <CardContent className="space-y-6">
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
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white font-medium text-lg shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending Reset Link...
                        </>
                      ) : (
                        "Send Reset Link"
                      )}
                    </Button>

                    <div className="flex flex-col items-center space-y-2 text-sm">
                      <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                        Back to Sign In
                      </Link>
                      <div className="text-gray-500">
                        Don't have an account?{" "}
                        <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
                          Sign up
                        </Link>
                      </div>
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