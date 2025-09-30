"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { authService, adminService } from "@/services"
import { FolderKanban, LogOut, Users, Bell } from "lucide-react"
import ProjectList from "@/components/project-list"
import MobileNavbar from "@/components/mobile-navbar"
import AdminUserManagement from "@/components/admin-user-management"
import AdminSubscriptions from "@/components/admin-subscriptions"
import PageHeader from "@/components/page-header"

export default function HomePage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const authenticated = authService.isAuthenticated()
      setIsLoggedIn(authenticated)
      setAuthLoading(false)
      
      // Check if user is admin
      if (authenticated) {
        checkAdminStatus()
      }
    }
  }, [])
  
  const checkAdminStatus = async () => {
    try {
      const isUserAdmin = await adminService.isAdmin()
      setIsAdmin(isUserAdmin)
    } catch (error) {
      console.error("Failed to check admin status:", error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== LOGIN FORM SUBMISSION ===');
    console.log('Username:', username);
    console.log('Password length:', password.length);
    
    if (!username || !password) {
      console.log('Validation failed: missing username or password');
      toast.error("Please enter both username and password")
      return
    }
    
    try {
      setIsLoading(true)
      console.log('Calling authService.login...');
      const userData = await authService.login({ username, password })
      console.log('Login successful, user data:', userData);
      toast.success("Login successful")
      setIsLoggedIn(true)
      setIsAdmin(userData.role === 'admin')
    } catch (error) {
      console.error("Login failed:", error)
      toast.error("Login failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('=== REGISTER FORM SUBMISSION ===');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Password length:', password.length);
    console.log('Confirm password length:', confirmPassword.length);
    
    if (!username || !password || !name || !email) {
      console.log('Validation failed: missing required fields');
      toast.error("Please fill in all required fields")
      return
    }
    
    if (password.length < 6) {
      console.log('Validation failed: password too short');
      toast.error("Password must be at least 6 characters long")
      return
    }
    
    if (password !== confirmPassword) {
      console.log('Validation failed: passwords do not match');
      toast.error("Passwords don't match")
      return
    }
    
    try {
      setIsLoading(true)
      console.log('Calling authService.register...');
      const userData = await authService.register({
        username,
        password,
        name,
        email
      })
      console.log('Registration successful, user data:', userData);
      toast.success("Registration successful!")
      setIsLoggedIn(true)
      setIsAdmin(userData.role === 'admin')
    } catch (error) {
      console.error("Registration failed:", error)
      toast.error("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleLogout = () => {
    authService.logout()
    setIsLoggedIn(false)
    setIsAdmin(false)
    toast.success("Logged out successfully")
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (isLoggedIn) {
    return (
      <div className="flex min-h-screen flex-col pb-16">
        <PageHeader onSignOut={handleLogout}>
          <Link href="/projects">
            <Button size="sm">
              <FolderKanban className="h-4 w-4 mr-2" />
              My Projects
            </Button>
          </Link>
        </PageHeader>
        
        {/* Centered page title */}
        <h1 className="text-xl font-bold text-center my-4">Home</h1>

        <div className="p-4 flex-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 text-center">Welcome to Project Manager</h2>
              <p className="mb-6 text-center">You are successfully logged in. You can now manage your projects and tasks.</p>
              <div className="flex justify-center">
                <Link href="/projects">
                  <Button className="w-full max-w-[200px]">
                    <FolderKanban className="h-4 w-4 mr-2" />
                    Go to My Projects
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Admin Panel</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-center">As an administrator, you have access to additional system features.</p>
                <div className="flex flex-col items-center space-y-3">
                  <Button 
                    onClick={() => setAdminDialogOpen(true)}
                    className="w-full max-w-[200px]"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Users
                  </Button>
                  <Button 
                    onClick={() => setNotificationsDialogOpen(true)}
                    className="w-full max-w-[200px]"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Manage Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <MobileNavbar />
        
        {/* Admin User Management Dialog */}
        <AdminUserManagement 
          open={adminDialogOpen}
          onOpenChange={setAdminDialogOpen}
        />
        
        {/* Admin Notifications Management Dialog */}
        <AdminSubscriptions
          open={notificationsDialogOpen}
          onOpenChange={setNotificationsDialogOpen}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Project Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="login-username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label htmlFor="register-name" className="text-sm font-medium">
                    Full Name
                  </label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-username" className="text-sm font-medium">
                    Username
                  </label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium">
                    Password
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Choose a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-confirm-password" className="text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Registering..." : "Register"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
