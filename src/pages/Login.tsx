"use client"

import type React from "react"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { Loader2, Clapperboard, GraduationCap, BookOpen, Shield, ArrowLeft } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { signIn } = useAuth()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error === null || error === undefined) {
        toast({
          title: "Welcome to Screen Pilot!",
          description: "Login successful. Let's start your creative journey.",
        })
        // Navigation will be handled by AuthGuard
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Login failed",
        description: "Invalid email or password. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
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
                  Welcome Back to
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    Screen Pilot
                  </span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Continue your screenwriting journey with AI-powered mentorship that encourages creativity and builds
                  confidence.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90">Choose your path:</h3>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <GraduationCap className="h-6 w-6 text-blue-300" />
                    <div>
                      <div className="font-medium">Student</div>
                      <div className="text-sm text-white/70">AI mentorship & script feedback</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <BookOpen className="h-6 w-6 text-purple-300" />
                    <div>
                      <div className="font-medium">Faculty</div>
                      <div className="text-sm text-white/70">Assignment creation & student tracking</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                    <Shield className="h-6 w-6 text-pink-300" />
                    <div>
                      <div className="font-medium">Administrator</div>
                      <div className="text-sm text-white/70">System management & analytics</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                  <div className="lg:hidden flex items-center justify-center gap-2 text-purple-600">
                    <Clapperboard className="h-6 w-6" />
                    <span className="text-xl font-bold">Screen Pilot</span>
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
                  <CardDescription className="text-gray-600">
                    Sign in to your Screen Pilot account to continue your creative journey
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleLogin}>
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-gray-700 font-medium">
                          Password
                        </Label>
                        <Link 
                          to="/forgot-password" 
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-6">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white font-medium text-lg shadow-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In to Screen Pilot"
                      )}
                    </Button>

                    <div className="text-center text-sm text-gray-500">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-medium">
                        Sign up for Screen Pilot
                      </Link>
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