import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InventoryPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Inventory</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Inventory Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Inventory tracking feature will be implemented here.</p>
                </CardContent>
            </Card>
        </div>
    )
}
