'use client';

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
import { Pencil, Printer, Plus, X, ArrowUp, ArrowDown } from 'lucide-react';
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialLeaders = [
  { role: 'LEADER PAGI', name: 'Arlan Testing' },
  { role: 'LEADER SORE', name: 'Nama Leader Sore' },
  { role: 'CAPTAIN PAGI', name: 'Nama Captain Pagi' },
  { role: 'CAPTAIN SORE', name: 'Nama Captain Sore' },
];

const initialStaff = [
  {
    id: 1,
    name: 'Nova Aurelia Herman',
    job: 'Admin',
    shift: 'PAGI',
    time: '08:00 - 17:00',
    status: 'REGULER',
  },
  {
    id: 2,
    name: 'Arlan Testing 3',
    job: 'Putaway',
    shift: 'Siang',
    time: '13:00 - 21:00',
    status: 'EVENT',
  },
  {
    id: 3,
    name: 'Arlan Testing 2',
    job: 'Picker',
    shift: 'Pagi',
    time: '08:00 - 16:00',
    status: 'EVENT',
  },
  {
    id: 4,
    name: 'Arlan Testing 1',
    job: 'Packer',
    shift: 'Sore',
    time: '16:00 - 00:00',
    status: 'EVENT',
  },
];

type Leader = (typeof initialLeaders)[0];
type Staff = (typeof initialStaff)[0];
type SortOrder = 'asc' | 'desc';

export default function AdminMarketplacePage() {
  const [leaders, setLeaders] = useState<Leader[]>(initialLeaders);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [isEditLeaderDialogOpen, setEditLeaderDialogOpen] = useState(false);
  const [isAddStaffDialogOpen, setAddStaffDialogOpen] = useState(false);
  const [newStaffMember, setNewStaffMember] = useState<Omit<Staff, 'id'>>({
    name: '',
    job: '',
    shift: '',
    time: '',
    status: '',
  });

  const handleSort = () => {
    const newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    const sortedStaff = [...staff].sort((a, b) => {
      if (a.name < b.name) return newSortOrder === 'asc' ? -1 : 1;
      if (a.name > b.name) return newSortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    setStaff(sortedStaff);
    setSortOrder(newSortOrder);
  };

  const openEditLeaderDialog = (leader: Leader) => {
    setEditingLeader(leader);
    setEditLeaderDialogOpen(true);
  }

  const handleSaveLeader = () => {
    if (editingLeader) {
      setLeaders(
        leaders.map((l) =>
          l.role === editingLeader.role ? { ...l, name: editingLeader.name } : l
        )
      );
      setEditLeaderDialogOpen(false);
      setEditingLeader(null);
    }
  };

  const handleAddStaff = () => {
    if (Object.values(newStaffMember).some(val => val.trim() === '')) {
      // Basic validation
      alert("Please fill all staff fields.");
      return;
    }
    const newId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
    setStaff([...staff, { id: newId, ...newStaffMember }]);
    setNewStaffMember({ name: '', job: '', shift: '', time: '', status: '' });
    setAddStaffDialogOpen(false);
  };

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
                 <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditLeaderDialog(leader)}>
                   <Pencil className="h-3 w-3" />
                 </Button>
              </div>
              <p className="font-semibold">{leader.name}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Dialog open={isEditLeaderDialogOpen} onOpenChange={setEditLeaderDialogOpen}>
        {editingLeader && (
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Leader/Captain</DialogTitle>
                <DialogDescription>
                  Update the name for {editingLeader.role}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" value={editingLeader.name} className="col-span-3" 
                    onChange={(e) => setEditingLeader({...editingLeader, name: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSaveLeader}>Save changes</Button>
              </DialogFooter>
            </DialogContent>
        )}
      </Dialog>


      <div>
        <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center gap-6 font-bold text-sm">
            <div className="flex items-center gap-1 cursor-pointer" onClick={handleSort}>
              <span>Name</span>
              {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
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
            <Dialog open={isAddStaffDialogOpen} onOpenChange={setAddStaffDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Staff</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <Input placeholder="Name" value={newStaffMember.name} onChange={e => setNewStaffMember({...newStaffMember, name: e.target.value})} />
                  <Input placeholder="Job" value={newStaffMember.job} onChange={e => setNewStaffMember({...newStaffMember, job: e.target.value})} />
                  <Input placeholder="Shift" value={newStaffMember.shift} onChange={e => setNewStaffMember({...newStaffMember, shift: e.target.value})} />
                  <Input placeholder="Time Work" value={newStaffMember.time} onChange={e => setNewStaffMember({...newStaffMember, time: e.target.value})} />
                  <Input placeholder="Status" value={newStaffMember.status} onChange={e => setNewStaffMember({...newStaffMember, status: e.target.value})} />
                </div>
                <DialogFooter>
                  <Button onClick={handleAddStaff}>Add Staff</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="border border-t-0 rounded-b-lg">
          <Table>
            <TableBody>
              {staff.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium w-[23%]">{person.name}</TableCell>
                  <TableCell className="w-[15%]">{person.job}</TableCell>
                  <TableCell className="w-[15%]">{person.shift}</TableCell>
                  <TableCell className="w-[27%]">{person.time}</TableCell>
                  <TableCell className="w-[20%]">{person.status}</TableCell>
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
