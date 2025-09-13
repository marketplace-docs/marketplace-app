
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function UpdateExpiredPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Update Expired</h1>
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle>Update Product Location</CardTitle>
                        <CardDescription>Scan barcode and update the product's location.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="barcode">Barcode</Label>
                                <Input id="barcode" placeholder="Scan or enter product barcode" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="location">New Location</Label>
                                <Input id="location" placeholder="Scan or enter new location" />
                            </div>
                            <div className="pt-2">
                                <Button type="submit" className="w-full">
                                    Update Location
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
