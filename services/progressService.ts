import api from './api'

export interface ProgressEntry {
  _id: string
  apartmentId: string
  date: string
  workDescription: string
  hoursWorked: number
  photos: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateProgressEntryData {
  date: string
  workDescription: string
  hoursWorked: number
  photos?: File[]
}

export const progressService = {
  // Get all progress entries for an apartment
  async getProgressEntries(apartmentId: string): Promise<ProgressEntry[]> {
    try {
      const response = await api.get(`/progress/apartment/${apartmentId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching progress entries:', error)
      throw error
    }
  },

  // Create a new progress entry
  async createProgressEntry(apartmentId: string, data: FormData): Promise<ProgressEntry> {
    try {
      const response = await api.post(`/progress/apartment/${apartmentId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      console.error('Error creating progress entry:', error)
      throw error
    }
  },

  // Update a progress entry
  async updateProgressEntry(entryId: string, data: Partial<CreateProgressEntryData>): Promise<ProgressEntry> {
    try {
      const response = await api.put(`/progress/${entryId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating progress entry:', error)
      throw error
    }
  },

  // Delete a progress entry
  async deleteProgressEntry(entryId: string): Promise<void> {
    try {
      await api.delete(`/progress/${entryId}`)
    } catch (error) {
      console.error('Error deleting progress entry:', error)
      throw error
    }
  },

  // Get progress entry by ID
  async getProgressEntry(entryId: string): Promise<ProgressEntry> {
    try {
      const response = await api.get(`/progress/${entryId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching progress entry:', error)
      throw error
    }
  }
} 