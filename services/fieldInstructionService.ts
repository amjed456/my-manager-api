import api from './api';

export interface FieldInstruction {
  _id: string;
  apartmentId: string;
  title: string;
  instructionType: string;
  priority: string;
  description: string;
  location: string;
  assignedTo: string;
  dueDate?: string;
  materials: string;
  tools: string;
  safetyNotes: string;
  steps: Array<{
    id: string;
    description: string;
    order: number;
  }>;
  images: Array<{
    url: string;
    caption?: string;
    uploadedAt?: string;
  }>;
  status: "Created" | "Work Started" | "Completed";
  createdAt: string;
  updatedAt: string;
}

export interface CreateFieldInstructionData {
  title: string;
  instructionType: string;
  priority: string;
  description: string;
  location: string;
  assignedTo: string;
  dueDate?: string;
  materials: string;
  tools: string;
  safetyNotes: string;
  steps: Array<{
    id: string;
    description: string;
    order: number;
  }>;
  photos?: File[];
}

export interface UpdateFieldInstructionData {
  title?: string;
  description?: string;
  images?: {
    url: string;
    caption?: string;
  }[];
  status?: 'Created' | 'Work Started' | 'Completed';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  category?: 'Safety' | 'Quality' | 'Schedule' | 'Technical' | 'Other';
  assignedTo?: string;
  instructions?: string;
  dueDate?: string;
  attachments?: {
    url: string;
    name: string;
  }[];
  startDate?: string;
  completionDate?: string;
}

export const fieldInstructionService = {
  // Get all field instructions for an apartment
  async getFieldInstructions(apartmentId: string): Promise<FieldInstruction[]> {
    try {
      const response = await api.get(`/field-instructions/apartment/${apartmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching field instructions:', error);
      throw error;
    }
  },

  // Create a new field instruction
  async createFieldInstruction(apartmentId: string, data: FormData): Promise<FieldInstruction> {
    try {
      const response = await api.post(`/field-instructions/apartment/${apartmentId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating field instruction:', error);
      throw error;
    }
  },

  // Update a field instruction
  async updateFieldInstruction(instructionId: string, data: Partial<CreateFieldInstructionData>): Promise<FieldInstruction> {
    try {
      const response = await api.put(`/field-instructions/${instructionId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating field instruction:', error);
      throw error;
    }
  },

  // Delete a field instruction
  async deleteFieldInstruction(instructionId: string): Promise<void> {
    try {
      await api.delete(`/field-instructions/${instructionId}`);
    } catch (error) {
      console.error('Error deleting field instruction:', error);
      throw error;
    }
  },

  // Get field instruction by ID
  async getFieldInstruction(instructionId: string): Promise<FieldInstruction> {
    try {
      const response = await api.get(`/field-instructions/${instructionId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching field instruction:', error);
      throw error;
    }
  },

  // Update instruction status
  async updateInstructionStatus(instructionId: string, status: "Created" | "Work Started" | "Completed"): Promise<FieldInstruction> {
    try {
      const response = await api.patch(`/field-instructions/${instructionId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating instruction status:', error);
      throw error;
    }
  }
}; 