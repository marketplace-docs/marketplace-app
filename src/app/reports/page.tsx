import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReportsPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Reports</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Automated Reporting</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Automated reporting feature will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
