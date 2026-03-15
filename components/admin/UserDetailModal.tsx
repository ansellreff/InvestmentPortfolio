'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Phone,
  Shield,
  Wallet,
  Star,
  Activity,
  Trash2,
  Edit,
  Crown,
  CheckCircle,
  XCircle,
  Key,
} from 'lucide-react'

interface UserDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string | null
  onRefresh: () => void
}

interface UserDetails {
  user: {
    id: string
    email: string
    name: string | null
    isAdmin: boolean
    role: string | null
    dateOfBirth: string | null
    phone: string | null
    location: string | null
    timezone: string | null
    bio: string | null
    website: string | null
    emailVerified: string | null
    createdAt: string
    updatedAt: string
    lastLoginAt: string | null
    _count: {
      portfolios: number
      favorites: number
      activityLogs: number
      binanceAssets: number
      dividends: number
      priceAlerts: number
    }
  }
  portfolio: Array<{
    id: string
    symbol: string
    name: string
    type: string
    quantity: number
    avgBuyPrice: number
    currency: string
    createdAt: string
  }>
  favorites: Array<{
    id: string
    instrument: {
      symbol: string
      name: string
      type: string
    }
    createdAt: string
  }>
  recentActivity: Array<{
    id: string
    action: string
    description: string | null
    createdAt: string
  }>
  preferences: {
    defaultCurrency: string
    theme: string | null
    language: string | null
    notificationsEnabled: boolean
    emailAlerts: boolean
  } | null
}

export function UserDetailModal({ open, onOpenChange, userId, onRefresh }: UserDetailModalProps) {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deletingPortfolio, setDeletingPortfolio] = useState<string | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [resetSuccess, setResetSuccess] = useState('')

  useEffect(() => {
    if (open && userId) {
      fetchUserDetails()
    }
  }, [open, userId])

  const fetchUserDetails = async () => {
    if (!userId) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) {
        throw new Error('Failed to fetch user details')
      }
      const data = await res.json()
      setUserDetails(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!userId) return
    if (!confirm('Are you sure you want to delete this portfolio item?')) {
      return
    }

    setDeletingPortfolio(portfolioId)

    try {
      const res = await fetch(`/api/admin/users/${userId}?portfolioId=${portfolioId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        await fetchUserDetails()
        onRefresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to delete portfolio item')
      }
    } catch (err) {
      setError('Failed to delete portfolio item')
    } finally {
      setDeletingPortfolio(null)
    }
  }

  const handlePasswordReset = async () => {
    if (!userId) return
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setResettingPassword(true)
    setError('')
    setResetSuccess('')

    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        setResetSuccess(data.message || 'Password reset successfully')
        setNewPassword('')
        setTimeout(() => {
          setShowPasswordReset(false)
          setResetSuccess('')
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password')
      }
    } catch (err) {
      setError('Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!userDetails) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px]">
          <div className="text-center py-8 text-slate-500">No user details available</div>
        </DialogContent>
      </Dialog>
    )
  }

  const { user, portfolio, favorites, recentActivity, preferences } = userDetails

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details
          </DialogTitle>
          <DialogDescription>View and manage user information and portfolio</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            {/* User Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {user.name?.[0] || user.email[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{user.name || 'No name'}</h3>
                        {user.isAdmin && (
                          <Badge className="bg-purple-600">
                            <Crown className="h-3 w-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {user.emailVerified ? (
                      <div title="Email verified">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    ) : (
                      <div title="Email not verified">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Joined:</span>
                    <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-500">Last Login:</span>
                    <span>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Phone:</span>
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-500">Location:</span>
                      <span>{user.location}</span>
                    </div>
                  )}
                </div>
                {user.bio && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-slate-600 dark:text-slate-400">{user.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Portfolio Items</CardDescription>
                  <CardTitle className="text-2xl">{user._count.portfolios}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Watchlist</CardDescription>
                  <CardTitle className="text-2xl">{user._count.favorites}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Activities</CardDescription>
                  <CardTitle className="text-2xl">{user._count.activityLogs}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Password Reset */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!showPasswordReset ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPasswordReset(true)}
                    className="w-full"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset User Password
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                        className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                        minLength={8}
                      />
                    </div>
                    {resetSuccess && (
                      <p className="text-sm text-green-600">{resetSuccess}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handlePasswordReset}
                        disabled={resettingPassword || newPassword.length < 8}
                      >
                        {resettingPassword ? 'Resetting...' : 'Reset Password'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowPasswordReset(false)
                          setNewPassword('')
                          setError('')
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences */}
            {preferences && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preferences</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Currency:</span>
                    <span className="font-medium">{preferences.defaultCurrency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Theme:</span>
                    <span className="font-medium capitalize">{preferences.theme}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Notifications:</span>
                    <span className="font-medium">{preferences.notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Portfolio Items ({portfolio.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {portfolio.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">No portfolio items</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Avg Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolio.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.symbol}</TableCell>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.type}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                              {item.avgBuyPrice.toFixed(2)} {item.currency}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePortfolio(item.id)}
                                disabled={deletingPortfolio === item.id}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="watchlist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Watchlist Items ({favorites.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favorites.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">No watchlist items</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Added</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {favorites.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.instrument.symbol}</TableCell>
                            <TableCell>{item.instrument.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.instrument.type}</Badge>
                            </TableCell>
                            <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <p className="text-center text-slate-500 py-4">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                        <Activity className="h-4 w-4 text-slate-400 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.action}</p>
                          {activity.description && (
                            <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 whitespace-nowrap">
                          {new Date(activity.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
