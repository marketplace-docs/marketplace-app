import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminMarketplacePage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Admin Marketplace</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Admin Marketplace Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Fitur pelacakan Marketplace Admin akan diimplementasikan di sini.</p>
                </CardContent>
            </Card>
        </div>
    )
}
