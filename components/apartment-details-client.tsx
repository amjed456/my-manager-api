"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Building, Calendar, Clock, ShieldAlert } from "lucide-react"
import MobileNavbar from "@/components/mobile-navbar"
import { apartmentService } from "@/services"
import { Apartment } from "@/services"
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
import SiteNotesList from "./site-notes-list"
import FieldInstructionsList from "./field-instructions-list"
import ProgressList from "./progress-list"

export default function ApartmentDetailsClient({ apartmentId }: { apartmentId: string }) {
  const router = useRouter()
  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isPermissionError, setIsPermissionError] = useState(false)
  const [currentUserId, setCurrentUserId] = useState("")
  const [updating, setUpdating] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const fetchApartment = async () => {
      try {
        console.log('=== APARTMENT DETAILS AUTH CHECK ===');
        console.log('Apartment ID received:', apartmentId);
        
        // Check if user is authenticated first
        const isAuth = authService.isAuthenticated();
        console.log('Authentication result:', isAuth);
        
        if (!isAuth) {
          console.log('User not authenticated, redirecting to home');
          setAuthChecked(true)
          if (typeof window !== 'undefined') {
            console.log('Performing redirect to home page');
            // Instead of immediate redirect, let's show an error first
            setError("Authentication required. Please log in.");
            setIsLoading(false);
            return;
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
          
          // If profile fetch fails with 401, user is not authenticated
          if (profileErr?.response?.status === 401) {
            console.log('Profile fetch failed with 401 - user not authenticated');
            authService.logout();
            setError("Session expired. Please log in again.");
            setIsLoading(false);
            return;
          }
        }

        // Debug the ID parameter
        console.log("Apartment ID parameter:", apartmentId)
        
        if (!apartmentId) {
          console.error("Apartment ID is undefined or empty")
          setError("Invalid apartment ID")
          setIsLoading(false)
          return
        }

        setIsLoading(true)
        console.log("Fetching apartment with ID:", apartmentId)
        try {
          const data = await apartmentService.getApartmentById(apartmentId)
          console.log("Apartment data received:", data)
          setApartment(data)
          setIsPermissionError(false)
        } catch (fetchErr: any) {
          console.error("API error details:", fetchErr?.response?.data)
          throw fetchErr
        }
      } catch (err: any) {
        console.error("Failed to fetch apartment:", err)
        
        // Handle specific error cases
        if (err?.response?.status === 401) {
          console.log("Authentication error - setting error message instead of redirect")
          authService.logout()
          setError("Authentication failed. Please log in again.");
          setIsLoading(false);
          return
        } else if (err?.response?.status === 404) {
          setError("Apartment not found. It may have been deleted.")
          setIsPermissionError(false)
        } else if (err?.response?.status === 403) {
          setError("You don't have permission to view this apartment.")
          setIsPermissionError(true)
        } else {
          setError(`Failed to load apartment: ${err?.message || "Unknown error"}`)
          setIsPermissionError(false)
        }
        
        toast.error("Failed to load apartment details")
      } finally {
        setIsLoading(false)
      }
    }

    if (apartmentId) {
      console.log('Apartment ID provided, starting fetch process:', apartmentId);
      fetchApartment()
    } else {
      console.error("No apartment ID provided:", apartmentId)
      setError("Invalid apartment ID")
      setIsLoading(false)
    }
  }, [apartmentId, router])

  // Update apartment status
  const handleStatusChange = async (newStatus: string) => {
    if (!apartment) return
    
    try {
      setUpdating(true)
      
      const updateData = {
        status: newStatus as 'Not Started' | 'In Progress' | 'Completed'
      }
      
      const updatedApartment = await apartmentService.updateApartment(apartmentId, updateData)
      
      setApartment(updatedApartment)
      toast.success(`Apartment status updated to ${newStatus}`)
    } catch (err) {
      console.error("Failed to update apartment status:", err)
      toast.error("Failed to update apartment status")
    } finally {
      setUpdating(false)
    }
  }

  if (!authChecked || isLoading) {
    return (
      <div className="flex min-h-screen flex-col pb-16 items-center justify-center">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading apartment details...</p>
        </div>
        <MobileNavbar />
      </div>
    )
  }

  if (error || !apartment) {
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
                You don't have permission to view this apartment.
              </p>
            </>
          ) : (
            <p className="text-red-500">{error || "Apartment not found"}</p>
          )}
          <Button className="mt-4" onClick={() => router.push("/projects")}>
            Back to Projects
          </Button>
        </div>
        <MobileNavbar />
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return "bg-gray-500"
      case "In Progress":
        return "bg-blue-500"
      case "Completed":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="flex min-h-screen flex-col pb-16">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Apartment Details</h1>
      </div>

      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-5 w-5" />
              {apartment.name}
            </h2>
            {apartment.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {apartment.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center">
            <Badge className={getStatusColor(apartment.status)}>
              {apartment.status}
            </Badge>
          </div>
        </div>

        <div className="mt-4 p-3 border rounded-md bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Apartment Status:</span>
            <div className="w-48">
              <Select
                value={apartment.status}
                onValueChange={handleStatusChange}
                disabled={updating}
              >
                <SelectTrigger className="h-8">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{apartment.progress}%</span>
          </div>
          <Progress value={apartment.progress} className="h-2" />
        </div>

        <div className="flex justify-between mt-4">
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mr-1" />
            <span>Created: {new Date(apartment.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>#{apartment.number}</span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="progress">Project Progress</TabsTrigger>
            <TabsTrigger value="notes">Site Notes</TabsTrigger>
            <TabsTrigger value="instructions">Field Instructions</TabsTrigger>
          </TabsList>
          <TabsContent value="progress" className="p-4">
            <ProgressList apartmentId={apartmentId} />
          </TabsContent>
          <TabsContent value="notes" className="p-4">
            <SiteNotesList apartmentId={apartmentId} />
          </TabsContent>
          <TabsContent value="instructions" className="p-4">
            <FieldInstructionsList apartmentId={apartmentId} />
          </TabsContent>
        </Tabs>
      </div>

      <MobileNavbar />
    </div>
  )
} 