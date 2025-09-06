import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DatabaseUserPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Database User</h1>
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">User database and management will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
