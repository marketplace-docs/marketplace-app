
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { MainLayout } from '@/components/layout/main-layout';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { MarketplaceStore } from '@/types/marketplace-store';
import { useAuth } from '@/hooks/use-auth';

type NewStore = Omit<MarketplaceStore, 'id' | 'created_at'>;

export default function CreateMarketplacePage() {
  const [newStore, setNewStore] = React.useState<NewStore>({
    marketplace_name: '',
    store_name: '',
    platform: '',
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const canCreate = user?.role && ['Super Admin', 'Manager', 'Supervisor', 'Captain', 'Admin'].includes(user.role);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewStore((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStore.store_name || !newStore.platform || !newStore.marketplace_name) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please fill out all fields.',
      });
      return;
    }
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to create a store.' });
        return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/marketplace-stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newStore, user }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to create store');
      }

      toast({
        title: 'Success',
        description: 'New store has been created.',
      });
      setNewStore({ marketplace_name: '', store_name: '', platform: '' });
      router.push('/marketplace/monitoring-store');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Something went wrong while creating the store.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <h1 className="text-2xl font-bold">Marketplace</h1>
        <Card>
          <CardHeader>
            <CardTitle>Create Marketplace Store</CardTitle>
            <CardDescription>
              Fill out the form below to create a new store entry.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="marketplace_name">Marketplace Name</Label>
                <Input
                  id="marketplace_name"
                  name="marketplace_name"
                  placeholder="Enter marketplace name"
                  value={newStore.marketplace_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store_name">Store Name</Label>
                <Input
                  id="store_name"
                  name="store_name"
                  placeholder="Enter store name"
                  value={newStore.store_name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  name="platform"
                  placeholder="Enter platform"
                  value={newStore.platform}
                  onChange={handleInputChange}
                />
              </div>
              <div className="flex justify-end pt-4">
                {canCreate && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit
                </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
