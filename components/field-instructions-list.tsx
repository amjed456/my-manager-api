"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Eye, MapPin, Calendar, User, CheckCircle, Clock } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import FieldInstructionForm from "./field-instruction-form"
import { toast } from "sonner"
import { fieldInstructionService } from "@/services/fieldInstructionService"

interface FieldInstruction {
  _id: string
  title: string
  instructionType: string
  priority: string
  description: string
  location: string
  assignedTo: string
  dueDate?: string
  materials: string
  tools: string
  safetyNotes: string
  steps: Array<{
    id: string
    description: string
    order: number
  }>
  photos: string[]
  status: "pending" | "in-progress" | "completed"
  createdAt: string
}

interface FieldInstructionsListProps {
  apartmentId: string
}

const PRIORITY_COLORS = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
  urgent: "bg-red-600 text-white"
}

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-800",
  "in-progress": "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800"
}

export default function FieldInstructionsList({ apartmentId }: FieldInstructionsListProps) {
  const [instructions, setInstructions] = useState<FieldInstruction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedInstruction, setSelectedInstruction] = useState<FieldInstruction | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    fetchInstructions()
  }, [apartmentId])

  const fetchInstructions = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const data = await fieldInstructionService.getFieldInstructions(apartmentId)
      setInstructions(data)
    } catch (err: any) {
      console.error("Failed to fetch field instructions:", err)
      setError(err?.response?.data?.message || "Failed to load field instructions")
      toast.error("Failed to load field instructions")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    fetchInstructions()
  }

  const handleViewInstruction = (instruction: FieldInstruction) => {
    setSelectedInstruction(instruction)
    setIsViewDialogOpen(true)
  }

  const getStatusCount = (status: string) => {
    return instructions.filter(instruction => instruction.status === status).length
  }

  const getUrgentInstructions = () => {
    return instructions.filter(instruction => 
      instruction.priority === "urgent" || instruction.priority === "high"
    )
  }

  const getOverdueInstructions = () => {
    const today = new Date()
    return instructions.filter(instruction => 
      instruction.dueDate && new Date(instruction.dueDate) < today && instruction.status !== "completed"
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Field Instructions</h3>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Create Instruction
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
          <h3 className="text-lg font-semibold">Field Instructions</h3>
          <Button onClick={fetchInstructions}>
            <Plus className="h-4 w-4 mr-2" />
            Create Instruction
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchInstructions} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const urgentInstructions = getUrgentInstructions()
  const overdueInstructions = getOverdueInstructions()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Field Instructions</h3>
          <p className="text-sm text-muted-foreground">
            {instructions.length} instructions • {urgentInstructions.length} urgent • {overdueInstructions.length} overdue
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Instruction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Field Instruction</DialogTitle>
            </DialogHeader>
            <FieldInstructionForm
              apartmentId={apartmentId}
              onSuccess={handleCreateSuccess}
              onCancel={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Status Summary */}
      {instructions.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-lg font-semibold text-gray-800">{getStatusCount("pending")}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-600">In Progress</div>
            <div className="text-lg font-semibold text-blue-800">{getStatusCount("in-progress")}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm text-green-600">Completed</div>
            <div className="text-lg font-semibold text-green-800">{getStatusCount("completed")}</div>
          </div>
        </div>
      )}

      {instructions.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No field instructions yet</p>
          <p className="text-sm text-gray-400">Create detailed work instructions for your team</p>
        </div>
      ) : (
        <div className="space-y-4">
          {instructions.map((instruction) => (
            <Card key={instruction._id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-base">{instruction.title}</CardTitle>
                      <Badge className={PRIORITY_COLORS[instruction.priority as keyof typeof PRIORITY_COLORS]}>
                        {instruction.priority}
                      </Badge>
                      <Badge className={STATUS_COLORS[instruction.status as keyof typeof STATUS_COLORS]}>
                        {instruction.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {instruction.instructionType}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {instruction.location || "No location"}
                      </span>
                      {instruction.assignedTo && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {instruction.assignedTo}
                        </span>
                      )}
                      {instruction.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(instruction.dueDate), "MMM dd")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {instruction.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {instruction.steps.length} steps
                    </Badge>
                    {instruction.photos.length > 0 && (
                      <Badge variant="outline">
                        {instruction.photos.length} photos
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created {format(new Date(instruction.createdAt), "PPp")}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewInstruction(instruction)}
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

      {/* View Instruction Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Field Instruction Details</DialogTitle>
          </DialogHeader>
          {selectedInstruction && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-lg">{selectedInstruction.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedInstruction.instructionType}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={PRIORITY_COLORS[selectedInstruction.priority as keyof typeof PRIORITY_COLORS]}>
                    {selectedInstruction.priority}
                  </Badge>
                  <Badge className={STATUS_COLORS[selectedInstruction.status as keyof typeof STATUS_COLORS]}>
                    {selectedInstruction.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Location:</span> {selectedInstruction.location || "Not specified"}
                </div>
                <div>
                  <span className="font-medium">Assigned To:</span> {selectedInstruction.assignedTo || "Not assigned"}
                </div>
                {selectedInstruction.dueDate && (
                  <div>
                    <span className="font-medium">Due Date:</span> {format(new Date(selectedInstruction.dueDate), "PPP")}
                  </div>
                )}
                <div>
                  <span className="font-medium">Created:</span> {format(new Date(selectedInstruction.createdAt), "PPP")}
                </div>
              </div>

              <div>
                <h5 className="font-medium mb-2">Description</h5>
                <p className="text-sm whitespace-pre-wrap">{selectedInstruction.description}</p>
              </div>

              {selectedInstruction.materials && (
                <div>
                  <h5 className="font-medium mb-2">Required Materials</h5>
                  <p className="text-sm whitespace-pre-wrap">{selectedInstruction.materials}</p>
                </div>
              )}

              {selectedInstruction.tools && (
                <div>
                  <h5 className="font-medium mb-2">Required Tools</h5>
                  <p className="text-sm whitespace-pre-wrap">{selectedInstruction.tools}</p>
                </div>
              )}

              {selectedInstruction.safetyNotes && (
                <div>
                  <h5 className="font-medium mb-2">Safety Notes</h5>
                  <p className="text-sm whitespace-pre-wrap text-red-600">{selectedInstruction.safetyNotes}</p>
                </div>
              )}

              <div>
                <h5 className="font-medium mb-3">Work Steps ({selectedInstruction.steps.length})</h5>
                <div className="space-y-3">
                  {selectedInstruction.steps.map((step) => (
                    <div key={step.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {step.order}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedInstruction.photos.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Reference Photos ({selectedInstruction.photos.length})</h5>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedInstruction.photos.map((photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Instruction photo ${index + 1}`}
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