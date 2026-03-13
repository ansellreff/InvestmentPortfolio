'use client'

import { useState, useRef, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Settings, User, LayoutDashboard, UserCircle, Shield } from "lucide-react"

export function UserMenu() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (session?.user?.name) {
      const names = session.user.name.split(" ")
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      }
      return session.user.name[0].toUpperCase()
    }
    if (session?.user?.email) {
      return session.user.email[0].toUpperCase()
    }
    return "U"
  }

  if (status === "loading") {
    return (
      <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 animate-pulse rounded-md" />
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/auth/signin")}>
          Sign In
        </Button>
        <Button size="sm" onClick={() => router.push("/auth/signup")}>
          Sign Up
        </Button>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Avatar className="h-5 w-5">
          <AvatarFallback className="text-xs bg-blue-600 text-white">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
        <span className="font-medium">
          {session?.user?.name || session?.user?.email?.split("@")[0]}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {session?.user?.email}
            </p>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                router.push("/dashboard")
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => {
                router.push("/profile")
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              <span>My Profile</span>
            </button>

            {session?.user?.isAdmin && (
              <button
                onClick={() => {
                  router.push("/admin")
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-blue-600 dark:text-blue-400"
              >
                <Shield className="h-4 w-4" />
                <span>Admin Panel</span>
              </button>
            )}

            <button
              onClick={() => {
                router.push("/settings")
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
