
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";

export default function AppSettingsPage() {
    const { user } = useAuth();
    return (
      <MainLayout>
        <div className="w-full max-w-7xl space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>Update your personal information and profile picture.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                            <span className="text-muted-foreground text-xs">Avatar</span>
                        </div>
                        <Button variant="outline">Change Picture</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue="Admin User" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={user?.email || ''} disabled />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save Changes</Button>
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Manage how you receive notifications.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="email-notifications" className="font-medium">Email Notifications</Label>
                            <p className="text-sm text-muted-foreground">Receive notifications about tasks and reports via email.</p>
                        </div>
                        <Switch id="email-notifications" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="push-notifications" className="font-medium">Push Notifications</Label>
                            <p className="text-sm text-muted-foreground">Get push notifications on your devices.</p>
                        </div>
                        <Switch id="push-notifications" />
                    </div>
                </CardContent>
                 <CardFooter className="border-t px-6 py-4">
                    <Button>Save Preferences</Button>
                </CardFooter>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select defaultValue="system">
                            <SelectTrigger id="theme">
                                <SelectValue placeholder="Select theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            Select the theme for the dashboard.
                        </p>
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Apply Theme</Button>
                </CardFooter>
            </Card>
        </div>
      </MainLayout>
    )
}
