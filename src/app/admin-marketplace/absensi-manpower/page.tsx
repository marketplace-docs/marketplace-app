
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
import { Pencil, Printer, Plus, ArrowUp, ArrowDown, Upload, Download, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
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
import { PrintableSchedule } from '../printable-schedule';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MainLayout } from '@/components/layout/main-layout';


const initialLeaders = [
  { role: 'LEADER PAGI', name: '' },
  { role: 'LEADER SORE', name: '' },
  { role: 'CAPTAIN PAGI', name: '' },
  { role: 'CAPTAIN SORE', name: '' },
];

const initialStaff: Staff[] = [];

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

export type Leader = {
    role: string;
    name: string;
}
export type Staff = {
    id: number;
    name: string;
    job: string;
    shift: string;
    time: string;
    status: string;
};
type SortOrder = 'asc' | 'desc';

export default function AbsensiManpowerPage() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [date, setDate] = React.useState<DateRange | undefined>();

  useEffect(() => {
    setDate({
      from: new Date(),
      to: new Date(),
    });
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(staff.length / rowsPerPage);
  const paginatedStaff = staff.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };
  
  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);


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

  const checkScroll = () => {
    if (window.pageYOffset > 100) {
      setShowScroll(true);
    } else {
      setShowScroll(false);
    }
  };

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    window.addEventListener('scroll', checkScroll);
    return () => window.removeEventListener('scroll', checkScroll);
  }, []);

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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all staff fields.",
      });
      return;
    }
    const newId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) + 1 : 1;
    setStaff([...staff, { id: newId, ...newStaffMember }]);
    setNewStaffMember({ name: '', job: '', shift: '', time: '', status: '' });
    setAddStaffDialogOpen(false);
    toast({
        title: "Success",
        description: "New staff member added.",
    });
  };

  const getAvailableShifts = (job: string): string[] => {
    if (!job || !jobSchedules[job as Job]) return [];
    return Object.keys(jobSchedules[job as Job]);
  }

  const handlePrint = () => {
    setPrintDialogOpen(false);
    setTimeout(() => window.print(), 100);
  };
  
  const handleExport = () => {
    const headers = ["Role/Job", "Name", "Shift", "Time Work", "Status"];
    
    const leaderRows = leaders.map(l => [l.role, l.name, "", "", ""]);
    const staffRows = staff.map(s => [s.job, s.name, s.shift, s.time, s.status]);
    
    const csvContent = [
        "Leaders & Captains",
        headers.slice(0, 2).join(","),
        ...leaderRows.map(row => row.slice(0, 2).join(",")),
        "",
        "Staff",
        headers.join(","),
        ...staffRows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = `schedule_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: "Success",
      description: "Schedule exported as CSV.",
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
            const lines = text.split('\n').filter(line => line.trim() !== '');
            const newStaffList: Staff[] = [];
            let maxId = staff.length > 0 ? Math.max(...staff.map(s => s.id)) : 0;
            
            lines.forEach((line, index) => {
              if (index === 0 && line.toLowerCase().includes('name')) return; // Skip header

              const [name, job, shift] = line.split(',').map(s => s.trim());

              if (name && job && shift) {
                const jobKey = job as Job;
                const schedule = (jobSchedules[jobKey] as any)?.[shift];
                if (schedule) {
                    newStaffList.push({
                        id: ++maxId,
                        name,
                        job: jobKey,
                        shift,
                        time: schedule.time,
                        status: schedule.status
                    });
                } else {
                    throw new Error(`Invalid job/shift combination on line ${index + 1}: ${line}`);
                }
              } else {
                 throw new Error(`Invalid CSV format on line ${index + 1}: ${line}`);
              }
            });

            setStaff(prevStaff => [...prevStaff, ...newStaffList]);
            setAddStaffDialogOpen(false);
            toast({
                title: "Success",
                description: `${newStaffList.length} staff members uploaded successfully.`,
            });

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Upload Failed",
                description: error.message || "An error occurred while parsing the CSV file.",
            });
        }
    };
    reader.readAsText(file);
    // Reset file input
    if (event.target) {
        event.target.value = '';
    }
  };


  return (
    <MainLayout>
      <div id="printable-schedule" className="hidden print:block">
        <PrintableSchedule leaders={leaders} staff={staff} />
      </div>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full print:hidden">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Absensi Manpower</h1>
          <div className="text-muted-foreground flex items-center gap-2">
            <span>Jadwal Marketplace,</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
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
                <p className="font-semibold">{leader.name || '-'}</p>
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
                  <Button onClick={handleSaveLeader}>Save Changes</Button>
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
                                              This will prepare the schedule for printing. Are you sure you want to continue?
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
                                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                                      <Button variant="outline" onClick={handleUploadClick}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                                      <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
                                      <Button onClick={handleAddStaff}>Add Staff</Button>
                                  </DialogFooter>
                                  </DialogContent>
                              </Dialog>
                          </div>
                      </TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStaff.length > 0 ? paginatedStaff.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell>{person.job}</TableCell>
                    <TableCell>{person.shift}</TableCell>
                    <TableCell>{person.time}</TableCell>
                    <TableCell>{person.status}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No data available. Add staff to see the list.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
                Page {staff.length > 0 ? currentPage : 0} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                    value={`${rowsPerPage}`}
                    onValueChange={(value) => {
                        setRowsPerPage(Number(value));
                    }}
                    >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={rowsPerPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                        {[5, 10, 25, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
            >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>

          {showScroll && (
            <div className="fixed bottom-10 right-10 flex flex-col gap-2">
              <Button
                onClick={scrollTop}
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                <ArrowUp className="h-6 w-6" />
              </Button>
              <Button
                onClick={scrollBottom}
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
              >
                <ArrowDown className="h-6 w-6" />
              </Button>
            </div>
          )}
      </div>
    </MainLayout>
  );
}
