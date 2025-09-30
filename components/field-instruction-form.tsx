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
import { CalendarIcon, Upload, X, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { fieldInstructionService } from "@/services/fieldInstructionService"

interface FieldInstructionFormProps {
  apartmentId: string
  onSuccess: () => void
  onCancel: () => void
}

const INSTRUCTION_TYPES = [
  "Construction Task",
  "Installation",
  "Repair/Maintenance",
  "Inspection",
  "Safety Protocol",
  "Quality Control",
  "Material Handling",
  "Equipment Operation",
  "Other"
]

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-600 text-white" }
]

interface Step {
  id: string
  description: string
  order: number
}

export default function FieldInstructionForm({ apartmentId, onSuccess, onCancel }: FieldInstructionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState("")
  const [instructionType, setInstructionType] = useState("")
  const [priority, setPriority] = useState("medium")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [assignedTo, setAssignedTo] = useState("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [materials, setMaterials] = useState("")
  const [tools, setTools] = useState("")
  const [safetyNotes, setSafetyNotes] = useState("")
  const [steps, setSteps] = useState<Step[]>([])
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

  const addStep = () => {
    const newStep: Step = {
      id: Date.now().toString(),
      description: "",
      order: steps.length + 1
    }
    setSteps(prev => [...prev, newStep])
  }

  const updateStep = (id: string, description: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, description } : step
    ))
  }

  const removeStep = (id: string) => {
    setSteps(prev => {
      const filtered = prev.filter(step => step.id !== id)
      // Reorder remaining steps
      return filtered.map((step, index) => ({ ...step, order: index + 1 }))
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    if (!instructionType) {
      toast.error("Please select an instruction type")
      return
    }

    if (!description.trim()) {
      toast.error("Please enter a description")
      return
    }

    if (steps.length === 0) {
      toast.error("Please add at least one step")
      return
    }

    // Validate steps
    const validSteps = steps.filter(step => step.description.trim())
    if (validSteps.length !== steps.length) {
      toast.error("Please fill in all step descriptions")
      return
    }

    try {
      setIsSubmitting(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('instructionType', instructionType)
      formData.append('priority', priority)
      formData.append('description', description.trim())
      formData.append('location', location.trim())
      formData.append('assignedTo', assignedTo.trim())
      if (dueDate) {
        formData.append('dueDate', dueDate.toISOString())
      }
      formData.append('materials', materials.trim())
      formData.append('tools', tools.trim())
      formData.append('safetyNotes', safetyNotes.trim())
      formData.append('steps', JSON.stringify(validSteps))
      
      photos.forEach((photo, index) => {
        formData.append('photos', photo)
      })

      await fieldInstructionService.createFieldInstruction(apartmentId, formData)
      
      toast.success("Field instruction created successfully")
      onSuccess()
    } catch (error) {
      console.error("Failed to create field instruction:", error)
      toast.error("Failed to create field instruction")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Create Field Instruction</h3>
        <p className="text-sm text-muted-foreground">
          Create detailed instructions for field work tasks.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title for the instruction"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructionType">Instruction Type</Label>
            <Select value={instructionType} onValueChange={setInstructionType}>
              <SelectTrigger>
                <SelectValue placeholder="Select instruction type" />
              </SelectTrigger>
              <SelectContent>
                {INSTRUCTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Kitchen, Bathroom, Exterior"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assigned To</Label>
            <Input
              id="assignedTo"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Worker name or team"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of the work to be done..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="materials">Required Materials</Label>
            <Textarea
              id="materials"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder="List required materials..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tools">Required Tools</Label>
            <Textarea
              id="tools"
              value={tools}
              onChange={(e) => setTools(e.target.value)}
              placeholder="List required tools..."
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="safetyNotes">Safety Notes</Label>
          <Textarea
            id="safetyNotes"
            value={safetyNotes}
            onChange={(e) => setSafetyNotes(e.target.value)}
            placeholder="Important safety considerations..."
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Due Date (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Select due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar 
                mode="single" 
                selected={dueDate} 
                onSelect={setDueDate} 
                initialFocus 
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Work Steps</Label>
            <Button type="button" size="sm" onClick={addStep}>
              <Plus className="h-4 w-4 mr-1" />
              Add Step
            </Button>
          </div>
          
          {steps.length === 0 ? (
            <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
              <p className="text-gray-500">No steps added yet</p>
              <p className="text-sm text-gray-400">Click "Add Step" to create work instructions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {step.order}
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={step.description}
                      onChange={(e) => updateStep(step.id, e.target.value)}
                      placeholder={`Step ${step.order}: Describe what needs to be done...`}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => removeStep(step.id)}
                    className="flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Reference Photos (Optional)</Label>
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
                      alt={`Instruction photo ${index + 1}`}
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
            {isSubmitting ? "Creating..." : "Create Instruction"}
          </Button>
        </div>
      </form>
    </div>
  )
} 