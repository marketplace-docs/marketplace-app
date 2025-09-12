

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
import { useLocalStorage } from "@/hooks/use-local-storage";


type User = {
    id: number;
    name: string;
    email: string;
    status: 'Leader' | 'Reguler' | 'Event';
    role: string;
};

type NewUser = Omit<User, 'id'>;

const initialUsers: User[] = [
    { id: 1, name: 'Arlan Saputra', email: 'arlan.saputra@marketplace.com', status: 'Leader', role: 'Super Admin' },
    { id: 2, name: 'Rudi Setiawan', email: 'rudi.setiawan@marketplace.com', status: 'Reguler', role: 'Admin' },
    { id: 3, name: 'Nova Aurelia', email: 'nova.aurelia@marketplace.com', status: 'Reguler', role: 'Admin' },
    { id: 4, name: 'Nurul Tanzilla', email: 'nurul.tanzilla@marketplace.com', status: 'Event', role: 'Event Staff' },
    { id: 5, name: 'Regina Rifana', email: 'regina.rifana@marketplace.com', status: 'Leader', role: 'Captain' },
];

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Leader': 'destructive',
    'Reguler': 'default',
    'Event': 'secondary',
};

export default function DatabaseUserPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useLocalStorage<User[]>('users', initialUsers);
    
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newUser, setNewUser] = useState<NewUser>({ name: '', email: '', status: 'Reguler', role: 'Admin' });

    const { toast } = useToast();

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10); 

    const isSuperAdmin = currentUser ? currentUser.role === 'Super Admin' : false;

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

    const handleSaveChanges = () => {
        if (!selectedUser) return;
        setUsers(users.map(u => u.id === selectedUser.id ? selectedUser : u));
        setEditDialogOpen(false);
        setSelectedUser(null);
        toast({ title: "Success", description: "User has been updated successfully." });
    };
    
    const handleAddUser = () => {
        const userToAdd = { ...newUser };
        if (!userToAdd.name || !userToAdd.email) {
            toast({ variant: "destructive", title: "Add Failed", description: "Name and Email cannot be empty." });
            return;
        }

        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        setUsers([...users, { id: newId, ...userToAdd }]);
        
        setAddDialogOpen(false);
        setNewUser({ name: '', email: '', status: 'Reguler', role: 'Admin' });
        toast({ title: "Success", description: "New user added." });
    };

    const handleDeleteUser = () => {
        if (!selectedUser) return;
        
        setUsers(users.filter(u => u.id !== selectedUser.id));
        
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        toast({ title: "Success", description: "User has been deleted.", variant: "destructive" });

        if (paginatedUsers.length === 1 && currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
      <MainLayout>
        <div className="w-full">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Database User</h1>
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
                                <Input id="new-email" value={newUser.email} className="col-span-3" onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-status" className="text-right">Status</Label>
                                <Select value={newUser.status} onValueChange={(value: User['status']) => setNewUser({ ...newUser, status: value })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Leader">Leader</SelectItem>
                                        <SelectItem value="Reguler">Reguler</SelectItem>
                                        <SelectItem value="Event">Event</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="new-role" className="text-right">Role</Label>
                                 <Select value={newUser.role} onValueChange={(value: string) => setNewUser({ ...newUser, role: value })} disabled={!isSuperAdmin}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                                        <SelectItem value="Captain">Captain</SelectItem>
                                        <SelectItem value="Event Staff">Event Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleAddUser}>Add User</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Marketplace Team Work</CardTitle>
                    <CardDescription>A list of all the users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedUsers.length > 0 ? (
                                paginatedUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusVariantMap[user.status] || 'default'}>{user.status}</Badge>
                                        </TableCell>
                                        <TableCell>{user.role}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(user)}>
                                                    <Pencil className="h-4 w-4" />
                                                    <span className="sr-only">Edit</span>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/90" onClick={() => handleOpenDeleteDialog(user)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Delete</span>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                 <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
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
                            {[10, 20, 30].map((pageSize) => (
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
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input id="name" value={selectedUser.name} className="col-span-3" onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="email" className="text-right">Email</Label>
                                <Input id="email" value={selectedUser.email} className="col-span-3" onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="status" className="text-right">Status</Label>
                                <Select value={selectedUser.status} onValueChange={(value: User['status']) => setSelectedUser({ ...selectedUser, status: value })}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Leader">Leader</SelectItem>
                                        <SelectItem value="Reguler">Reguler</SelectItem>
                                        <SelectItem value="Event">Event</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="role" className="text-right">Role</Label>
                                 <Select value={selectedUser.role} onValueChange={(value) => setSelectedUser({ ...selectedUser, role: value })} disabled={!isSuperAdmin}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue placeholder="Select Role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Super Admin">Super Admin</SelectItem>
                                        <SelectItem value="Admin">Admin</SelectItem>
                                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                                        <SelectItem value="Captain">Captain</SelectItem>
                                        <SelectItem value="Event Staff">Event Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveChanges}>Save Changes</Button>
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
                        <Button variant="destructive" onClick={handleDeleteUser}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
      </MainLayout>
    )
}
