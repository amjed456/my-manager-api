import api from './api';

export interface SiteNote {
  _id: string;
  apartmentId: string;
  date: string;
  noteType: string;
  priority: string;
  title: string;
  description: string;
  location: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteNoteData {
  date: string;
  noteType: string;
  priority: string;
  title: string;
  description: string;
  location: string;
  photos?: File[];
}

export interface UpdateSiteNoteData {
  title?: string;
  description?: string;
  images?: {
    url: string;
    caption?: string;
  }[];
  status?: 'Open' | 'In Progress' | 'Closed';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  category?: 'Structural' | 'Electrical' | 'Plumbing' | 'HVAC' | 'Finishing' | 'Other';
  assignedTo?: string;
  notes?: string;
  startDate?: string;
  completionDate?: string;
}

export const siteNoteService = {
  // Get all site notes for an apartment
  async getSiteNotes(apartmentId: string): Promise<SiteNote[]> {
    try {
      const response = await api.get(`/site-notes/apartment/${apartmentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching site notes:', error);
      throw error;
    }
  },

  // Get site notes by status for an apartment
  async getSiteNotesByStatus(apartmentId: string, status: string): Promise<SiteNote[]> {
    const response = await api.get(`/site-notes/apartment/${apartmentId}/status/${status}`);
    return response.data;
  },

  // Create a new site note
  async createSiteNote(apartmentId: string, data: FormData): Promise<SiteNote> {
    try {
      const response = await api.post(`/site-notes/apartment/${apartmentId}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating site note:', error);
      throw error;
    }
  },

  // Update a site note
  async updateSiteNote(noteId: string, data: Partial<CreateSiteNoteData>): Promise<SiteNote> {
    try {
      const response = await api.put(`/site-notes/${noteId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating site note:', error);
      throw error;
    }
  },

  // Delete a site note
  async deleteSiteNote(noteId: string): Promise<void> {
    try {
      await api.delete(`/site-notes/${noteId}`);
    } catch (error) {
      console.error('Error deleting site note:', error);
      throw error;
    }
  },

  // Get site note by ID
  async getSiteNote(noteId: string): Promise<SiteNote> {
    try {
      const response = await api.get(`/site-notes/${noteId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching site note:', error);
      throw error;
    }
  }
}; 