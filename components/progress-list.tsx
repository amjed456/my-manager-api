"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, Image, Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import ProgressEntryForm from "./progress-entry-form"
import { toast } from "sonner"
import { progressService } from "@/services/progressService"

interface ProgressEntry {
  _id: string
  date: string
  workDescription: string
  hoursWorked: number
  photos: string[]
  createdAt: string
}

interface ProgressListProps {
  apartmentId: string
}

export default function ProgressList({ apartmentId }: ProgressListProps) {
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<ProgressEntry | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchProgressEntries()
  }, [apartmentId])

  const fetchProgressEntries = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const data = await progressService.getProgressEntries(apartmentId)
      setProgressEntries(data)
    } catch (err: any) {
      console.error("Failed to fetch progress entries:", err)
      setError(err?.response?.data?.message || "Failed to load progress entries")
      toast.error("Failed to load progress entries")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    fetchProgressEntries()
  }

  const handleViewEntry = (entry: ProgressEntry) => {
    setSelectedEntry(entry)
    setIsViewDialogOpen(true)
  }

  const getTotalHours = () => {
    return progressEntries.reduce((total, entry) => total + entry.hoursWorked, 0)
  }

  const getTotalPhotos = () => {
    return progressEntries.reduce((total, entry) => total + entry.photos.length, 0)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Project Progress</h3>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
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
          <h3 className="text-lg font-semibold">Project Progress</h3>
          <Button onClick={fetchProgressEntries}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchProgressEntries} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Project Progress</h3>
          <p className="text-sm text-muted-foreground">
            {progressEntries.length} entries • {getTotalHours()} hours • {getTotalPhotos()} photos
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Progress Entry</DialogTitle>
            </DialogHeader>
            <ProgressEntryForm
              apartmentId={apartmentId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {progressEntries.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No progress entries yet</p>
          <p className="text-sm text-gray-400">Start logging your daily work progress</p>
        </div>
      ) : (
        <div className="space-y-4">
          {progressEntries.map((entry) => (
            <Card key={entry._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(entry.date), "PPP")}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {entry.workDescription}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {entry.hoursWorked}h
                    </Badge>
                    {entry.photos.length > 0 && (
                      <Badge variant="outline">
                        <Image className="h-3 w-3 mr-1" />
                        {entry.photos.length}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created {format(new Date(entry.createdAt), "PPp")}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewEntry(entry)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Entry Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Progress Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">
                    {format(new Date(selectedEntry.date), "PPP")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedEntry.hoursWorked} hours worked
                  </p>
                </div>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {selectedEntry.hoursWorked}h
                </Badge>
              </div>
              
              <div>
                <h5 className="font-medium mb-2">Work Description</h5>
                <p className="text-sm whitespace-pre-wrap">{selectedEntry.workDescription}</p>
              </div>

              {selectedEntry.photos.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Photos ({selectedEntry.photos.length})</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedEntry.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Progress photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 