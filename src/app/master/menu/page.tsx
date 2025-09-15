

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { NAV_LINKS, type NavLink } from "@/lib/constants";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type User = {
    id: number;
    name: string;
    email: string;
    status: 'Leader' | 'Reguler' | 'Event';
    role: string;
};

type MenuPermissions = {
  [menuHref: string]: boolean;
};

// Function to generate a flat list of all possible menu hrefs and group identifiers
const getAllMenuHrefs = (links: NavLink[]): string[] => {
    const hrefs: string[] = [];
    const traverse = (navLinks: NavLink[]) => {
        navLinks.forEach(link => {
            const effectiveHref = link.children ? `group-${link.label}` : link.href;
            hrefs.push(effectiveHref);
            if (link.children) {
                traverse(link.children);
            }
        });
    };
    traverse(links);
    return hrefs;
};

const allMenuHrefs = getAllMenuHrefs(NAV_LINKS);

export default function MenuManagementPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [menuPermissions, setMenuPermissions] = useState<MenuPermissions>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const { toast } = useToast();

    const isSuperAdmin = useMemo(() => currentUser?.role === 'Super Admin', [currentUser]);
    
    // Fetch all users if the current user is a Super Admin
    useEffect(() => {
        if (isSuperAdmin) {
            setFetchError(null);
            setIsLoading(true);
            fetch('/api/users')
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Failed to fetch users list.');
                    }
                    return res.json();
                })
                .then(data => setUsers(data))
                .catch(err => {
                    setFetchError(err.message);
                    toast({ variant: 'destructive', title: 'Error', description: err.message });
                })
                .finally(() => setIsLoading(false));
        }
    }, [isSuperAdmin, toast]);

    // Function to fetch permissions for the selected user
    const fetchPermissions = useCallback(async (userId: string) => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/menu-permissions/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch menu permissions.');
            }
            const savedPermissions: { menu_href: string, is_accessible: boolean }[] = await response.json();
            
            // Initialize all permissions to true (default)
            const initialPerms: MenuPermissions = allMenuHrefs.reduce((acc, href) => {
                acc[href] = true;
                return acc;
            }, {} as MenuPermissions);

            // Override with saved permissions from the database
            if (savedPermissions.length > 0) {
                 savedPermissions.forEach(p => {
                    if (p.menu_href in initialPerms) {
                        initialPerms[p.menu_href] = p.is_accessible;
                    }
                });
            }
            
            setMenuPermissions(initialPerms);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error Fetching Permissions', description: error.message });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    // Effect to trigger permission fetch when a user is selected
    useEffect(() => {
        // If the logged-in user is not a super admin, show their own permissions
        if (!isSuperAdmin && currentUser) {
            const self = users.find(u => u.email === currentUser.email);
            if(self) {
              setSelectedUserId(self.id.toString());
              fetchPermissions(self.id.toString());
            }
        } else if (selectedUserId) { // For super admin selecting a user
            fetchPermissions(selectedUserId);
        } else {
            setMenuPermissions({}); // Clear permissions if no user is selected
        }
    }, [selectedUserId, isSuperAdmin, currentUser, fetchPermissions, users]);


    const handlePermissionChange = (menuHref: string, checked: boolean) => {
        if (!isSuperAdmin || !selectedUserId) return;
        setMenuPermissions(prev => ({
            ...prev,
            [menuHref]: checked,
        }));
    };
    
    const handleSaveChanges = async () => {
        if (!selectedUserId || !isSuperAdmin || !currentUser) {
            toast({ variant: 'destructive', title: 'Error', description: "No user selected or you don't have permission." });
            return;
        }
        setIsSaving(true);
        try {
            const response = await fetch('/api/menu-permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId: selectedUserId, 
                    permissions: menuPermissions, 
                    user: currentUser,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save permissions.");
            }

            toast({
                title: "Success",
                description: `Menu permissions for ${users.find(u => u.id.toString() === selectedUserId)?.name || 'user'} have been saved.`
            });
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Save Failed', description: error.message });
        } finally {
            setIsSaving(false);
        }
    }

    // Recursive function to render menu rows in the table
    const renderMenuRows = (links: NavLink[], isSubmenu = false) => {
        return links.flatMap(link => {
            const effectiveHref = link.children ? `group-${link.label}` : link.href;
            const rows = [(
                <TableRow key={effectiveHref} className={isSubmenu ? 'bg-muted/50' : ''}>
                    <TableCell className={`font-medium ${isSubmenu ? 'pl-10' : ''}`}>
                       {link.label}
                    </TableCell>
                    <TableCell className="text-right">
                        <Switch
                            disabled={!isSuperAdmin || !selectedUserId || isLoading || isSaving}
                            checked={menuPermissions[effectiveHref] ?? false}
                            onCheckedChange={(checked) => handlePermissionChange(effectiveHref, checked)}
                            aria-label={`Toggle access for ${link.label}`}
                        />
                    </TableCell>
                </TableRow>
            )];
            if (link.children) {
                // If parent is disabled, its children should also appear disabled/unchecked in the UI.
                if(menuPermissions[effectiveHref] === true){
                   rows.push(...renderMenuRows(link.children, true));
                }
            }
            return rows;
        });
    };

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Menu Permission</h1>
                
                {fetchError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Failed to load user data</AlertTitle>
                        <AlertDescription>{fetchError}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>System Menu Control</CardTitle>
                        <CardDescription>
                            {isSuperAdmin 
                                ? "Select a user to manage their menu access. Unchecking a main menu will hide all its sub-menus."
                                : "You are viewing your own menu permissions. Contact a Super Admin to make changes."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {isSuperAdmin && (
                                <div className="flex items-center gap-4">
                                    <Label htmlFor="user-select" className="w-24">Select User:</Label>
                                    <Select onValueChange={setSelectedUserId} value={selectedUserId} disabled={isLoading || fetchError !== null}>
                                        <SelectTrigger id="user-select" className="w-[250px]">
                                            <SelectValue placeholder="Select a user to manage" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {users.map(user => (
                                                <SelectItem key={user.id} value={user.id.toString()}>
                                                    {user.name} ({user.role})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            
                            <div className="border rounded-lg relative min-h-[300px]">
                                {(isLoading || (isSuperAdmin && !selectedUserId)) && (
                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-lg">
                                        {isLoading ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : (
                                            <p className="text-muted-foreground">Please select a user to manage permissions.</p>
                                        )}
                                    </div>
                                )}
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Menu</TableHead>
                                            <TableHead className="text-right w-[100px]">Access</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(selectedUserId || !isSuperAdmin) ? renderMenuRows(NAV_LINKS) : (
                                             !isLoading && (
                                                <TableRow>
                                                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                                         {isSuperAdmin ? "Select a user to see menu permissions." : "You do not have permission to manage."}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {isSuperAdmin && (
                                <div className="flex justify-end">
                                    <Button onClick={handleSaveChanges} disabled={!selectedUserId || isLoading || isSaving}>
                                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Changes
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
