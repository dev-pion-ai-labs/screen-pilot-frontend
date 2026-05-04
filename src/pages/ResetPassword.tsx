"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Clapperboard, ArrowLeft, Eye, EyeOff, CheckCircle, AlertTriangle } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/hooks/useAuth"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  // Recovery mode is gated strictly on Supabase's PASSWORD_RECOVERY event
  // (or its persisted flag from useAuth). A regular signed-in session is
  // NOT enough — the previous code let any logged-in user reset their
  // password by hitting this URL.
  const { isPasswordRecovery } = useAuth()
  const [isWaitingForPasswordRecovery, setIsWaitingForPasswordRecovery] = useState(!isPasswordRecovery)
  const [canResetPassword, setCanResetPassword] = useState(isPasswordRecovery)
  const [isPasswordReset, setIsPasswordReset] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    let recoveryFired = isPasswordRecovery

    if (recoveryFired) {
      setIsWaitingForPasswordRecovery(false)
      setCanResetPassword(true)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "PASSWORD_RECOVERY") {
          recoveryFired = true
          setIsWaitingForPasswordRecovery(false)
          setCanResetPassword(true)
          toast({
            title: "Reset Link Verified",
            description: "You can now set your new password.",
          })
        } else if (event === "SIGNED_OUT") {
          recoveryFired = false
          setIsWaitingForPasswordRecovery(true)
          setCanResetPassword(false)
        }
      }
    )

    // Show "invalid link" only if the recovery event hasn't fired within
    // the first 10s. recoveryFired flips off the timer effect when the
    // event lands, so a slow event after the timeout still recovers.
    const timeout = setTimeout(() => {
      if (recoveryFired) return
      setIsWaitingForPasswordRecovery(false)
      setCanResetPassword(false)
    }, 10000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const validatePassword = (pass: string) => {
    const minLength = pass.length >= 8
    const hasUpper = /[A-Z]/.test(pass)
    const hasLower = /[a-z]/.test(pass)
    const hasNumber = /\d/.test(pass)

    return {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
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
      // Update user password as per Supabase docs
      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      } else if (data) {
        setIsPasswordReset(true)
        toast({
          title: "Password Updated Successfully",
          description: "Your password has been changed. You will be redirected to sign in.",
        })
        
        // Sign out user and redirect to login after 3 seconds
        setTimeout(async () => {
          await supabase.auth.signOut()
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

  // Waiting for password recovery event
  if (isWaitingForPasswordRecovery) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Verifying reset link...</p>
          <p className="text-sm text-white/70 mt-2">Please wait while we verify your password reset request.</p>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (!canResetPassword) {
    return (
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
                  This password reset link is invalid or has expired. Please request a new one.
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
    )
  }

  // Success state
  if (isPasswordReset) {
    return (
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
                  Your password has been successfully changed. You will be redirected to sign in shortly.
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
    )
  }

  // Password reset form
  return (
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
                  Your reset link has been verified. Enter your new password below.
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
  )
}