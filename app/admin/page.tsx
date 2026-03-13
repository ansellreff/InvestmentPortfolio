'use client'

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Navigation } from "@/components/Navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Search, Trash2, Shield, Database, Activity, Download, RefreshCw, Crown, Calendar, Mail, MapPin, Eye } from "lucide-react"
import { UserDetailModal } from "@/components/admin/UserDetailModal"

interface UserData {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  role: string | null
  createdAt: string
  lastLoginAt: string | null
  _count: {
    portfolios: number
    favorites: number
    activityLogs: number
  }
}

interface StatsData {
  totalUsers: number
  totalPortfolios: number
  totalFavorites: number
  totalActivities: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<UserData[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalPortfolios: 0,
    totalFavorites: 0,
    totalActivities: 0,
  })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [userDetailOpen, setUserDetailOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated") {
      checkAdminAndFetch()
    }
  }, [status, session, router])

  const checkAdminAndFetch = async () => {
    // First check if user is admin
    try {
      const res = await fetch("/api/admin/check")
      if (!res.ok) {
        router.push("/")
        return
      }
      await Promise.all([fetchUsers(), fetchStats()])
    } catch {
      router.push("/")
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/admin/users?page=${page}&search=${search}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data.users)
        setTotalPages(data.data.pagination.pages)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats")
      if (res.ok) {
        const data = await res.json()
        setStats(data.data)
      }
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" })
      if (res.ok) {
        await Promise.all([fetchUsers(), fetchStats()])
      } else {
        const data = await res.json()
        setError(data.error || "Failed to delete user")
      }
    } catch (error) {
      setError("Failed to delete user")
    }
  }

  const handleSetAdmin = async (userId: string, makeAdmin: boolean) => {
    try {
      const res = await fetch("/api/admin/users/set-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin: makeAdmin }),
      })
      if (res.ok) {
        await fetchUsers()
      }
    } catch (error) {
      setError("Failed to update user role")
    }
  }

  const handleExportDatabase = async () => {
    try {
      const res = await fetch("/api/admin/export-database")
      if (res.ok) {
        const data = await res.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `investment-advisor-db-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
      }
    } catch (error) {
      setError("Failed to export database")
    }
  }

  useEffect(() => {
    if (page > 1 || search) {
      const timer = setTimeout(() => fetchUsers(), 500)
      return () => clearTimeout(timer)
    }
  }, [page, search])

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

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Manage users and database</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => Promise.all([fetchUsers(), fetchStats()])}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportDatabase}>
              <Download className="h-4 w-4 mr-2" />
              Export DB
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Portfolios</CardDescription>
              <CardTitle className="text-3xl">{stats.totalPortfolios}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Watchlist Items</CardDescription>
              <CardTitle className="text-3xl">{stats.totalFavorites}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Activities</CardDescription>
              <CardTitle className="text-3xl">{stats.totalActivities}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>View and manage all users</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Portfolio</TableHead>
                    <TableHead>Watchlist</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.name || "No name"}</p>
                            <p className="text-sm text-slate-500">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge className="bg-purple-600">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">-</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-500">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Never"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user._count.portfolios}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{user._count.favorites}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUserId(user.id)
                                setUserDetailOpen(true)
                              }}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetAdmin(user.id, !user.isAdmin)}
                              title={user.isAdmin ? "Remove admin" : "Make admin"}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                              title="Delete user"
                              disabled={user.id === session?.user?.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <h4 className="font-semibold mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => window.open("/_admin/prisma", "_blank")}>
                    <Database className="h-4 w-4 mr-2" />
                    Open Prisma Studio
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleExportDatabase}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Full Database
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <h4 className="font-semibold mb-2">Admin Commands</h4>
                <p className="text-sm text-slate-500 mb-2">Run these in your terminal:</p>
                <code className="block text-xs bg-slate-100 dark:bg-slate-900 p-2 rounded">
                  npx prisma studio
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        <UserDetailModal
          open={userDetailOpen}
          onOpenChange={(open) => {
            setUserDetailOpen(open)
            if (!open) setSelectedUserId(null)
          }}
          userId={selectedUserId}
          onRefresh={async () => {
            await Promise.all([fetchUsers(), fetchStats()])
          }}
        />
      </main>
    </div>
  )
}
