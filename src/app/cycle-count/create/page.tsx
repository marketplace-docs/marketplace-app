'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import type { CycleCountDoc } from '@/types/cycle-count-doc';

type NewCycleCountDoc = Omit<CycleCountDoc, 'id' | 'date' | 'created_at'>;

export default function CreateCycleCountPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [newDoc, setNewDoc] = useState<NewCycleCountDoc>({
        no_document: '',
        counter_name: '',
        count_type: 'By Location',
        items_to_count: '',
        status: 'Pending',
        notes: '',
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const canCreate = user?.role && ['Super Admin', 'Manager', 'Supervisor'].includes(user.role);

    const generateDocNumber = useCallback(async () => {
        try {
            const response = await fetch('/api/cycle-count-docs/generate-number');
            if (!response.ok) throw new Error('Failed to generate document number');
            const data = await response.json();
            setNewDoc(prev => ({ ...prev, no_document: data.newDocNumber }));
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        }
    }, [toast]);
    
    useEffect(() => {
        if(canCreate) {
            generateDocNumber();
        }
    }, [canCreate, generateDocNumber]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewDoc(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof NewCycleCountDoc, value: string) => {
        setNewDoc(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        if (!newDoc.counter_name || !newDoc.items_to_count) {
             toast({ variant: 'destructive', title: 'Error', description: 'Counter Name and Items to Count are required.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/cycle-count-docs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ document: newDoc, user }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to create cycle count document.');
            }
            
            toast({ title: 'Success', description: 'New Cycle Count document has been created.' });
            router.push('/cycle-count/monitoring');

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Create Cycle Count</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>New Cycle Count Document</CardTitle>
                        <CardDescription>Fill out the form to assign a new stock counting task.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <form onSubmit={handleSubmit} className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                               <div className="space-y-2">
                                   <Label htmlFor="no_document">No. Document</Label>
                                   <Input id="no_document" value={newDoc.no_document} readOnly className="bg-muted"/>
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="date">Date</Label>
                                   <Input id="date" value={format(new Date(), 'dd/MM/yyyy HH:mm')} disabled className="bg-muted" />
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="counter_name">Counter Name</Label>
                                   <Input id="counter_name" name="counter_name" value={newDoc.counter_name} onChange={handleInputChange} placeholder="Enter counter's name" />
                               </div>
                               <div className="space-y-2">
                                   <Label htmlFor="status">Status</Label>
                                    <Select value={newDoc.status} onValueChange={(value) => handleSelectChange('status', value)}>
                                       <SelectTrigger id="status">
                                           <SelectValue placeholder="Select Status" />
                                       </SelectTrigger>
                                       <SelectContent>
                                           <SelectItem value="Pending">Pending</SelectItem>
                                           <SelectItem value="In Progress">In Progress</SelectItem>
                                       </SelectContent>
                                   </Select>
                               </div>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                   <Label htmlFor="count_type">Count Type</Label>
                                    <Select value={newDoc.count_type} onValueChange={(value) => handleSelectChange('count_type', value)}>
                                       <SelectTrigger id="count_type">
                                           <SelectValue placeholder="Select Count Type" />
                                       </SelectTrigger>
                                       <SelectContent>
                                           <SelectItem value="By Location">By Location</SelectItem>
                                           <SelectItem value="By SKU">By SKU</SelectItem>
                                       </SelectContent>
                                   </Select>
                               </div>
                                <div className="space-y-2">
                                   <Label htmlFor="items_to_count">Locations / SKUs to Count</Label>
                                   <Textarea id="items_to_count" name="items_to_count" value={newDoc.items_to_count} onChange={handleInputChange} placeholder="Enter a list of locations or SKUs, separated by commas or new lines."/>
                               </div>
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="notes">Notes</Label>
                               <Textarea id="notes" name="notes" value={newDoc.notes} onChange={handleInputChange} placeholder="Add any special instructions for this cycle count task."/>
                           </div>
                           <div className="flex justify-end">
                                {canCreate ? (
                                    <Button type="submit" disabled={isSubmitting || !newDoc.no_document}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Submit Document
                                    </Button>
                                ) : (
                                    <p className="text-sm text-destructive">You do not have permission to create a document.</p>
                                )}
                           </div>
                       </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
