import api from './api';

export interface Apartment {
  _id: string;
  name: string;
  number: number;
  project: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApartmentData {
  name: string;
  number: number;
  description?: string;
}

export interface UpdateApartmentData {
  name?: string;
  description?: string;
  status?: 'Not Started' | 'In Progress' | 'Completed';
  progress?: number;
}

class ApartmentService {
  // Get all apartments for a project
  async getApartmentsByProject(projectId: string): Promise<Apartment[]> {
    const response = await api.get(`/apartments/project/${projectId}`);
    return response.data;
  }

  // Create a new apartment
  async createApartment(projectId: string, data: CreateApartmentData): Promise<Apartment> {
    const response = await api.post(`/apartments/project/${projectId}`, data);
    return response.data;
  }

  // Update an apartment
  async updateApartment(apartmentId: string, data: UpdateApartmentData): Promise<Apartment> {
    const response = await api.put(`/apartments/${apartmentId}`, data);
    return response.data;
  }

  // Delete an apartment
  async deleteApartment(apartmentId: string): Promise<void> {
    await api.delete(`/apartments/${apartmentId}`);
  }

  // Get a single apartment
  async getApartmentById(apartmentId: string): Promise<Apartment> {
    const response = await api.get(`/apartments/${apartmentId}`);
    return response.data;
  }
}

export const apartmentService = new ApartmentService(); 