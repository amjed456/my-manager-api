import api from './api';

// Types
export interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'Planning' | 'In Progress' | 'Completed';
  progress: number;
  dueDate: string;
  startDate: string;
  owner: string | User;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: string;
  name: string;
  username: string;
  profilePicture?: string;
}

export interface CreateProjectData {
  name: string;
  description: string;
  dueDate: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: 'Planning' | 'In Progress' | 'Completed';
  dueDate?: string;
}

// Validate MongoDB ObjectId format
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

// Project service
const projectService = {
  getAllProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data;
  },
  
  getProjectById: async (id: string): Promise<Project> => {
    // Validate the ID format before making the API call
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid project ID: ID is missing or not a string');
    }
    
    if (!isValidObjectId(id)) {
      throw new Error('Invalid project ID format: must be a valid MongoDB ObjectId');
    }
    
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },
  
  createProject: async (projectData: CreateProjectData): Promise<Project> => {
    const response = await api.post('/projects', projectData);
    return response.data;
  },
  
  updateProject: async (id: string, projectData: UpdateProjectData): Promise<Project> => {
    if (!id || !isValidObjectId(id)) {
      throw new Error('Invalid project ID');
    }
    
    const response = await api.put(`/projects/${id}`, projectData);
    return response.data;
  },
  
  deleteProject: async (id: string): Promise<{ message: string }> => {
    if (!id || !isValidObjectId(id)) {
      throw new Error('Invalid project ID');
    }
    
    const response = await api.delete(`/projects/${id}`);
    return response.data;
  }
};

export default projectService; 