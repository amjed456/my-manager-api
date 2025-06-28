'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Avatar, 
  AvatarFallback, 
  AvatarImage 
} from "@/components/ui/avatar";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  User, 
  MoreHorizontal, 
  FolderKanban, 
  Trash2, 
  Search, 
  UsersRound, 
  UserCheck, 
  UserX,
  Loader2
} from "lucide-react";
import adminService, { UserDetail } from "@/services/adminService";
import { toast } from "sonner";

// Define the project type for the user details
interface UserProject {
  _id: string;
  name: string;
  role: string;
}

// Extend UserDetail to include projects and timestamps
interface AdminUser extends UserDetail {
  projects: UserProject[];
  createdAt: string;
  updatedAt: string;
}

interface AdminUserManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminUserManagement({ open, onOpenChange }: AdminUserManagementProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    if (open) {
      fetchUsers();
      checkViewportSize();
      window.addEventListener('resize', checkViewportSize);
    }
    
    return () => window.removeEventListener('resize', checkViewportSize);
  }, [open]);

  const checkViewportSize = () => {
    setIsMobileView(window.innerWidth < 768);
  };

  useEffect(() => {
    if (search) {
      const lowercaseSearch = search.toLowerCase();
      setFilteredUsers(
        users.filter(
          user => 
            user.name.toLowerCase().includes(lowercaseSearch) ||
            user.username.toLowerCase().includes(lowercaseSearch) ||
            user.email.toLowerCase().includes(lowercaseSearch)
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [search, users]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const users = await adminService.getAllUsers();
      setUsers(users as AdminUser[]);
      setFilteredUsers(users as AdminUser[]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await adminService.deleteUser(userToDelete._id);
      toast.success(`User ${userToDelete.name} has been deleted`);
      
      // Remove user from list
      setUsers(users.filter(user => user._id !== userToDelete._id));
      setUserToDelete(null);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('Failed to delete user');
    }
  };

  const viewUserDetails = (user: AdminUser) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render user cards for mobile view
  const renderUserCards = () => {
    return filteredUsers.map((user) => (
      <Card key={user._id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.profilePicture || ''} alt={user.name} />
                <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{user.name}</CardTitle>
                <CardDescription>@{user.username}</CardDescription>
              </div>
            </div>
            <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div>
              <p className="font-medium">Email:</p>
              <p className="text-muted-foreground text-xs truncate max-w-[160px]">{user.email}</p>
            </div>
            <div>
              <p className="font-medium">Projects:</p>
              <div className="flex items-center">
                <FolderKanban className="h-4 w-4 mr-1 text-muted-foreground" />
                <span>{user.projects.length}</span>
              </div>
            </div>
            <div>
              <p className="font-medium">Joined:</p>
              <p className="text-muted-foreground text-xs">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 pt-1 pb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-3"
            onClick={() => viewUserDetails(user)}
          >
            <User className="h-4 w-4 mr-1" />
            Details
          </Button>
          {user.role !== 'admin' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-3 text-red-600"
              onClick={() => {
                setUserToDelete(user);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
        </CardFooter>
      </Card>
    ));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto sm:max-w-2xl lg:max-w-4xl w-[calc(100%-32px)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5" />
              User Management
            </DialogTitle>
            <DialogDescription>
              Manage all users in the system. You can view user details and remove users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="mt-2 text-lg font-medium">No users found</p>
              <p className="text-sm text-muted-foreground">
                {search ? 'Try a different search term' : 'There are no users in the system'}
              </p>
            </div>
          ) : isMobileView ? (
            // Card view for mobile
            <div className="px-1">
              {renderUserCards()}
            </div>
          ) : (
            // Table view for larger screens
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.profilePicture || ''} alt={user.name} />
                            <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'destructive' : 'outline'}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FolderKanban className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{user.projects.length}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => viewUserDetails(user)}>
                              <User className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {user.role !== 'admin' && (
                              <DropdownMenuItem 
                                onClick={() => {
                                  setUserToDelete(user);
                                  setDeleteDialogOpen(true);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[350px] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && 
                `You are about to delete user ${userToDelete.name} (@${userToDelete.username}). 
                This action cannot be undone. This will remove the user from all projects.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-[350px] sm:max-w-md overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2 mb-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.profilePicture || ''} alt={selectedUser.name} />
                  <AvatarFallback className="text-lg">{selectedUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="text-xl font-bold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">@{selectedUser.username}</p>
                </div>
                <Badge variant={selectedUser.role === 'admin' ? 'destructive' : 'outline'}>
                  {selectedUser.role}
                </Badge>
              </div>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="break-words">{selectedUser.email}</p>
                  </div>
                  {selectedUser.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{selectedUser.phone}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Job Information</CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Job Title</p>
                    <p>{selectedUser.jobTitle || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p>{selectedUser.department || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Owned Projects</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  {selectedUser.projects.length === 0 ? (
                    <p className="text-muted-foreground">Not the owner of any projects</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedUser.projects.map(project => (
                        <li key={project._id} className="flex justify-between items-center">
                          <div className="flex items-center max-w-[70%]">
                            <FolderKanban className="h-4 w-4 mr-2 flex-shrink-0 text-muted-foreground" />
                            <span className="truncate">{project.name}</span>
                          </div>
                          <Badge variant="outline">
                            {project.role}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="py-2 space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p>{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p>{formatDate(selectedUser.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 