"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Plus, Building, Calendar, Clock } from "lucide-react"
import { apartmentService, Apartment } from "@/services"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ApartmentListProps {
  projectId: string
  onApartmentUpdate?: () => void
}

export default function ApartmentList({ projectId, onApartmentUpdate }: ApartmentListProps) {
  const router = useRouter()
  const [apartments, setApartments] = useState<Apartment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newApartment, setNewApartment] = useState({
    name: "",
    number: 1,
    description: ""
  })

  useEffect(() => {
    fetchApartments()
  }, [projectId])

  const fetchApartments = async () => {
    try {
      setIsLoading(true)
      setError("")
      const data = await apartmentService.getApartmentsByProject(projectId)
      // Ensure data is an array
      setApartments(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Failed to fetch apartments:", err)
      setError(err?.response?.data?.message || "Failed to load apartments")
      setApartments([]) // Set empty array on error
      toast.error("Failed to load apartments")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateApartment = async () => {
    if (!newApartment.name.trim()) {
      toast.error("Apartment name is required")
      return
    }

    try {
      setIsCreating(true)
      await apartmentService.createApartment(projectId, {
        name: newApartment.name.trim(),
        number: newApartment.number,
        description: newApartment.description.trim()
      })
      
      toast.success("Apartment created successfully")
      setIsCreateDialogOpen(false)
      setNewApartment({ name: "", number: 1, description: "" })
      fetchApartments()
      onApartmentUpdate?.()
    } catch (err: any) {
      console.error("Failed to create apartment:", err)
      toast.error(err?.response?.data?.message || "Failed to create apartment")
    } finally {
      setIsCreating(false)
    }
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

  const handleApartmentClick = (apartmentId: string) => {
    // Use query parameters for static export compatibility
    router.push(`/apartments/details/?id=${apartmentId}`)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Apartments</h3>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Apartment
          </Button>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Apartments</h3>
          <Button onClick={fetchApartments}>
            <Plus className="h-4 w-4 mr-2" />
            Add Apartment
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchApartments} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Apartments ({apartments.length})</h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Apartment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Apartment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Apartment Name</Label>
                <Input
                  id="name"
                  value={newApartment.name}
                  onChange={(e) => setNewApartment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Apartment 1, Unit A"
                />
              </div>
              <div>
                <Label htmlFor="number">Apartment Number</Label>
                <Input
                  id="number"
                  type="number"
                  min="1"
                  value={newApartment.number}
                  onChange={(e) => setNewApartment(prev => ({ ...prev, number: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={newApartment.description}
                  onChange={(e) => setNewApartment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the apartment..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateApartment} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Apartment"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {apartments.length === 0 ? (
        <div className="text-center py-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No apartments created yet</p>
          <p className="text-sm text-gray-400">Create your first apartment to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {apartments.map((apartment) => (
            <Card 
              key={apartment._id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleApartmentClick(apartment._id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      {apartment.name}
                    </CardTitle>
                    {apartment.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {apartment.description}
                      </p>
                    )}
                  </div>
                  <Badge className={getStatusColor(apartment.status)}>
                    {apartment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{apartment.progress}%</span>
                    </div>
                    <Progress value={apartment.progress} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created {new Date(apartment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>#{apartment.number}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 