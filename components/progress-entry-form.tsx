"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { progressService } from "@/services/progressService"

interface ProgressEntryFormProps {
  apartmentId: string
  onSuccess: () => void
  onCancel: () => void
}

interface ProgressEntryData {
  date: Date
  workDescription: string
  hoursWorked: number
  photos: File[]
}

export default function ProgressEntryForm({ apartmentId, onSuccess, onCancel }: ProgressEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [date, setDate] = useState<Date>(new Date())
  const [workDescription, setWorkDescription] = useState("")
  const [hoursWorked, setHoursWorked] = useState(8)
  const [photos, setPhotos] = useState<File[]>([])
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (validFiles.length !== files.length) {
      toast.error("Please select only image files")
      return
    }

    if (photos.length + validFiles.length > 10) {
      toast.error("Maximum 10 photos allowed")
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
    
    if (!workDescription.trim()) {
      toast.error("Please enter a work description")
      return
    }

    if (hoursWorked <= 0 || hoursWorked > 24) {
      toast.error("Please enter valid hours worked (1-24)")
      return
    }

    try {
      setIsSubmitting(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('date', date.toISOString())
      formData.append('workDescription', workDescription.trim())
      formData.append('hoursWorked', hoursWorked.toString())
      
      photos.forEach((photo, index) => {
        formData.append('photos', photo)
      })

      await progressService.createProgressEntry(apartmentId, formData)
      
      toast.success("Progress entry created successfully")
      onSuccess()
    } catch (error) {
      console.error("Failed to create progress entry:", error)
      toast.error("Failed to create progress entry")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Add Daily Progress Entry</h3>
        <p className="text-sm text-muted-foreground">
          Log your daily work progress with photos and descriptions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Label htmlFor="hoursWorked">Hours Worked</Label>
          <Input
            id="hoursWorked"
            type="number"
            min="0.5"
            max="24"
            step="0.5"
            value={hoursWorked}
            onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
            placeholder="8"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workDescription">Work Description</Label>
          <Textarea
            id="workDescription"
            value={workDescription}
            onChange={(e) => setWorkDescription(e.target.value)}
            placeholder="Describe the work completed today..."
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
                {photos.length}/10
              </span>
            </div>
            
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {photoUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Progress photo ${index + 1}`}
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
            {isSubmitting ? "Creating..." : "Create Entry"}
          </Button>
        </div>
      </form>
    </div>
  )
} 