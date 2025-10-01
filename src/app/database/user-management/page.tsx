
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, AlertCircle, Plus } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/components/layout/main-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";

type User = {
    id: number;
    name: string;
    email: string;
    status: 'Staff' | 'Reguler' | 'Event';
    role: string;
};

type NewUser = Omit<User, 'id'>;

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Staff': 'destructive',
    'Reguler': 'default',
    'Event': 'secondary',
};

export default function DatabaseUserPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState<NewUser>({ name: '', email: '', status: 'Reguler', role: 'Staff' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { toast } = useToast();

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10); 

    const canAddUser = currentUser?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'].includes(currentUser.role);
    const canEditUser = currentUser?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'].includes(currentUser.role);
    const canDeleteUser = currentUser?.role === 'Super Admin';
    const isSuperAdminForRoleChange = currentUser?.role === 'Super Admin';


    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const totalPages = Math.ceil(users.length / rowsPerPage);
    const paginatedUsers = users.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };

    const handleOpenEditDialog = (user: User) => {
        setSelectedUser({...user});
        setEditDialogOpen(true);
    };

    const handleOpenDeleteDialog = (user: User) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleSaveChanges = async () => {
        if (!selectedUser || !currentUser) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...selectedUser,
                    userName: currentUser.name,
                    userEmail: currentUser.email,
                    userRole: currentUser.role,
                })
            });
            if (!response.ok) throw new Error('Failed to update user');
            
            await fetchUsers();
            setEditDialogOpen(false);
            setSelectedUser(null);
            toast({ title: "Success", description: "User has been updated successfully." });
        } catch (error) {
            toast({ variant: 'destructive', title: "Error", description: "Could not update user." });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAddUser = async () => {
        if (!newUser.name || !newUser.email) {
            toast({ variant: "destructive", title: "Add Failed", description: "Name and Email cannot be empty." });
            return;
        }
        if (!currentUser) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newUser,
                    userName: currentUser.name,
                    userEmail: currentUser.email,
                    userRole: currentUser.role,
                })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add user');
            };
            
            await fetchUsers();
            setAddDialogOpen(false);
            setNewUser({ name: '', email: '', status: 'Reguler', role: 'Staff' });
            toast({ title: "Success", description: "New user added." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message || "Could not add user." });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || !currentUser) return;
        setIsSubmitting(true);
        try {
             const response = await fetch(`/api/users/${selectedUser.id}`, {
                method: 'DELETE',
                headers: {
                    'X-User-Name': currentUser.name,
                    'X-User-Email': currentUser.email,
                    'X-User-Role': currentUser.role,
                }
            });
            if (!response.ok) {
                 const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete user');
            }

            await fetchUsers();
            
            setDeleteDialogOpen(false);
            setSelectedUser(null);
            toast({ title: "Success", description: "User has been deleted.", variant: "destructive" });

            if (paginatedUsers.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }
        } catch (error: any) {
             toast({ variant: 'destructive', title: "Error", description: error.message || "Could not delete user." });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
      <MainLayout>
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">User Management</h1>
               {canAddUser && (
                <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                      <DialogTrigger asChild>
                          <Button>
                              <Plus className="mr-2 h-4 w-4" /> Add User
                          </Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                              <DialogTitle>Add New User</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                               <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="new-name" className="text-right">Name</Label>
                                  <Input id="new-name" value={newUser.name} className="col-span-3" onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                              </div>
                               <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="new-email" className="text-right">Email</Label>
                                  <Input id="new-email" type="email" value={newUser.email} className="col-span-3" onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                              </div>
                               <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="new-status" className="text-right">Status</Label>
                                  <Select value={newUser.status} onValueChange={(value: 'Staff' | 'Reguler' | 'Event') => setNewUser({ ...newUser, status: value })}>
                                      <SelectTrigger className="col-span-3">
                                          <SelectValue placeholder="Select Status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="Staff">Staff</SelectItem>
                                          <SelectItem value="Reguler">Reguler</SelectItem>
                                          <SelectItem value="Event">Event</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="new-role" className="text-right">Role</Label>
                                   <Select value={newUser.role} onValueChange={(value: string) => setNewUser({ ...newUser, role: value })} disabled={!isSuperAdminForRoleChange}>
                                      <SelectTrigger className="col-span-3">
                                          <SelectValue placeholder="Select Role" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          <SelectItem value="Super Admin">Super Admin</SelectItem>
                                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                                          <SelectItem value="Manager">Manager</SelectItem>
                                          <SelectItem value="Captain">Captain</SelectItem>
                                          <SelectItem value="Admin">Admin</SelectItem>
                                          <SelectItem value="Staff">Staff</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </div>
                          <DialogFooter>
                              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                              <Button onClick={handleAddUser} disabled={isSubmitting}>
                                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Add User
                              </Button>
                          </DialogFooter>
                      </DialogContent>
                  </Dialog>
               )}
            </div>
            {error && (
                 <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Card>
                <CardHeader>
                    <CardTitle>Marketplace Team Work</CardTitle>
                    <CardDescription>A list of all the users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Username</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                                {(canEditUser || canDeleteUser) && <TableHead className="text-right">Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[user.status] || 'default'}>{user.status}</Badge>
                                        </TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        {(canEditUser || canDeleteUser) && (
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {canEditUser && (
                                                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(user)}>
                                                            <Pencil className="h-4 w-4" />
                                                            <span className="sr-only">Edit</span>
                                                        </Button>
                                                    )}
                                                    {canDeleteUser && (
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(user)}>
                                                            <Trash2 className="h-4 w-4" />
                                                            <span className="sr-only">Delete</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            ) : (
                                 <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                    Page {users.length > 0 ? currentPage : 0} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Rows per page:</span>
                    <Select
                        value={`${rowsPerPage}`}
                        onValueChange={(value) => {
                            setRowsPerPage(Number(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={rowsPerPage} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {[5, 20, 50, 100].map((pageSize) => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous</span>
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || totalPages === 0}
                >
                    <span className="sr-only">Next</span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Make changes to the user profile here. Click save when you're done.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Full Name</Label>
                                <Input id="name" value={selectedUser.name} className="col-span-3" onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="username" className="text-right">Username</Label>
                                <Input id="username" value={selectedUser.name} className="col-span-3" onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" value={selectedUser.email} className="col-span-3" onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">Status</Label>
                                <Select value={selectedUser.status} onValueChange={(value: 'Staff' | 'Reguler' | 'Event') => setSelectedUser({ ...selectedUser, status: value })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Staff">Staff</SelectItem>
                                        <SelectItem value="Reguler">Reguler</SelectItem>
                                        <SelectItem value="Event">Event</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                 <Select value={selectedUser.role} onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })} disabled={!isSuperAdminForRoleChange}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                                        <SelectItem value="Manager">Manager</SelectItem>
                                        <SelectItem value="Captain">Captain</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Staff">Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the user <span className="font-semibold">{selectedUser?.name}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteUser} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
      </MainLayout>
    )
}
