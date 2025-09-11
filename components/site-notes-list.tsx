"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Eye, MapPin, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import SiteNoteForm from "./site-note-form"
import { toast } from "sonner"
import { siteNoteService } from "@/services/siteNoteService"

interface SiteNote {
  _id: string
  noteType: string
  priority: string
  title: string
  description: string
  location: string
  images: Array<{
    url: string
    caption?: string
    uploadedAt?: string
  }>
  createdAt: string
}

interface SiteNotesListProps {
  apartmentId: string
}

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-red-600 text-white"
}

export default function SiteNotesList({ apartmentId }: SiteNotesListProps) {
  const [siteNotes, setSiteNotes] = useState<SiteNote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<SiteNote | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchSiteNotes()
  }, [apartmentId])

  const fetchSiteNotes = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const data = await siteNoteService.getSiteNotes(apartmentId)
      setSiteNotes(data)
    } catch (err: any) {
      console.error("Failed to fetch site notes:", err)
      setError(err?.response?.data?.message || "Failed to load site notes")
      toast.error("Failed to load site notes")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    fetchSiteNotes()
  }

  const handleViewNote = (note: SiteNote) => {
    setSelectedNote(note)
    setIsViewDialogOpen(true)
  }

  const getPriorityCount = (priority: string) => {
    const count = siteNotes.filter(note => note.priority === priority).length
    console.log(`Priority count for "${priority}":`, count, 'Notes:', siteNotes.map(n => n.priority))
    return count
  }

  const getCriticalNotes = () => {
    return siteNotes.filter(note => note.priority === "Critical" || note.priority === "High")
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Site Notes</h3>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
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
          <h3 className="text-lg font-semibold">Site Notes</h3>
          <Button onClick={fetchSiteNotes}>
            <Plus className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchSiteNotes} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const criticalNotes = getCriticalNotes()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Site Notes</h3>
          <p className="text-sm text-muted-foreground">
            {siteNotes.length} notes • {criticalNotes.length} high priority
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Site Note</DialogTitle>
            </DialogHeader>
            <SiteNoteForm
              apartmentId={apartmentId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Priority Summary */}
      {siteNotes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600">Low</div>
            <div className="text-lg font-semibold text-green-800">{getPriorityCount("Low")}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-sm text-yellow-600">Medium</div>
            <div className="text-lg font-semibold text-yellow-800">{getPriorityCount("Medium")}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="text-sm text-red-600">High</div>
            <div className="text-lg font-semibold text-red-800">{getPriorityCount("High")}</div>
          </div>
          <div className="bg-red-100 p-3 rounded-lg">
            <div className="text-sm text-red-700">Critical</div>
            <div className="text-lg font-semibold text-red-900">{getPriorityCount("Critical")}</div>
          </div>
        </div>
      )}

      {siteNotes.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No site notes yet</p>
          <p className="text-sm text-gray-400">Start logging observations and issues</p>
        </div>
      ) : (
        <div className="space-y-4">
          {siteNotes.map((note) => (
            <Card key={note._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{note.title}</CardTitle>
                      <Badge className={PRIORITY_COLORS[note.priority as keyof typeof PRIORITY_COLORS]}>
                        {note.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {note.noteType}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {note.location || "No location"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {note.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {note.images.length > 0 && (
                      <Badge variant="outline">
                        {note.images.length} photos
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created {format(new Date(note.createdAt), "PPp")}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewNote(note)}
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

      {/* View Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Site Note Details</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{selectedNote.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedNote.createdAt), "PPP")}
                  </p>
                </div>
                <Badge className={PRIORITY_COLORS[selectedNote.priority as keyof typeof PRIORITY_COLORS]}>
                  {selectedNote.priority}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {selectedNote.noteType}
                </div>
                <div>
                  <span className="font-medium">Location:</span> {selectedNote.location || "Not specified"}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Description</h5>
                <p className="text-sm whitespace-pre-wrap">{selectedNote.description}</p>
              </div>

              {selectedNote.images.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Photos ({selectedNote.images.length})</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedNote.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.url}
                        alt={`Site note photo ${index + 1}`}
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