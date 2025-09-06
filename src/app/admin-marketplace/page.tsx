'use client';

import {
  Card,
  CardContent,
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
import { Pencil, Printer, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const jobSchedules = {
  Admin: {
    Pagi: { time: '08:00 - 17:00', status: 'Reguler' },
    Sore: { time: '15:00 - 00:00', status: 'Event' },
    Siang: { time: '13:00 - 22:00', status: 'Reguler' },
  },
  Captain: {
    Pagi: { time: '09:00 - 18:00', status: 'Reguler' },
    Sore: { time: '15:00 - 00:00', status: 'Event' },
    Siang: { time: '13:00 - 22:00', status: 'Reguler' },
  },
  Picker: {
    Pagi: { time: '08:00 - 16:00', status: 'Event' },
    Sore: { time: '16:00 - 00:00', status: 'Event' },
    Siang: { time: '13:00 - 22:00', status: 'Reguler' },
  },
  Packer: {
    Pagi: { time: '09:00 - 17:00', status: 'Event' },
    Sore: { time: '16:00 - 00:00', status: 'Event' },
    Siang: { time: '13:00 - 22:00', status: 'Reguler' },
  },
  Putaway: {
    Pagi: { time: '09:00 - 17:00', status: 'Event' },
    Siang: { time: '13:00 - 21:00', status: 'Event' },
    Sore: { time: '16:00 - 00:00', status: 'Event' },
  },
  Leader: {
    Pagi: { time: '09:00 - 18:00', status: 'Staff' },
    Sore: { time: '15:00 - 00:00', status: 'Staff' },
  },
  Parakerja: {
    Pagi: { time: '08:00 - 17:00', status: 'Reguler' },
  },
};

type Job = keyof typeof jobSchedules;
const jobs = Object.keys(jobSchedules) as Job[];

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
  const [isPrintDialogOpen, setPrintDialogOpen] = useState(false);
  const [newStaffMember, setNewStaffMember] = useState<Omit<Staff, 'id'>>({
    name: '',
    job: '',
    shift: '',
    time: '',
    status: '',
  });
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const { job, shift } = newStaffMember;
    if (job && shift) {
      const schedule = (jobSchedules[job as Job] as any)?.[shift];
      if (schedule) {
        setNewStaffMember(prev => ({ ...prev, time: schedule.time, status: schedule.status }));
      } else {
        setNewStaffMember(prev => ({ ...prev, time: '', status: '' }));
      }
    } else {
       setNewStaffMember(prev => ({ ...prev, time: '', status: '' }));
    }
  }, [newStaffMember.job, newStaffMember.shift]);

  const checkScrollTop = () => {
    if (!showScroll && window.pageYOffset > 400){
      setShowScroll(true)
    } else if (showScroll && window.pageYOffset <= 400){
      setShowScroll(false)
    }
  };

  const scrollTop = () =>{
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScrollTop)
    return () => window.removeEventListener('scroll', checkScrollTop)
  }, [showScroll]);

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

  const getAvailableShifts = (job: string): string[] => {
    if (!job || !jobSchedules[job as Job]) return [];
    return Object.keys(jobSchedules[job as Job]);
  }

  const handlePrint = () => {
    setPrintDialogOpen(false);
    window.print();
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-7xl relative">
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
              </DialogFooter>
            </DialogContent>
        )}
      </Dialog>


      <div className="border rounded-lg overflow-hidden">
        <Table>
            <TableHeader className="bg-primary text-primary-foreground">
                <TableRow className="hover:bg-primary">
                    <TableHead className="text-primary-foreground font-bold">
                        <div className="flex items-center gap-1 cursor-pointer" onClick={handleSort}>
                            <span>Name</span>
                            {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                        </div>
                    </TableHead>
                    <TableHead className="text-primary-foreground font-bold">Job</TableHead>
                    <TableHead className="text-primary-foreground font-bold">Shift</TableHead>
                    <TableHead className="text-primary-foreground font-bold">Time Work</TableHead>
                    <TableHead className="text-primary-foreground font-bold">Status</TableHead>
                    <TableHead className="text-right text-primary-foreground">
                        <div className="flex items-center justify-end gap-2">
                            <Dialog open={isPrintDialogOpen} onOpenChange={setPrintDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
                                        <Printer className="h-5 w-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Print Schedule</DialogTitle>
                                        <DialogDescription>
                                            This will open your browser's print dialog to print the current schedule view.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setPrintDialogOpen(false)}>Cancel</Button>
                                        <Button onClick={handlePrint}>Print</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
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
                                    <Select value={newStaffMember.job} onValueChange={value => setNewStaffMember({...newStaffMember, job: value, shift: ''})}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Job" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {jobs.map(job => (
                                          <SelectItem key={job} value={job}>{job}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select value={newStaffMember.shift} onValueChange={value => setNewStaffMember({...newStaffMember, shift: value})} disabled={!newStaffMember.job}>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select Shift" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {getAvailableShifts(newStaffMember.job).map(shift => (
                                          <SelectItem key={shift} value={shift}>{shift}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Input placeholder="Time Work" value={newStaffMember.time} readOnly disabled />
                                    <Input placeholder="Status" value={newStaffMember.status} readOnly disabled />
                                </div>
                                <DialogFooter>
                                    <Button onClick={handleAddStaff}>Add Staff</Button>
                                </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.job}</TableCell>
                  <TableCell>{person.shift}</TableCell>
                  <TableCell>{person.time}</TableCell>
                  <TableCell>{person.status}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </div>

        {showScroll && (
            <Button
            onClick={scrollTop}
            variant="ghost"
            size="icon"
            className="fixed bottom-10 right-10 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            >
            <ArrowUp className="h-6 w-6" />
            </Button>
        )}
    </div>
  );
}
