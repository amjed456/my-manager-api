"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, FolderKanban, Info, Loader2, RefreshCcw, Search, X } from "lucide-react"
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { adminService, projectService } from "@/services"
import { Project } from "@/services/projectService"
import { toast } from "sonner"

interface ProjectSubscription {
  _id: string;
  user: string;
  project: {
    _id: string;
    name: string;
    description: string;
    status: string;
    progress: number;
  };
  isSubscribed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminSubscriptionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminSubscriptions({ open, onOpenChange }: AdminSubscriptionsProps) {
  const router = useRouter()
  const [subscriptions, setSubscriptions] = useState<ProjectSubscription[]>([])
  const [allProjects, setAllProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  
  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open])
  
  useEffect(() => {
    if (search) {
      const lowercaseSearch = search.toLowerCase();
      setFilteredProjects(
        allProjects.filter(
          project => project.name.toLowerCase().includes(lowercaseSearch)
        )
      );
    } else {
      setFilteredProjects(allProjects);
    }
  }, [search, allProjects]);
  
  const fetchData = async () => {
    try {
      setLoading(true)
      setError("")
      
      // Get all projects
      const projectsData = await projectService.getAllProjects()
      setAllProjects(projectsData)
      setFilteredProjects(projectsData)
      
      // Get subscriptions
      const subscriptionsData = await adminService.getProjectSubscriptions()
      setSubscriptions(subscriptionsData)
    } catch (err: any) {
      console.error("Failed to fetch subscription data:", err)
      setError("Failed to load subscription data. " + (err.message || ""))
    } finally {
      setLoading(false)
    }
  }
  
  const refreshData = async () => {
    setRefreshing(true)
    await fetchData()
    setRefreshing(false)
  }
  
  const toggleSubscription = async (projectId: string) => {
    try {
      await adminService.toggleProjectSubscription(projectId)
      
      // Update local state
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.project._id === projectId 
            ? { ...sub, isSubscribed: !sub.isSubscribed } 
            : sub
        )
      )
      
      toast.success("Notification preference updated")
    } catch (err) {
      console.error("Failed to update subscription:", err)
      toast.error("Failed to update notification preference")
    }
  }
  
  // Get subscription status for a project
  const getSubscriptionStatus = (projectId: string): boolean => {
    const sub = subscriptions.find(s => s.project._id === projectId)
    return sub ? sub.isSubscribed : false
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto w-[95%] sm:w-[90%] md:w-[85%] lg:w-[80%]">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            Notification Management
          </DialogTitle>
          <DialogDescription className="text-base">
            Toggle notifications for projects you want to monitor as an administrator
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center justify-between mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshData} 
            disabled={refreshing}
            className="ml-2"
          >
            <RefreshCcw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Info className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <Button size="sm" onClick={refreshData}>Try Again</Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-8">
            <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-2 text-lg font-medium">No projects found</p>
            <p className="text-sm text-muted-foreground">
              {search ? 'Try a different search term' : 'There are no projects in the system'}
            </p>
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-md border">
            <Table>
              <TableCaption>Turn off Any Notifications You Don't Want</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: "50%" }}>Project</TableHead>
                  <TableHead style={{ width: "20%" }}>Status</TableHead>
                  <TableHead style={{ width: "30%", paddingLeft: "0px" }}>Notifications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const isSubscribed = getSubscriptionStatus(project._id);
                  
                  return (
                    <TableRow key={project._id}>
                      <TableCell className="font-medium py-4">
                        <span className="font-medium text-base">{project.name}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge 
                          variant={project.status === "Completed" ? "default" : "outline"}
                          className="px-3 py-1"
                        >
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center justify-start gap-6">
                          <Switch
                            checked={isSubscribed}
                            onCheckedChange={() => toggleSubscription(project._id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground flex items-center mt-4 pt-2 border-t">
          <FolderKanban className="h-4 w-4 mr-2" />
          <span>As an admin, you can receive notifications from any project in the system</span>
        </div>
      </DialogContent>
    </Dialog>
  )
} 