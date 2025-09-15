
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Warehouse, Plus, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { format } from 'date-fns';

type LocationType = 'Sellable' | 'Expiring' | 'Expired' | 'Quarantine' | 'Mixed' | 'Empty';
type LocationFilterType = 'All' | LocationType;

type LocationData = {
    id: number;
    name: string;
    type: LocationType;
    created_at: string;
};

const typeVariantMap: Record<LocationType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    'Sellable': 'default',
    'Expiring': 'secondary',
    'Expired': 'destructive',
    'Quarantine': 'outline',
    'Mixed': 'outline',
    'Empty': 'outline',
};


export default function LocationPage() {
    const [locationsData, setLocationsData] = useState<LocationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<LocationFilterType>('All');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { user } = useAuth();

    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [isUploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationType, setNewLocationType] = useState<LocationType>('Empty');
    
    const fetchLocations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/locations');
            if (!response.ok) throw new Error('Failed to fetch location data');
            const data: LocationData[] = await response.json();
            setLocationsData(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLocations();
    }, [fetchLocations]);

    const filteredData = useMemo(() => {
        return locationsData.filter(location =>
            (location.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (typeFilter === 'All' || location.type === typeFilter)
        );
    }, [locationsData, searchTerm, typeFilter]);
    
    useEffect(() => {
        setCurrentPage(1);
    }, [rowsPerPage, searchTerm, typeFilter]);

    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    const handleNextPage = () => {
        setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
    };
    
    const kpiData = useMemo(() => {
        return locationsData.reduce((acc, loc) => {
            acc.total += 1;
            if (loc.type === 'Sellable') acc.sellable += 1;
            if (loc.type === 'Expiring') acc.expiring += 1;
            if (loc.type === 'Expired') acc.expired += 1;
            if (loc.type === 'Quarantine') acc.quarantine += 1;
            if (loc.type === 'Mixed') acc.mixed += 1;
            return acc;
        }, { total: 0, sellable: 0, expiring: 0, expired: 0, quarantine: 0, mixed: 0 });
    }, [locationsData]);
    
    const handleAddLocation = async () => {
        if (!newLocationName.trim()) {
            toast({ variant: 'destructive', title: 'Error', description: 'Location name cannot be empty.' });
            return;
        }
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You are not logged in.' });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/locations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    locations: [{ name: newLocationName.trim(), type: newLocationType }],
                    user,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add location.');
            }
            
            await fetchLocations(); // Refetch from DB
            toast({ title: 'Success', description: `Location "${newLocationName.trim()}" has been added.` });
            setNewLocationName('');
            setNewLocationType('Empty');
            setAddDialogOpen(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        if (filteredData.length === 0) {
          toast({
            variant: "destructive",
            title: "No Data",
            description: "There is no data to export.",
          });
          return;
        }
        const headers = ["name", "type"];
        const csvContent = [
            headers.join(","),
            ...filteredData.map(item => [
                `"${item.name.replace(/"/g, '""')}"`,
                `"${item.type}"`
            ].join(","))
        ].join("\n");
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute("download", `locations_data_${format(new Date(), "yyyyMMdd")}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Success", description: "Locations data exported." });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        setIsSubmitting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            try {
                const lines = text.split('\n').filter(line => line.trim() !== '');
                const headers = lines.shift()?.split(',').map(h => h.trim().toLowerCase().replace(/"/g, '')) || [];
                
                if (!headers.includes('name') || !headers.includes('type')) {
                    throw new Error("Invalid CSV. Required headers: name, type");
                }

                const newLocations = lines.map(line => {
                    const values = line.split(',');
                    const name = values[headers.indexOf('name')]?.trim().replace(/"/g, '');
                    const type = values[headers.indexOf('type')]?.trim().replace(/"/g, '') as LocationType;

                    if (name && Object.keys(typeVariantMap).includes(type)) {
                        return { name, type };
                    }
                    return null;
                }).filter((l): l is { name: string; type: LocationType } => l !== null);

                const response = await fetch('/api/locations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ locations: newLocations, user }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to upload locations.');
                }
                
                await fetchLocations();
                setUploadDialogOpen(false);
                toast({ title: "Success", description: `${newLocations.length} new locations uploaded.` });

            } catch (error: any) {
                 toast({ variant: "destructive", title: "Upload Failed", description: error.message });
            } finally {
                setIsSubmitting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Location</h1>
                 {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Locations</CardTitle>
                            <Warehouse className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{kpiData.total.toLocaleString()}</div>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sellable Locations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold text-green-600">{kpiData.sellable.toLocaleString()}</div>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expired Locations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold text-red-600">{kpiData.expired.toLocaleString()}</div>}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Mixed Locations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{kpiData.mixed.toLocaleString()}</div>}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <CardTitle>Registered Locations</CardTitle>
                                <CardDescription>A list of all unique storage locations and their status type.</CardDescription>
                            </div>
                             <div className="flex w-full md:w-auto items-center gap-2">
                                <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <Plus className="mr-2 h-4 w-4" /> Add Location
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Location</DialogTitle>
                                            <DialogDescription>
                                               Manually add a new storage location. This is useful for pre-registering locations before goods arrive.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="location-name" className="text-right">Location Name</Label>
                                                <Input
                                                    id="location-name"
                                                    value={newLocationName}
                                                    onChange={(e) => setNewLocationName(e.target.value)}
                                                    className="col-span-3"
                                                    placeholder="e.g., A-01-01 or QUARANTINE-02"
                                                />
                                            </div>
                                             <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="location-type" className="text-right">Location Type</Label>
                                                <Select value={newLocationType} onValueChange={(v) => setNewLocationType(v as LocationType)}>
                                                    <SelectTrigger className="col-span-3">
                                                        <SelectValue placeholder="Select type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Empty">Empty</SelectItem>
                                                        <SelectItem value="Sellable">Sellable</SelectItem>
                                                        <SelectItem value="Expiring">Expiring</SelectItem>
                                                        <SelectItem value="Expired">Expired</SelectItem>
                                                        <SelectItem value="Quarantine">Quarantine</SelectItem>
                                                        <SelectItem value="Mixed">Mixed</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleAddLocation} disabled={isSubmitting}>
                                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                Submit
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <Dialog open={isUploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Upload</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Upload Locations CSV</DialogTitle>
                                            <DialogDescription>
                                                Select a CSV file to bulk upload locations. The file must contain the headers: name, type.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="py-4">
                                           <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                           <Button onClick={() => fileInputRef.current?.click()} className="w-full" disabled={isSubmitting}>
                                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Choose File'}
                                           </Button>
                                           <p className="text-xs text-muted-foreground mt-2">
                                                Don't have a template? <a href="/templates/locations_template.csv" download className="underline text-primary">Download CSV template</a>
                                           </p>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <Button variant="outline" onClick={handleExport}>
                                    <Download className="mr-2 h-4 w-4" /> Export
                                </Button>
                                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as LocationFilterType)}>
                                    <SelectTrigger className="w-full md:w-[180px]">
                                        <SelectValue placeholder="Filter by type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">All Types</SelectItem>
                                        <SelectItem value="Sellable">Sellable</SelectItem>
                                        <SelectItem value="Expiring">Expiring</SelectItem>
                                        <SelectItem value="Expired">Expired</SelectItem>
                                        <SelectItem value="Quarantine">Quarantine</SelectItem>
                                        <SelectItem value="Mixed">Mixed</SelectItem>
                                        <SelectItem value="Empty">Empty</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input 
                                    placeholder="Search location..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full md:w-auto md:max-w-sm"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Location Name</TableHead>
                                        <TableHead>Location Type</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                                            </TableCell>
                                        </TableRow>
                                    ) : paginatedData.length > 0 ? (
                                        paginatedData.map((location) => (
                                            <TableRow key={location.id}>
                                                <TableCell className="font-medium">{location.name}</TableCell>
                                                <TableCell>
                                                    <Badge variant={typeVariantMap[location.type]}
                                                        className={cn({
                                                            'bg-green-500 hover:bg-green-500/80 text-white': location.type === 'Sellable',
                                                            'bg-yellow-500 hover:bg-yellow-500/80 text-black': location.type === 'Expiring',
                                                        })}
                                                    >
                                                        {location.type}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                                No locations found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                       </div>
                        <div className="flex items-center justify-end space-x-2 py-4">
                            <div className="flex-1 text-sm text-muted-foreground">
                                Page {filteredData.length > 0 ? currentPage : 0} of {totalPages}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Rows per page:</span>
                                <Select
                                    value={`${rowsPerPage}`}
                                    onValueChange={(value) => {
                                        setRowsPerPage(Number(value));
                                    }}
                                    >
                                    <SelectTrigger className="h-8 w-[70px]">
                                        <SelectValue placeholder={rowsPerPage} />
                                    </SelectTrigger>
                                    <SelectContent side="top">
                                        {[10, 25, 50, 100].map((pageSize) => (
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
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
