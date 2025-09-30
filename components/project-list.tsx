"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Shield } from "lucide-react"
import { projectService } from "@/services"
import { authService } from "@/services"
import { Project } from "@/services/projectService"

// Types for the component props
interface ProjectListProps {
  searchQuery?: string
  statusFilter?: string
  sortBy?: string
}

export default function ProjectList({ searchQuery = "", statusFilter = "all", sortBy = "newest" }: ProjectListProps) {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Fetch current user id and projects on component mount
  useEffect(() => {
    const fetchUserAndProjects = async () => {
      try {
        // Check authentication first
        if (!authService.isAuthenticated()) {
          router.push("/")
          return
        }
        
        setLoading(true)
        
        // Try to get user profile to know current user ID
        try {
          const userData = await authService.getProfile()
          setCurrentUserId(userData._id)
          console.log("Current user ID:", userData._id)
        } catch (profileErr) {
          console.error("Failed to fetch user profile:", profileErr)
        }
        
        const data = await projectService.getAllProjects()
        console.log("Fetched projects:", data)
        setProjects(data)
        setError("")
      } catch (err: any) {
        console.error("Failed to fetch projects:", err)
        
        // Handle 401 Unauthorized specifically
        if (err?.response?.status === 401) {
          authService.logout()
          router.push("/")
          return
        }
        
        setError("Failed to load projects. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndProjects()
  }, [router])

  // Filter and sort projects based on props
  const filteredProjects = useMemo(() => {
    // First filter by search query
    let filtered = projects.filter(project => 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      project.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    
    // Then filter by status
    if (statusFilter !== "all") {
      const statusMap: Record<string, string> = {
        "planning": "Planning",
        "in-progress": "In Progress",
        "completed": "Completed"
      }
      filtered = filtered.filter(project => project.status === statusMap[statusFilter])
    }
    
    // Then sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()
        case "oldest":
          return new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
        case "deadline":
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case "progress":
          return b.progress - a.progress
        default:
          return 0
      }
    })
  }, [projects, searchQuery, statusFilter, sortBy])

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No projects found matching your criteria.</p>
      </div>
    )
  }

  const isProjectOwner = (project: Project) => {
    if (!currentUserId) return false;
    return typeof project.owner === 'string' 
      ? project.owner === currentUserId
      : project.owner._id === currentUserId;
  };

  return (
    <div className="space-y-4">
      {filteredProjects.map((project) => {
        // Skip any projects with invalid IDs
        if (!project._id) {
          console.error("Project with missing ID:", project);
          return null;
        }
        
        const isOwner = isProjectOwner(project);
        
        return (
          <Link href={`/projects/details?id=${project._id}`} key={project._id}>
          <Card className="hover:bg-muted/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center">
                  <h3 className="font-medium">{project.name}</h3>
                      {isOwner && (
                        <Badge className="ml-2 bg-blue-500" variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                    </div>
                  <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                </div>
                <Badge variant={project.status === "Completed" ? "default" : "outline"} className="ml-2">
                  {project.status}
                </Badge>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              <div className="flex justify-between mt-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                    <span>Due: {new Date(project.dueDate).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        );
      })}
    </div>
  )
}
