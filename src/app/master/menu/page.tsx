
'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { NAV_LINKS, type NavLink } from "@/lib/constants";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type User = {
    id: number;
    name: string;
    status: 'Leader' | 'Reguler' | 'Event';
    role: string;
};

const initialUsers: User[] = [
    { id: 1, name: 'Arlan Saputra', status: 'Leader', role: 'Super Admin' },
    { id: 2, name: 'Rudi Setiawan', status: 'Reguler', role: 'Admin' },
    { id: 3, name: 'Nova Aurelia', status: 'Reguler', role: 'Admin' },
    { id: 4, name: 'Nurul Tanzilla', status: 'Event', role: 'Event Staff' },
    { id: 5, name: 'Regina Rifana', status: 'Leader', role: 'Captain' },
];

type MenuPermissions = {
  [userId: string]: {
    [menuHref: string]: boolean;
  };
};

export default function MenuManagementPage() {
    const { user: currentUser } = useAuth();
    const [users] = useState<User[]>(initialUsers);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [menuPermissions, setMenuPermissions] = useLocalStorage<MenuPermissions>('menuPermissions', {});
    const { toast } = useToast();

    const isSuperAdmin = currentUser?.role === 'Super Admin';

    useEffect(() => {
        // Initialize permissions for all users and menus if not already set
        const newPermissions = { ...menuPermissions };
        let updated = false;

        users.forEach(user => {
            if (!newPermissions[user.id]) {
                newPermissions[user.id] = {};
                updated = true;
            }
            NAV_LINKS.forEach(link => {
                if (newPermissions[user.id][link.href] === undefined) {
                    newPermissions[user.id][link.href] = true; // Default to accessible
                    updated = true;
                }
                link.children?.forEach(child => {
                    if (newPermissions[user.id][child.href] === undefined) {
                        newPermissions[user.id][child.href] = true;
                        updated = true;
                    }
                });
            });
        });

        if (updated) {
            setMenuPermissions(newPermissions);
        }
    }, [users, setMenuPermissions, menuPermissions]);

    const handlePermissionChange = (menuHref: string, checked: boolean) => {
        if (!selectedUserId || !isSuperAdmin) return;
        setMenuPermissions(prev => ({
            ...prev,
            [selectedUserId]: {
                ...prev[selectedUserId],
                [menuHref]: checked,
            },
        }));
    };
    
    const handleSaveChanges = () => {
        toast({
            title: "Success",
            description: `Menu permissions for ${users.find(u => u.id.toString() === selectedUserId)?.name || 'user'} have been saved.`
        });
    }

    const renderMenuRows = (links: NavLink[], isSubmenu = false) => {
        return links.flatMap(link => {
            const rows = [(
                <TableRow key={link.href} className={isSubmenu ? 'bg-muted/50' : ''}>
                    <TableCell className={`font-medium ${isSubmenu ? 'pl-10' : ''}`}>
                       {link.label}
                    </TableCell>
                    <TableCell className="text-right">
                        <Switch
                            disabled={!selectedUserId || !isSuperAdmin}
                            checked={!!menuPermissions[selectedUserId]?.[link.href]}
                            onCheckedChange={(checked) => handlePermissionChange(link.href, checked)}
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
                                <Select onValueChange={setSelectedUserId} value={selectedUserId} disabled={!isSuperAdmin}>
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
                            
                            {!isSuperAdmin && (
                                <p className="text-sm text-destructive">You do not have permission to manage menus.</p>
                            )}

                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Menu</TableHead>
                                            <TableHead className="text-right w-[100px]">Access</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {renderMenuRows(NAV_LINKS)}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSaveChanges} disabled={!selectedUserId || !isSuperAdmin}>Save Changes</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}

