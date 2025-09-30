"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Users, Clock, ShieldAlert, Shield, Building } from "lucide-react"
import MobileNavbar from "@/components/mobile-navbar"
import ApartmentList from "@/components/apartment-list"
import { projectService } from "@/services"
import { Project } from "@/services/projectService"
import { authService } from "@/services"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function ProjectDetailsClient({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [progress, setProgress] = useState(0)
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isPermissionError, setIsPermissionError] = useState(false)
  const [currentUserId, setCurrentUserId] = useState("")
  const [updating, setUpdating] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log('=== PROJECT DETAILS AUTH CHECK ===');
        console.log('Window available:', typeof window !== 'undefined');
        console.log('Auth service available:', typeof authService !== 'undefined');
        
        // Check if user is authenticated first
        const isAuth = authService.isAuthenticated();
        console.log('Authentication result:', isAuth);
        
        if (!isAuth) {
          console.log('User not authenticated, redirecting to home');
          setAuthChecked(true)
          if (typeof window !== 'undefined') {
            console.log('Performing redirect to home page');
            window.location.href = '/';
          }
          return
        }
        
        setAuthChecked(true)
        console.log('Authentication passed, proceeding with profile fetch...');

        // Get user profile to determine if user is owner
        try {
          console.log('Fetching user profile...');
          const userData = await authService.getProfile()
          console.log('User profile fetched successfully:', userData._id);
          setCurrentUserId(userData._id)
        } catch (profileErr: any) {
          console.error("Failed to fetch user profile:", profileErr);
          console.error("Profile error details:", profileErr?.response?.status, profileErr?.response?.data);
          
          // If profile fetch fails with 401, user is not authenticated
          if (profileErr?.response?.status === 401) {
            console.log('Profile fetch failed with 401 - user not authenticated');
            authService.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/';
            }
            return;
          }
        }

        // Debug the ID parameter
        console.log("Project ID parameter:", projectId)
        console.log("Project ID type:", typeof projectId)
        console.log("Project ID valid:", Boolean(projectId))
        
        if (!projectId) {
          console.error("Project ID is undefined or empty")
          setError("Invalid project ID")
          setIsLoading(false)
          return
        }

        setIsLoading(true)
        console.log("Fetching project with ID:", projectId)
        try {
          const data = await projectService.getProjectById(projectId)
          console.log("Project data received:", data)
          setProject(data)
          setProgress(data.progress || 0)
          setIsPermissionError(false)
        } catch (fetchErr: any) {
          console.error("API error details:", fetchErr?.response?.data)
          throw fetchErr
        }
      } catch (err: any) {
        console.error("Failed to fetch project:", err)
        console.log("Error response:", err?.response)
        console.log("Error message:", err?.message)
        
        // Handle specific error cases
        if (err?.response?.status === 401) {
          console.log("Authentication error - redirecting to home")
          authService.logout()
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
          return
        } else if (err?.response?.status === 404) {
          setError("Project not found. It may have been deleted.")
          setIsPermissionError(false)
        } else if (err?.response?.status === 403) {
          setError("You don't have permission to view this project.")
          setIsPermissionError(true)
        } else {
          setError(`Failed to load project: ${err?.message || "Unknown error"}`)
          setIsPermissionError(false)
        }
        
        toast.error("Failed to load project details")
      } finally {
        setIsLoading(false)
      }
    }

    if (projectId) {
      console.log('Project ID provided, starting fetch process:', projectId);
      fetchProject()
    } else {
      console.error("No project ID provided:", projectId)
      setError("Invalid project ID")
      setIsLoading(false)
    }
  }, [projectId, router])

  // Check if current user is the project owner
  const isOwner = (): boolean => {
    if (!project || !currentUserId) return false
    
    const ownerId = typeof project.owner === 'object' 
      ? project.owner._id 
      : project.owner
      
    return ownerId === currentUserId
  }
  
  // Update project status
  const handleStatusChange = async (newStatus: string) => {
    if (!project || !isOwner()) return
    
    try {
      setUpdating(true)
      
      // Create update data with only the status
      const updateData = {
        status: newStatus as 'Planning' | 'In Progress' | 'Completed'
      }
      
      // Call API to update project
      const updatedProject = await projectService.updateProject(projectId, updateData)
      
      // Update local state
      setProject(updatedProject)
      toast.success(`Project status updated to ${newStatus}`)
    } catch (err) {
      console.error("Failed to update project status:", err)
      toast.error("Failed to update project status")
    } finally {
      setUpdating(false)
    }
  }

  // Handle apartment updates
  const handleApartmentUpdate = () => {
    // Refresh project data to update progress
    if (project) {
      projectService.getProjectById(projectId).then(updatedProject => {
        setProject(updatedProject)
        setProgress(updatedProject.progress || 0)
      }).catch(err => {
        console.error("Failed to refresh project data:", err)
      })
    }
  }

  if (!authChecked || isLoading) {
    return (
      <div className="flex min-h-screen flex-col pb-16 items-center justify-center">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading project details...</p>
        </div>
        <MobileNavbar />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen flex-col pb-16 items-center justify-center">
        <div className="text-center py-12">
          {isPermissionError ? (
            <>
              <div className="flex justify-center mb-4">
                <ShieldAlert className="h-12 w-12 text-red-500" />
              </div>
              <p className="text-red-500 font-medium text-lg mb-2">Access Denied</p>
              <p className="text-muted-foreground mb-4">
                You don't have permission to view this project. Only project owners can access it.
              </p>
            </>
          ) : (
            <p className="text-red-500">{error || "Project not found"}</p>
          )}
          <Button className="mt-4" onClick={() => router.push("/projects")}>
            Back to Projects
          </Button>
        </div>
        <MobileNavbar />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Project Details</h1>
      </div>

      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {project.description}
            </p>
          </div>
          
          <div className="flex items-center">
            {isOwner() && (
              <Badge className="mr-2 bg-blue-500" variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Owner
              </Badge>
            )}
            <Badge variant={project.status === "Completed" ? "default" : "outline"}>
              {project.status}
            </Badge>
          </div>
        </div>

        {isOwner() && (
          <div className="mt-4 p-3 border rounded-md bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Project Status:</span>
              <div className="w-48">
                <Select
                  value={project.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              As the project owner, you can update the project status.
            </p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex justify-between mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Building className="h-4 w-4 mr-1" />
            <span>Building Project</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <ApartmentList projectId={projectId} onApartmentUpdate={handleApartmentUpdate} />
      </div>

      <MobileNavbar />
    </div>
  )
} 