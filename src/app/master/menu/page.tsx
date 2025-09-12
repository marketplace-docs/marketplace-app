
'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

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

export default function MenuManagementPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [menuPermissions, setMenuPermissions] = useState<MenuPermissions>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const { toast } = useToast();

    const isSuperAdmin = currentUser?.role === 'Super Admin';

    useEffect(() => {
        if (isSuperAdmin) {
            setFetchError(null);
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
                });
        }
    }, [isSuperAdmin]);

    const initializePermissions = (links: NavLink[]): MenuPermissions => {
        const perms: MenuPermissions = {};
        const traverse = (navLinks: NavLink[]) => {
            navLinks.forEach(link => {
                const effectiveHref = link.children ? `group-${link.label}` : link.href;
                perms[effectiveHref] = true; // Default to accessible
                if (link.children) {
                    traverse(link.children);
                }
            });
        };
        traverse(links);
        return perms;
    };

    const fetchPermissions = useCallback(async (userId: string) => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/menu-permissions/${userId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch menu permissions.');
            }
            const data = await response.json();
            
            const initialPerms = initializePermissions(NAV_LINKS);
            
            if (data && data.length > 0) {
                data.forEach((p: { menu_href: string, is_accessible: boolean }) => {
                    initialPerms[p.menu_href] = p.is_accessible;
                });
            }
            
            setMenuPermissions(initialPerms);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message || 'An unknown error occurred.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        if (selectedUserId) {
            fetchPermissions(selectedUserId);
        } else {
            setMenuPermissions({});
        }
    }, [selectedUserId, fetchPermissions]);


    const handlePermissionChange = (menuHref: string, checked: boolean) => {
        if (!selectedUserId || !isSuperAdmin) return;
        setMenuPermissions(prev => ({
            ...prev,
            [menuHref]: checked,
        }));
    };
    
    const handleSaveChanges = async () => {
        if (!selectedUserId) return;
        setIsSaving(true);
        try {
            const response = await fetch('/api/menu-permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUserId, permissions: menuPermissions })
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
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSaving(false);
        }
    }

    const renderMenuRows = (links: NavLink[], isSubmenu = false) => {
        return links.flatMap(link => {
            const effectiveHref = link.children ? `group-${link.label}` : link.href;
            const rows = [(
                <TableRow key={`${link.href}-${link.label}`} className={isSubmenu ? 'bg-muted/50' : ''}>
                    <TableCell className={`font-medium ${isSubmenu ? 'pl-10' : ''}`}>
                       {link.label}
                    </TableCell>
                    <TableCell className="text-right">
                        <Switch
                            disabled={!selectedUserId || !isSuperAdmin || isLoading}
                            checked={menuPermissions[effectiveHref] ?? false}
                            onCheckedChange={(checked) => handlePermissionChange(effectiveHref, checked)}
                        />
                    </TableCell>
                </TableRow>
            )];
            if (link.children) {
                rows.push(...renderMenuRows(link.children, true));
            }
            return rows;
        });
    };

    return (
        <MainLayout>
            <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Menu Management</h1>
                
                {fetchError && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Failed to load data</AlertTitle>
                        <AlertDescription>{fetchError}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>System Menu Control</CardTitle>
                        <CardDescription>
                            As a Super Admin, you can enable or disable menu access for each user. Select a user to begin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Label htmlFor="user-select" className="w-24">Select User:</Label>
                                <Select onValueChange={setSelectedUserId} value={selectedUserId} disabled={!isSuperAdmin || fetchError !== null}>
                                    <SelectTrigger id="user-select" className="w-[250px]">
                                        <SelectValue placeholder={isSuperAdmin ? "Select a user to manage" : "Permission denied"} />
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
                            
                            {!isSuperAdmin && (
                                <p className="text-sm text-destructive">You do not have permission to manage menus.</p>
                            )}

                            <div className="border rounded-lg relative">
                                {isLoading && (
                                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                                        {selectedUserId ? renderMenuRows(NAV_LINKS) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                                    {isSuperAdmin ? "Please select a user to see menu permissions." : "You do not have permission."}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveChanges} disabled={!selectedUserId || !isSuperAdmin || isLoading || isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
