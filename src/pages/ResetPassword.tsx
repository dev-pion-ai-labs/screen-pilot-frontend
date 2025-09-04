"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Clapperboard, ArrowLeft, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react"
import { AuthGuard } from "@/components/AuthGuard"
import { supabase } from "@/integrations/supabase/client"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Check if we have the required URL parameters for password reset
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const type = searchParams.get('type')

    if (type === 'recovery' && accessToken && refreshToken) {
      setIsValidToken(true)
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
    } else {
      setIsValidToken(false)
    }
  }, [searchParams])

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8
    const hasUpper = /[A-Z]/.test(pass)
    const hasLower = /[a-z]/.test(pass)
    const hasNumber = /\d/.test(pass)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass)

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      isValid: minLength && hasUpper && hasLower && hasNumber
    }
  }

  const passwordValidation = validatePassword(password)
  const passwordsMatch = password === confirmPassword && confirmPassword !== ""

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordValidation.isValid) {
      toast({
        title: "Invalid Password",
        description: "Please ensure your password meets all requirements.",
        variant: "destructive",
      })
      return
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else {
        setIsPasswordReset(true)
        toast({
          title: "Password Updated Successfully",
          description: "Your password has been changed. You can now sign in with your new password.",
        })
        
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while checking token validity
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying reset link...</p>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (isValidToken === false) {
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
                    <AlertTriangle className="h-16 w-16 text-red-500" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Invalid Reset Link</CardTitle>
                  <CardDescription className="text-gray-600">
                    This password reset link is invalid or has expired.
                  </CardDescription>
                </CardHeader>

                <CardFooter className="flex flex-col space-y-4">
                  <Link to="/forgot-password" className="w-full">
                    <Button className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                      Request New Reset Link
                    </Button>
                  </Link>
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

  // Success state
  if (isPasswordReset) {
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
                  <CardTitle className="text-3xl font-bold text-gray-900">Password Updated!</CardTitle>
                  <CardDescription className="text-gray-600">
                    Your password has been successfully changed. Redirecting you to sign in...
                  </CardDescription>
                </CardHeader>

                <CardFooter className="flex flex-col space-y-4">
                  <Link to="/login" className="w-full">
                    <Button className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                      Sign In Now
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
                  Create Your
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                    New Password
                  </span>
                </h1>
                <p className="text-xl text-white/90 leading-relaxed">
                  Choose a strong password to keep your Screen Pilot account secure.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white/90">Password Requirements:</h3>
                <div className="space-y-2">
                  <div className={`flex items-center gap-3 p-2 rounded ${passwordValidation.minLength ? 'text-green-300' : 'text-white/70'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.minLength ? 'bg-green-300' : 'bg-white/30'}`} />
                    <span>At least 8 characters</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2 rounded ${passwordValidation.hasUpper ? 'text-green-300' : 'text-white/70'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.hasUpper ? 'bg-green-300' : 'bg-white/30'}`} />
                    <span>One uppercase letter</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2 rounded ${passwordValidation.hasLower ? 'text-green-300' : 'text-white/70'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.hasLower ? 'bg-green-300' : 'bg-white/30'}`} />
                    <span>One lowercase letter</span>
                  </div>
                  <div className={`flex items-center gap-3 p-2 rounded ${passwordValidation.hasNumber ? 'text-green-300' : 'text-white/70'}`}>
                    <div className={`w-2 h-2 rounded-full ${passwordValidation.hasNumber ? 'bg-green-300' : 'bg-white/30'}`} />
                    <span>One number</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Reset Password Form */}
            <div className="w-full max-w-md mx-auto lg:mx-0">
              <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="text-center space-y-4">
                  <div className="lg:hidden flex items-center justify-center gap-2 text-purple-600">
                    <Clapperboard className="h-6 w-6" />
                    <span className="text-xl font-bold">Screen Pilot</span>
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-900">Set New Password</CardTitle>
                  <CardDescription className="text-gray-600">
                    Enter your new password below
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleResetPassword}>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-gray-700 font-medium">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your new password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 pr-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-12 w-12 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-12 pr-12 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-12 w-12 px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                      {confirmPassword && !passwordsMatch && (
                        <p className="text-sm text-red-600">Passwords don't match</p>
                      )}
                      {confirmPassword && passwordsMatch && (
                        <p className="text-sm text-green-600">Passwords match</p>
                      )}
                    </div>

                    {/* Mobile Password Requirements */}
                    <div className="lg:hidden space-y-2">
                      <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
                      <div className="text-xs space-y-1">
                        <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-1 h-1 rounded-full ${passwordValidation.minLength ? 'bg-green-600' : 'bg-gray-400'}`} />
                          <span>At least 8 characters</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.hasUpper ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-1 h-1 rounded-full ${passwordValidation.hasUpper ? 'bg-green-600' : 'bg-gray-400'}`} />
                          <span>One uppercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.hasLower ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-1 h-1 rounded-full ${passwordValidation.hasLower ? 'bg-green-600' : 'bg-gray-400'}`} />
                          <span>One lowercase letter</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                          <div className={`w-1 h-1 rounded-full ${passwordValidation.hasNumber ? 'bg-green-600' : 'bg-gray-400'}`} />
                          <span>One number</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col space-y-4">
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-600 text-white font-medium text-lg shadow-lg"
                      disabled={isLoading || !passwordValidation.isValid || !passwordsMatch}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Updating Password...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>

                    <div className="text-center text-sm text-gray-500">
                      Remember your password?{" "}
                      <Link to="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                        Sign in
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