
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
                <Card>
                    <CardHeader>
                        <CardTitle>Update Product Information</CardTitle>
                        <CardDescription>Scan barcode to update the product's location, expiration date, and quantity.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4">
                             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="barcode">Barcode</Label>
                                    <Input id="barcode" placeholder="Scan or enter product barcode" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">New Location</Label>
                                    <Input id="location" placeholder="Scan or enter new location" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="exp_date">New Exp Date</Label>
                                    <Input id="exp_date" type="date" placeholder="Enter new expiration date" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">New Quantity</Label>
                                    <Input id="quantity" type="number" placeholder="Enter new quantity" />
                                </div>
                             </div>
                            <div className="pt-2 flex justify-end">
                                <Button type="submit">
                                    Update Information
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
