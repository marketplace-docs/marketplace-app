
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Pencil,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Adapted from marketplace-store data
const initialStoresData = [
  { id: 1, marketplace: 'Shopee', storeName: 'Jung Saem Mool Official Store', paymentAccepted: 150, platform: 'Mobile' },
  { id: 2, marketplace: 'Shopee', storeName: 'Amuse Official Store', paymentAccepted: 200, platform: 'Desktop' },
  { id: 3, marketplace: 'Shopee', storeName: 'Carasun.id Official Store', paymentAccepted: 120, platform: 'Mobile' },
  { id: 4, marketplace: 'Lazada', storeName: 'COSRX Official Store', paymentAccepted: 300, platform: 'Desktop' },
  { id: 25, marketplace: 'Tiktok', storeName: 'Lilla Official store', paymentAccepted: 80, platform: 'Mobile' },
];


type BacklogItem = {
  id: number;
  storeName: string;
  paymentAccepted: number;
  marketplace: string;
  platform: string;
};

export default function BacklogPage() {
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(backlogItems.length / rowsPerPage);
  const paginatedItems = useMemo(() => {
    return backlogItems.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [backlogItems, currentPage, rowsPerPage]);

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };
  
  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);

  const chartData = useMemo(() => {
    // This is placeholder logic. You might want to aggregate data differently.
    return backlogItems.map(item => ({
      name: item.storeName.slice(0, 15) + '...', // Shorten name for chart labels
      'Marketplace Store': 1, // Dummy data
      'Payment Accepted': item.paymentAccepted,
    }));
  }, [backlogItems]);

  const totalMarketplaceStore = backlogItems.length;
  const totalPaymentAccepted = backlogItems.reduce((acc, item) => acc + item.paymentAccepted, 0);


  return (
    <div className="w-full max-w-7xl space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <Tabs defaultValue="all-store">
              <TabsList>
                <TabsTrigger value="all-store">MP All-Store</TabsTrigger>
                <TabsTrigger value="detail-store">MP Detail Store</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
              <Button variant="default">
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>STORE NAME</TableHead>
                  <TableHead>PAYMENT ACCEPTED</TableHead>
                  <TableHead>MARKETPLACE</TableHead>
                  <TableHead>PLATFORM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.storeName}</TableCell>
                      <TableCell>{item.paymentAccepted}</TableCell>
                      <TableCell>{item.marketplace}</TableCell>
                      <TableCell>{item.platform}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No backlog data. Please upload a CSV.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
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
                        {[10, 20, 50].map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{(currentPage - 1) * rowsPerPage + 1}-{(currentPage - 1) * rowsPerPage + paginatedItems.length} of {backlogItems.length}</span>
                 <div className="flex items-center space-x-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleFirstPage} disabled={currentPage === 1}>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                     <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleLastPage} disabled={currentPage === totalPages || totalPages === 0}>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                 </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
           <div className="flex justify-between items-start">
            <div>
              <CardTitle>Grafik Backlog</CardTitle>
              <Tabs defaultValue="store-name" className="mt-2">
                <TabsList>
                  <TabsTrigger value="store-name">Store Name</TabsTrigger>
                  <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
                  <TabsTrigger value="platform">Platform</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2 border rounded-md">
                    <span>Marketplace Store</span>
                    <span className="font-bold ml-4">{totalMarketplaceStore}</span>
                </div>
                 <div className="flex items-center justify-between p-2 border rounded-md border-green-500 text-green-600">
                    <span>Payment Accepted</span>
                    <span className="font-bold ml-4">{totalPaymentAccepted}</span>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }}/>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        Payment Accepted
                                      </span>
                                      <span className="font-bold text-muted-foreground">
                                        {payload[0].value}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Payment Accepted" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

