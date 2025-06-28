"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { siteNoteService } from "@/services/siteNoteService"

interface SiteNoteFormProps {
  apartmentId: string
  onSuccess: () => void
  onCancel: () => void
}

const NOTE_TYPES = [
  "General Observation",
  "Issue/Problem",
  "Safety Concern",
  "Quality Check",
  "Material Delivery",
  "Equipment Issue",
  "Weather Impact",
  "Other"
]

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
  { value: "critical", label: "Critical", color: "bg-red-600 text-white" }
]

export default function SiteNoteForm({ apartmentId, onSuccess, onCancel }: SiteNoteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [noteType, setNoteType] = useState("")
  const [priority, setPriority] = useState("medium")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (validFiles.length !== files.length) {
      toast.error("Please select only image files")
      return
    }

    if (photos.length + validFiles.length > 5) {
      toast.error("Maximum 5 photos allowed")
      return
    }

    setPhotos(prev => [...prev, ...validFiles])
    
    // Create preview URLs
    validFiles.forEach(file => {
      const url = URL.createObjectURL(file)
      setPhotoUrls(prev => [...prev, url])
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPhotoUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index)
      // Revoke the URL to free memory
      URL.revokeObjectURL(prev[index])
      return newUrls
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!noteType) {
      toast.error("Please select a note type")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a description")
      return
    }

    try {
      setIsSubmitting(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('date', date.toISOString())
      formData.append('noteType', noteType)
      formData.append('priority', priority)
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('location', location.trim())
      
      photos.forEach((photo, index) => {
        formData.append('photos', photo)
      })

      await siteNoteService.createSiteNote(apartmentId, formData)
      
      toast.success("Site note created successfully")
      onSuccess()
    } catch (error) {
      console.error("Failed to create site note:", error)
      toast.error("Failed to create site note")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Add Site Note</h3>
        <p className="text-sm text-muted-foreground">
          Log observations, issues, or important information about the site.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
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
                <Calendar 
                  mode="single" 
                  selected={date} 
                  onSelect={(day) => day && setDate(day)} 
                  initialFocus 
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="noteType">Note Type</Label>
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger>
                <SelectValue placeholder="Select note type" />
              </SelectTrigger>
              <SelectContent>
                {NOTE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs ${level.color}`}>
                        {level.label}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Kitchen, Bathroom, Exterior"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief title for the note"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the observation or issue..."
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Photos (Optional)</Label>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">
                {photos.length}/5
              </span>
            </div>
            
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Site note photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removePhoto(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Note"}
          </Button>
        </div>
      </form>
    </div>
  )
} 