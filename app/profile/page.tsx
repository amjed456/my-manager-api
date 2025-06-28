"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { 
  Card, 
  CardContent, 
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { 
  Settings, 
  UserRound, 
  Bell, 
  Moon, 
  Sun, 
  LogOut,
  Briefcase,
  CheckCircle,
  Loader2
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import MobileNavbar from "@/components/mobile-navbar"
import { authService } from "@/services"
import { toast } from "sonner"
import { UserData } from "@/services/authService"

export default function ProfilePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)

  // Load user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push("/")
          return
        }

        setIsLoading(true)
        const user = await authService.getProfile()
        setUserData(user)
        
        // Set preferences from user data if available
        if (user.preferences) {
          setDarkMode(user.preferences.darkMode || false)
          setNotifications(user.preferences.notifications || true)
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
        toast.error("Failed to load profile data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleSignOut = () => {
    authService.logout()
    toast.success("Signed out successfully")
    router.push("/")
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col pb-16 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading profile...</p>
        <MobileNavbar />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex min-h-screen flex-col pb-16 items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Failed to load profile</p>
          <Button className="mt-4" onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </div>
        <MobileNavbar />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="flex items-center p-4 border-b">
        <h1 className="text-xl font-bold">Profile</h1>
      </div>
      
      <div className="flex-1 p-4">
        <div className="flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4 overflow-hidden relative">
            {userData.profilePicture ? (
              <Image 
                src={userData.profilePicture} 
                alt={userData.name} 
                fill 
                className="object-cover" 
              />
            ) : (
              <UserRound className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-xl font-bold">{userData.name}</h2>
          <p className="text-sm text-muted-foreground">{userData.jobTitle || "No job title set"}</p>
        </div>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Your basic account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{userData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">@{userData.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Job Title</p>
                    <p className="font-medium">{userData.jobTitle || "Not set"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{userData.department || "Not set"}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="mt-2">Edit Details</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Your account information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Account type:</span>
                    <span className="font-medium capitalize">{userData.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Username:</span>
                    <span className="font-medium">@{userData.username}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Moon className="h-4 w-4" />
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                  </div>
                  <Switch 
                    id="dark-mode" 
                    checked={darkMode} 
                    onCheckedChange={setDarkMode} 
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <Label htmlFor="notifications">Notifications</Label>
                  </div>
                  <Switch 
                    id="notifications" 
                    checked={notifications} 
                    onCheckedChange={setNotifications} 
                  />
                </div>
                <Separator />
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="mt-4"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest actions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center p-4 text-muted-foreground">
                  <p>Activity tracking is not available yet.</p>
                  <p className="text-sm mt-1">This feature will be available in a future update.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <MobileNavbar />
    </div>
  )
} 