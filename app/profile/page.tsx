'use client'

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation } from "@/components/Navigation"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  FileText,
  Camera,
  Save,
  CheckCircle,
  AlertCircle,
  Settings,
  ArrowLeft
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ProfilePage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Profile state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/profile")
    } else if (status === "authenticated") {
      fetchUserData()
    }
  }, [status, router])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/profile")
      if (res.ok) {
        const userData = await res.json()
        const user = userData.data
        setName(user.name || "")
        setEmail(user.email || "")
        setPhone(user.phone || "")
        setLocation(user.location || "")
        setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.split('T')[0] : "")
        setBio(user.bio || "")
        setWebsite(user.website || "")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      showToast("error", "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, location, dateOfBirth, bio, website }),
      })

      if (res.ok) {
        showToast("success", "Profile updated successfully!")
        await update({ name })
      } else {
        const data = await res.json()
        showToast("error", data.error || "Failed to update profile")
      }
    } catch (error) {
      showToast("error", "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 5000)
  }

  const getInitials = () => {
    if (name) {
      const names = name.split(" ")
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return name[0].toUpperCase()
    }
    if (email) {
      return email[0].toUpperCase()
    }
    return "U"
  }

  const getAvatarColor = () => {
    const colors = [
      'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-red-600',
      'bg-orange-600', 'bg-yellow-600', 'bg-green-600', 'bg-teal-600',
      'bg-cyan-600', 'bg-indigo-600'
    ]
    const index = name ? name.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Navigation />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <Link href="/dashboard" className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Profile</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage your personal information and preferences</p>
            </div>
            <Link href="/settings">
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                Advanced Settings
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Profile Card - Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Card */}
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="pt-8 pb-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className={`h-32 w-32 ${getAvatarColor()} text-white text-4xl font-bold border-4 border-white/30 shadow-xl`}>
                    {getInitials()}
                  </Avatar>
                  <h2 className="text-2xl font-bold mt-4">{name || "User"}</h2>
                  <p className="text-blue-100 mt-1">{email}</p>
                  {location && (
                    <p className="text-blue-200 text-sm mt-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </p>
                  )}
                  <div className="mt-6 pt-6 border-t border-white/20 w-full">
                    <p className="text-blue-100 text-sm">Member since</p>
                    <p className="font-semibold">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile Completion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ProfileItem label="Name" completed={!!name} />
                  <ProfileItem label="Email" completed={!!email} />
                  <ProfileItem label="Phone" completed={!!phone} />
                  <ProfileItem label="Location" completed={!!location} />
                  <ProfileItem label="Date of Birth" completed={!!dateOfBirth} />
                  <ProfileItem label="Bio" completed={!!bio} />
                  <ProfileItem label="Website" completed={!!website} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Form - Right Column */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-600" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details. All fields are optional except email.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Basic Information
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">
                        <Mail className="h-4 w-4 inline mr-1" />
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        disabled
                        className="bg-slate-50 dark:bg-slate-800 text-base"
                      />
                      <p className="text-xs text-slate-500">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        <Phone className="h-4 w-4 inline mr-1" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="New York, USA"
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dateOfBirth">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Date of Birth
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="text-base"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className="text-base"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio Section */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    About Me
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself, your investment goals, experience..."
                      className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                      maxLength={500}
                    />
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-slate-500">Share a bit about yourself</p>
                      <p className="text-xs text-slate-500">{bio.length}/500 characters</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {saving ? "Saving Profile..." : "Save Profile"}
                  </Button>
                  <Link href="/settings" className="flex-1">
                    <Button variant="outline" size="lg" className="w-full">
                      <Settings className="h-5 w-5 mr-2" />
                      More Settings
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <Link href="/settings" className="group">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Settings className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Account Settings</h3>
                    <p className="text-sm text-slate-500">Password, theme, language</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/portfolio" className="group">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-colors">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">My Portfolio</h3>
                    <p className="text-sm text-slate-500">View your investments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard" className="group">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Dashboard</h3>
                    <p className="text-sm text-slate-500">Overview & analytics</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}

function ProfileItem({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-600 dark:text-slate-400">{label}</span>
      {completed ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <div className="h-4 w-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
      )}
    </div>
  )
}
