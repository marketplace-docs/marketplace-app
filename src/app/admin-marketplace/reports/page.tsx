import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReportsPage() {
    return (
        <div className="w-full max-w-7xl">
            <h1 className="text-3xl font-bold mb-6">Admin Reports</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Marketplace Reports</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Detailed reports for the marketplace will be displayed here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
