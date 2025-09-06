
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
import {
  Plus,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/hooks/use-toast';

type PicklistEntry = {
  id: number;
  storeName: string;
  type: 'Instan' | 'Reguler';
  value: number; // Placeholder for the numeric value shown next to the type
};

type NewEntry = Omit<PicklistEntry, 'id'>;

export default function AdminReportsPage() {
  const [entries, setEntries] = useState<PicklistEntry[]>([]);
  const [nama, setNama] = useState('');
  const [shift, setShift] = useState('');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Omit<NewEntry, 'type' | 'value'>>({ storeName: ''});
  const [newEntryValue, setNewEntryValue] = useState<number>(0);
  const [newEntryType, setNewEntryType] = useState<'Instan' | 'Reguler'>('Instan');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const instanEntries = entries.filter((e) => e.type === 'Instan');
  const regularEntries = entries.filter((e) => e.type === 'Reguler');

  const totalPages = Math.ceil(Math.max(instanEntries.length, regularEntries.length) / rowsPerPage);
  
  const paginatedInstan = instanEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
  const paginatedRegular = regularEntries.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);


  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };
  
  const handleAddEntry = () => {
    if (!newEntry.storeName) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Store name cannot be empty.",
        });
        return;
    }
    const newId = entries.length > 0 ? Math.max(...entries.map(e => e.id)) + 1 : 1;
    setEntries([...entries, { id: newId, ...newEntry, type: newEntryType, value: newEntryValue }]);
    setNewEntry({ storeName: '' });
    setNewEntryValue(0);
    setAddDialogOpen(false);
    toast({
        title: "Success",
        description: "New entry added.",
    });
  };

  const handleExport = () => {
    const headers = ["ID", "Store Name", "Type", "Value"];
    const csvContent = [
        headers.join(","),
        ...entries.map(e => [e.id, e.storeName, e.type, e.value].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "picklist_report.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Success", description: "Report exported as CSV." });
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
            const newEntriesList: PicklistEntry[] = [];
            let maxId = entries.length > 0 ? Math.max(...entries.map(s => s.id)) : 0;
            
            lines.forEach((line, index) => {
              if (index === 0 && line.toLowerCase().includes('store name')) return; // Skip header

              const [storeName, type, valueStr] = line.split(',').map(s => s.trim());
              const value = parseInt(valueStr, 10);

              if (storeName && (type === 'Instan' || type === 'Reguler') && !isNaN(value)) {
                  newEntriesList.push({
                      id: ++maxId,
                      storeName,
                      type,
                      value
                  });
              } else {
                 throw new Error(`Invalid CSV format on line ${index + 1}: ${line}`);
              }
            });

            setEntries(prev => [...prev, ...newEntriesList]);
            toast({
                title: "Success",
                description: `${newEntriesList.length} entries uploaded successfully.`,
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
    if (event.target) event.target.value = '';
  };


  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-7xl relative">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">REPORT ADMIN PICKLIST</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Entry
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Entry</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input placeholder="Store Name" value={newEntry.storeName} onChange={e => setNewEntry({...newEntry, storeName: e.target.value})} />
                    <Select value={newEntryType} onValueChange={(value: 'Instan' | 'Reguler') => setNewEntryType(value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Instan">Instan</SelectItem>
                            <SelectItem value="Reguler">Reguler</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Value" value={newEntryValue || ''} onChange={e => setNewEntryValue(parseInt(e.target.value) || 0)} />
                </div>
                <DialogFooter>
                    <div className="flex-1">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                        <Button variant="outline" onClick={handleUploadClick}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                        <Button variant="outline" onClick={handleExport} className="ml-2"><Download className="mr-2 h-4 w-4"/> Export</Button>
                    </div>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Close</Button>
                    <Button onClick={handleAddEntry}>Add Entry</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 bg-primary text-primary-foreground p-4 rounded-lg flex flex-col gap-2">
            <div className="flex items-center">
                <Label htmlFor="nama" className="w-16">NAMA</Label>
                <Input id="nama" value={nama} onChange={e => setNama(e.target.value)} className="bg-white text-gray-900 h-8" />
            </div>
             <div className="flex items-center">
                <Label htmlFor="shift" className="w-16">SHIFT</Label>
                <Input id="shift" value={shift} onChange={e => setShift(e.target.value)} className="bg-white text-gray-900 h-8" />
            </div>
        </div>
        <div className="bg-primary text-primary-foreground p-4 rounded-lg flex flex-col items-center justify-center">
            <p className="font-bold text-sm">TOTAL PROGRESS SHIFT</p>
            <p className="text-5xl font-bold">{entries.length}</p>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-2">
          {/* Instan Table */}
          <div className="border-r">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground">STORE NAME</TableHead>
                  <TableHead className="text-primary-foreground w-[120px]">INSTAN</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInstan.length > 0 ? (
                  paginatedInstan.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.storeName}</TableCell>
                      <TableCell>{entry.value}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                      No data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Regular Table */}
          <div>
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary">
                  <TableHead className="text-primary-foreground">STORE NAME</TableHead>
                  <TableHead className="text-primary-foreground w-[120px]">REGULAR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                 {paginatedRegular.length > 0 ? (
                  paginatedRegular.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.storeName}</TableCell>
                      <TableCell>{entry.value}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                       No data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
                value={`${rowsPerPage}`}
                onValueChange={(value) => {
                    setRowsPerPage(Number(value));
                    setCurrentPage(1);
                }}
                >
                <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={rowsPerPage} />
                </SelectTrigger>
                <SelectContent side="top">
                    {[10, 25, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            Page {totalPages > 0 ? currentPage : 0} of {totalPages}
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
      </div>
    </div>
  );
}
