'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar, User, Mail, Lock, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react"

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  dateOfBirth: string
  phone: string
  location: string
  timezone: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
  dateOfBirth?: string
}

interface ValidationError {
  path: string[]
  message: string
}

interface SignupData {
  user?: {
    id: string
    email: string
    name: string
  }
  message?: string
  requireVerification?: boolean
  error?: string
  details?: ValidationError[]
}

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showVerification, setShowVerification] = useState(false)
  const [userEmail, setUserEmail] = useState("")

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    phone: "",
    location: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateStep1 = () => {
    const newErrors: FormErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and number"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: FormErrors = {}

    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      if (age < 18) {
        newErrors.dateOfBirth = "You must be at least 18 years old"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setError("Please agree to the Terms of Service")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          dateOfBirth: formData.dateOfBirth || null,
          phone: formData.phone || null,
          location: formData.location || null,
          timezone: formData.timezone,
        }),
      })

      const data: SignupData = await response.json()

      if (!response.ok) {
        // Show detailed validation errors if available
        if (data.details && data.details.length > 0) {
          const errorMessages = data.details.map(d => d.message).join(", ")
          setError(`${data.error}: ${errorMessages}`)
        } else {
          setError(data.error || "Something went wrong")
        }
        return
      }

      // Check if email verification is required
      if (data.requireVerification && data.user) {
        setUserEmail(data.user.email)
        setShowVerification(true)
        setSuccess(data.message || "Account created successfully! Please check your email to verify your account.")
      } else {
        setSuccess("Account created successfully! Redirecting to sign in...")
        setTimeout(() => {
          router.push("/auth/signin?registered=true")
        }, 2000)
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
    }
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const passwordStrength = () => {
    const password = formData.password
    if (!password) return { score: 0, label: "Enter a password", color: "bg-slate-200" }

    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" }
    if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" }
    if (score <= 4) return { score, label: "Good", color: "bg-blue-500" }
    return { score, label: "Strong", color: "bg-green-500" }
  }

  // Show verification screen after signup
  if (showVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 flex items-center justify-center">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
            <CardDescription>We've sent a verification link to your email</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="text-center space-y-2">
              <p className="text-slate-600 dark:text-slate-400">
                We've sent a verification email to:
              </p>
              <p className="font-medium text-lg bg-slate-100 dark:bg-slate-800 py-2 px-4 rounded-md">
                {userEmail}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What's next?</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>1. Check your email inbox (and spam folder)</li>
                <li>2. Click the verification link in the email</li>
                <li>3. Sign in to your account</li>
              </ul>
            </div>

            <div className="text-center space-y-3">
              <p className="text-sm text-slate-500">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerification(false)
                  setSuccess("")
                  // Resend verification
                  fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail }),
                  }).then(() => {
                    alert('Verification email resent!')
                  })
                }}
                className="w-full"
              >
                Resend Verification Email
              </Button>
            </div>
          </CardContent>

          <CardFooter>
            <p className="text-sm text-slate-600 dark:text-slate-400 w-full text-center">
              Already verified?{" "}
              <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 flex items-center justify-center">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
            <User className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Create Your Account</CardTitle>
          <CardDescription>Join thousands of investors tracking their portfolios</CardDescription>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2 mt-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`h-2 w-8 rounded-full transition-all ${
                  step >= s ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                }`} />
                {s < 3 && <div className={`h-0.5 w-4 ${step > s ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Step {step} of 3: {step === 1 ? "Account Info" : step === 2 ? "Profile Details" : "Complete"}
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 rounded-lg flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {success}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={errors.name ? "border-red-500" : ""}
                  disabled={isLoading}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isLoading}
                  autoComplete="email"
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={errors.password ? "border-red-500" : ""}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

                {/* Password Strength */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= passwordStrength().score ? passwordStrength().color : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">
                      Password strength: <span className={passwordStrength().score >= 4 ? "text-green-600" : ""}>{passwordStrength().label}</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Date of Birth (Optional)
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className={errors.dateOfBirth ? "border-red-500" : ""}
                  disabled={isLoading}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  placeholder="New York, USA"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="py-6">
                <h3 className="font-semibold text-lg mb-4">Review Your Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600 dark:text-slate-400">Name</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600 dark:text-slate-400">Email</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  {formData.dateOfBirth && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-600 dark:text-slate-400">Date of Birth</span>
                      <span className="font-medium">{new Date(formData.dateOfBirth).toLocaleDateString()}</span>
                    </div>
                  )}
                  {formData.phone && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-600 dark:text-slate-400">Phone</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                  )}
                  {formData.location && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-slate-600 dark:text-slate-400">Location</span>
                      <span className="font-medium">{formData.location}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-slate-600 dark:text-slate-400">Timezone</span>
                    <span className="font-medium">{formData.timezone}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <Checkbox
                    id="terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-slate-600 dark:text-slate-400 leading-tight cursor-pointer"
                  >
                    I agree to the <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>. I understand that my data will be stored securely.
                  </label>
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>🎁 Bonus:</strong> By creating an account, you'll get:
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                    <li>✓ Portfolio tracking with real-time P&L</li>
                    <li>✓ Personalized watchlist across devices</li>
                    <li>✓ Investment simulator with history</li>
                    <li>✓ Technical analysis alerts</li>
                  </ul>
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <div className="flex gap-2 w-full">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={isLoading}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              type="button"
              onClick={step === 3 ? handleSubmit : nextStep}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Creating Account..." : step === 3 ? "Create Account" : (
                <>Next Step <ArrowRight className="h-4 w-4 ml-2" /></>
              )}
            </Button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/auth/signin" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
