import api from './api';
import authService from './authService';
import projectService from './projectService';
import taskService from './taskService';
import userService from './userService';
import notificationService from './notificationService';
import adminService from './adminService';
import { apartmentService, Apartment } from './apartmentService';
import { progressService, ProgressEntry } from './progressService';
import { siteNoteService, SiteNote } from './siteNoteService';
import { fieldInstructionService, FieldInstruction } from './fieldInstructionService';

export {
  api,
  authService,
  projectService,
  taskService,
  userService,
  notificationService,
  adminService,
  apartmentService,
  progressService,
  siteNoteService,
  fieldInstructionService,
};

export type {
  Apartment,
  ProgressEntry,
  SiteNote,
  FieldInstruction
}; 