
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CreateMarketplacePage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Marketplace</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Create Marketplace</CardTitle>
                        <CardDescription>
                            This is a placeholder page for creating a new marketplace entry.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="marketplace-name">Marketplace Name</Label>
                                <Input id="marketplace-name" placeholder="Enter marketplace name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="store-name">Store Name</Label>
                                <Input id="store-name" placeholder="Enter store name" />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit">Submit</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
