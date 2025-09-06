import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const users = [
    { name: 'Arlan Saputra', status: 'Leader', role: 'Super Admin' },
    { name: 'Rudi Setiawan', status: 'Leader', role: 'Leader' },
    { name: 'Diki Mauli', status: 'Reguler', role: 'Captain' },
    { name: 'Virgiawan Juhri', status: 'Reguler', role: 'Captain' },
    { name: 'Nurul Tanzilla', status: 'Reguler', role: 'Admin' },
    { name: 'Nova Aurelia Herman', status: 'Reguler', role: 'Admin' },
    { name: 'Regina Rahmi Rifana', status: 'Event', role: 'Admin' },
    { name: 'Ishika Seherena', status: 'Event', role: 'Packer' },
    { name: 'Elah Febriyanti', status: 'Event', role: 'Packer' },
    { name: 'Erni Atriyanti', status: 'Event', role: 'Packer' },
    { name: 'Yanti Monica', status: 'Event', role: 'Packer' },
    { name: 'Tia Puspita', status: 'Event', role: 'Packer' },
    { name: 'Mila Sari', status: 'Event', role: 'Packer' },
    { name: 'Cindy Vika Lestari', status: 'Event', role: 'Packer' },
    { name: 'Mirna', status: 'Event', role: 'Packer' },
    { name: 'Nur Yasmin Sabrina', status: 'Event', role: 'Packer' },
    { name: 'Rosnani', status: 'Event', role: 'Packer' },
    { name: 'Ridwan', status: 'Event', role: 'Picker' },
    { name: 'Rendi Tri Suyono', status: 'Event', role: 'Picker' },
    { name: 'Wawi Sahalawi', status: 'Event', role: 'Picker' },
    { name: 'Omar Dhani', status: 'Event', role: 'Picker' },
    { name: 'Ditya Nuranjani', status: 'Event', role: 'Picker' },
    { name: 'Riki Fajar', status: 'Event', role: 'Putaway' },
    { name: 'Adi Mulya', status: 'Event', role: 'Putaway' },
    { name: 'Noval Ardiansyah', status: 'Event', role: 'Putaway' },
    { name: 'Hadi Nurjamil', status: 'Event', role: 'Putaway' },
];

const statusVariantMap: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Leader': 'destructive',
    'Reguler': 'default',
    'Event': 'secondary',
};

export default function DatabaseUserPage() {
    return (
        <div className="w-full max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Database User</h1>
            <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>A list of all the users in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.name}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariantMap[user.status] || 'default'}>{user.status}</Badge>
                                    </TableCell>
                                    <TableCell>{user.role}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
