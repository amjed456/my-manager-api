"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, FolderKanban, Bell, User } from "lucide-react"
import { useEffect, useState } from "react"
import { authService } from "@/services"
import { Badge } from "@/components/ui/badge"
import { useNotifications } from "@/hooks/useNotifications"

export default function MobileNavbar() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const { unreadCount } = useNotifications()
  
  useEffect(() => {
    setIsLoggedIn(authService.isAuthenticated())
  }, [])

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true
    if (path !== "/" && pathname.startsWith(path)) return true
    return false
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
      <div className="flex justify-around items-center h-16">
        <Link href="/" className="flex flex-col items-center justify-center w-full">
          <div
            className={`flex flex-col items-center justify-center ${isActive("/") ? "text-primary" : "text-muted-foreground"}`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>

        <Link href="/projects" className="flex flex-col items-center justify-center w-full">
          <div
            className={`flex flex-col items-center justify-center ${isActive("/projects") ? "text-primary" : "text-muted-foreground"}`}
          >
            <FolderKanban className="h-5 w-5" />
            <span className="text-xs mt-1">Projects</span>
          </div>
        </Link>

        <Link href="/alerts" className="flex flex-col items-center justify-center w-full">
          <div
            className={`flex flex-col items-center justify-center ${isActive("/alerts") ? "text-primary" : "text-muted-foreground"}`}
          >
            <div className="relative">
            <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Badge>
              )}
            </div>
            <span className="text-xs mt-1">Alerts</span>
          </div>
        </Link>

        <Link href="/profile" className="flex flex-col items-center justify-center w-full">
          <div
            className={`flex flex-col items-center justify-center ${isActive("/profile") ? "text-primary" : "text-muted-foreground"}`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
