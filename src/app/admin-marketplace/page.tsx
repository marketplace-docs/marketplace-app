import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Pencil, Printer, Plus, X, ArrowUp } from 'lucide-react';

const leaders = [
  { role: 'LEADER PAGI', name: 'Arlan Testing' },
  { role: 'LEADER SORE', name: 'Nama Leader Sore' },
  { role: 'CAPTAIN PAGI', name: 'Nama Captain Pagi' },
  { role: 'CAPTAIN SORE', name: 'Nama Captain Sore' },
];

const staff = [
  {
    name: 'Nova Aurelia Herman',
    job: 'Admin',
    shift: 'PAGI',
    time: '08:00 - 17:00',
    status: 'REGULER',
  },
  {
    name: 'Arlan Testing 3',
    job: 'Putaway',
    shift: 'Siang',
    time: '13:00 - 21:00',
    status: 'EVENT',
  },
  {
    name: 'Arlan Testing 2',
    job: 'Picker',
    shift: 'Pagi',
    time: '08:00 - 16:00',
    status: 'EVENT',
  },
  {
    name: 'Arlan Testing 1',
    job: 'Packer',
    shift: 'Sore',
    time: '16:00 - 00:00',
    status: 'EVENT',
  },
];

export default function AdminMarketplacePage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto relative">
      <Button variant="ghost" size="icon" className="absolute top-4 right-4">
        <X className="h-5 w-5" />
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">FULFILLMENT MARKETPLACE</h1>
        <p className="text-muted-foreground">
          Jadwal Marketplace, 31 Agustus 2025
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Leader & Captain</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {leaders.map((leader) => (
            <div
              key={leader.role}
              className="border p-4 rounded-lg bg-gray-50"
            >
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-muted-foreground">{leader.role}</p>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
              <p className="font-semibold">{leader.name}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-6 font-bold">
            <div className="flex items-center gap-1">
              <span>Name</span>
              <ArrowUp className="h-4 w-4" />
            </div>
            <span>Job</span>
            <span>Shift</span>
            <span>Time Work</span>
            <span>Status</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
              <Printer className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="border border-t-0 rounded-b-lg">
          <Table>
            <TableBody>
              {staff.map((person, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium w-1/4">{person.name}</TableCell>
                  <TableCell className="w-1/6">{person.job}</TableCell>
                  <TableCell className="w-1/6">{person.shift}</TableCell>
                  <TableCell className="w-1/4">{person.time}</TableCell>
                  <TableCell className="w-1/6">{person.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <Button variant="outline">Close</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  );
}
