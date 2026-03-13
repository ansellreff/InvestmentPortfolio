'use client'

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation } from "@/components/Navigation"
import {
  User,
  Save,
  LogOut,
  Shield,
  Bell,
  Key,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Camera,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react"
import { signOut } from "next-auth/react"
import { CurrencySelector } from "@/components/ui/CurrencySelector"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()

  // Profile state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [dateOfBirth, setDateOfBirth] = useState("")
  const [bio, setBio] = useState("")
  const [website, setWebsite] = useState("")

  // Preferences
  const [defaultCurrency, setDefaultCurrency] = useState("USD")
  const [theme, setTheme] = useState("system")
  const [language, setLanguage] = useState("en")
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)

  // Password change
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState(false)

  // UI state
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type?: "success" | "error"; text?: string } | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      fetchUserData()
    }
  }, [status, session, router])

  const fetchUserData = async () => {
    setLoading(true)
    try {
      // Fetch preferences
      const prefRes = await fetch("/api/user/preferences")
      if (prefRes.ok) {
        const data = await prefRes.json()
        setDefaultCurrency(data.data.defaultCurrency || "USD")
        setTheme(data.data.theme || "system")
        setLanguage(data.data.language || "en")
        setNotificationsEnabled(data.data.notificationsEnabled ?? true)
        setEmailAlerts(data.data.emailAlerts ?? true)
      }

      // Fetch full user profile
      const userRes = await fetch("/api/user/profile")
      if (userRes.ok) {
        const userData = await userRes.json()
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
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setMessage(undefined)

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, location, dateOfBirth, bio, website }),
      })

      if (res.ok) {
        setMessage({ type: "success", text: "Profile updated successfully!" })
        // Update session
        await update({ name })
      } else {
        const data = await res.json()
        setMessage({ type: "error", text: data.error || "Failed to update profile" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile" })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(undefined), 5000)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    setMessage(undefined)

    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultCurrency, theme, language, notificationsEnabled, emailAlerts }),
      })

      if (res.ok) {
        setMessage({ type: "success", text: "Preferences saved successfully!" })
      } else {
        setMessage({ type: "error", text: "Failed to save preferences" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save preferences" })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(undefined), 5000)
    }
  }

  const handleChangePassword = async () => {
    setSaving(true)
    setMessage(undefined)

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" })
      setSaving(false)
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters" })
      setSaving(false)
      return
    }

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setMessage({ type: "success", text: "Password changed successfully!" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await res.json()
        setMessage({ type: "error", text: data.error || "Failed to change password" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to change password" })
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(undefined), 5000)
    }
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Profile Overview Card */}
        <Card className="mb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 bg-white text-blue-600 text-xl font-bold">
                {getInitials()}
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{name || "User"}</h2>
                <p className="text-blue-100">{email}</p>
                {location && <p className="text-blue-200 text-sm flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</p>}
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Member since</p>
                <p className="font-semibold">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Bell className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="account">
              <Key className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-slate-50 dark:bg-slate-800"
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
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    className="w-full min-h-[100px] px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                    maxLength={500}
                  />
                  <p className="text-xs text-slate-500">{bio.length}/500 characters</p>
                </div>

                {message && message.text && (
                  <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}>
                    {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {message.text}
                  </div>
                )}

                <Button onClick={handleSaveProfile} disabled={saving} className="w-full md:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Display Settings</h3>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Default Currency</Label>
                      <CurrencySelector
                        value={defaultCurrency}
                        onChange={setDefaultCurrency}
                        label=""
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950"
                      >
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="id">Bahasa Indonesia</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <div className="flex gap-2">
                      {["light", "dark", "system"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setTheme(t)}
                          className={`px-4 py-2 rounded-lg capitalize ${
                            theme === t
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold">Notifications</h3>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div>
                        <p className="font-medium">Enable Notifications</p>
                        <p className="text-sm text-slate-500">Receive in-app notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={(e) => setNotificationsEnabled(e.target.checked)}
                        className="h-5 w-5 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div>
                        <p className="font-medium">Email Alerts</p>
                        <p className="text-sm text-slate-500">Receive price alerts via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={emailAlerts}
                        onChange={(e) => setEmailAlerts(e.target.checked)}
                        className="h-5 w-5 rounded"
                      />
                    </label>
                  </div>
                </div>

                {message && message.text && (
                  <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}>
                    {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    {message.text}
                  </div>
                )}

                <Button onClick={handleSavePreferences} disabled={saving} className="w-full md:w-auto">
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your password and security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Change Password</h3>

                  <div className="space-y-3">
                    <div className="relative">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>

                    <div className="relative">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div className="relative">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPasswords ? "Hide" : "Show"} passwords
                    </button>
                  </div>

                  {message && message.text && (
                    <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${
                      message.type === "success"
                        ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                    }`}>
                      {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {message.text}
                    </div>
                  )}

                  <Button onClick={handleChangePassword} disabled={saving}>
                    <Key className="h-4 w-4 mr-2" />
                    {saving ? "Changing..." : "Change Password"}
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <h3 className="font-semibold">Login History</h3>
                  <p className="text-sm text-slate-500">
                    Last login: {new Date().toLocaleString()}
                  </p>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <p className="text-sm font-medium">Current session</p>
                    <p className="text-xs text-slate-500">{session?.user?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Management</CardTitle>
                <CardDescription>Manage your account data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Export Your Data</h3>
                  <p className="text-sm text-slate-500">Download all your data in JSON format</p>
                  <Button variant="outline" onClick={async () => {
                    const res = await fetch("/api/user/export")
                    if (res.ok) {
                      const data = await res.json()
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement("a")
                      a.href = url
                      a.download = `investment-advisor-data-${new Date().toISOString().split('T')[0]}.json`
                      a.click()
                    }
                  }}>
                    <Save className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h3 className="font-semibold text-red-600">Danger Zone</h3>
                  <p className="text-sm text-slate-500">Irreversible actions</p>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                        const res = await fetch("/api/user/account", { method: "DELETE" })
                        if (res.ok) {
                          signOut({ callbackUrl: "/" })
                        }
                      }
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
