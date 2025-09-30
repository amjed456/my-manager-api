"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, ArrowLeft, InfoIcon } from "lucide-react"
import MobileNavbar from "@/components/mobile-navbar"
import { cn } from "@/lib/utils"
import { projectService } from "@/services"
import { authService } from "@/services"
import { toast } from "sonner"
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from "@/components/ui/alert"

export default function NewProject() {
  const router = useRouter()
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fetch current user ID on component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (!authService.isAuthenticated()) {
          router.push("/")
          return
        }

        const userData = await authService.getProfile()
        setCurrentUserId(userData._id)
        console.log("Current user ID for project creation:", userData._id)
      } catch (error) {
        console.error("Failed to fetch user profile:", error)
        toast.error("Failed to load user profile. Please try logging in again.")
        router.push("/")
      }
    }

    fetchCurrentUser()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!date) {
      toast.error("Please select a deadline date")
      return
    }

    if (!currentUserId) {
      toast.error("Unable to create project: User ID not available")
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Create the project (user will be automatically set as owner)
      await projectService.createProject({
        name,
        description,
        dueDate: date.toISOString(),
      })
      
      toast.success("Project created successfully")
      router.push("/projects")
    } catch (error) {
      console.error("Failed to create project:", error)
      toast.error("Failed to create project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Create New Project</h1>
      </div>

      <div className="flex-1 p-4">
        <Alert className="mb-4">
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            You will be added as the owner of this project. This project will contain apartments that you can manage.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Project Name
            </label>
            <Input 
              id="name" 
              placeholder="Enter project name" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea 
              id="description" 
              placeholder="Describe your project" 
              rows={4} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Deadline</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || !currentUserId}>
            {isSubmitting ? "Creating..." : "Create Project"}
          </Button>
        </form>
      </div>

      <MobileNavbar />
    </div>
  )
}
