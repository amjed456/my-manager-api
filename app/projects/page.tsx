"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, SlidersHorizontal, LogOut } from "lucide-react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import ProjectList from "@/components/project-list"
import MobileNavbar from "@/components/mobile-navbar"
import PageHeader from "@/components/page-header"
import { authService } from "@/services"
import { toast } from "sonner"

export default function ProjectsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")

  useEffect(() => {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.push("/")
    }
  }, [router])
  
  const handleSignOut = () => {
    authService.logout()
    toast.success("Signed out successfully")
    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <PageHeader onSignOut={handleSignOut}>
        <Link href="/projects/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </PageHeader>
      
      {/* Centered page title */}
      <h1 className="text-xl font-bold text-center my-4">Projects</h1>

      <div className="p-4 border-b">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center">
            <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Input 
                type="text" 
                placeholder="Search projects..." 
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select 
              defaultValue="all" 
              onValueChange={setStatusFilter}
              value={statusFilter}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select 
              defaultValue="newest" 
              onValueChange={setSortBy}
              value={sortBy}
            >
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-4 flex-1">
        <ProjectList 
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          sortBy={sortBy}
        />
      </div>

      <MobileNavbar />
    </div>
  )
} 