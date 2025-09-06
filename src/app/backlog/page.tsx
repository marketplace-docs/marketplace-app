
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Save,
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
  LabelList,
  Cell,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { initialStores } from '@/lib/data';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/layout/main-layout';

type BacklogItem = {
  id: number;
  storeName: string;
  paymentAccepted: number;
  marketplace: string;
  platform: string;
};

type GroupingKey = "storeName" | "marketplace" | "platform";

type DetailStoreData = {
    platform: string;
    paymentAccepted: number;
};

const marketplaceColors: { [key: string]: string } = {
  'Shopee': '#F97316', // Orange
  'Lazada': '#2563EB', // Blue
  'Tiktok': '#000000', // Black
};

export default function BacklogPage() {
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [chartGrouping, setChartGrouping] = useState<GroupingKey>('storeName');
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedItems, setEditedItems] = useState<Record<number, string>>({});

  useEffect(() => {
    setIsClient(true);
    const backlogDataFromStores: BacklogItem[] = initialStores.map(store => ({
        id: store.id,
        storeName: store.storeName,
        paymentAccepted: Math.floor(Math.random() * 500) + 50, 
        marketplace: store.nameStore,
        platform: store.marketplace,
    }));
    setBacklogItems(backlogDataFromStores);
  }, []);


  const totalPages = Math.ceil(backlogItems.length / rowsPerPage);
  const paginatedItems = useMemo(() => {
    return backlogItems.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [backlogItems, currentPage, rowsPerPage]);
  
  const detailStoreData = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    backlogItems.forEach(item => {
        if (!grouped[item.platform]) {
            grouped[item.platform] = 0;
        }
        grouped[item.platform] += item.paymentAccepted;
    });
    return Object.entries(grouped).map(([platform, paymentAccepted]) => ({
        platform,
        paymentAccepted
    })).sort((a, b) => b.paymentAccepted - a.paymentAccepted);
  }, [backlogItems]);


  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };
  
  const handleFirstPage = () => setCurrentPage(1);
  const handleLastPage = () => setCurrentPage(totalPages);

  const handleExport = () => {
    if (backlogItems.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There is no data to export.",
      });
      return;
    }
    const headers = ["Store Name", "Payment Accepted", "Marketplace", "Platform"];
    const csvContent = [
        headers.join(","),
        ...backlogItems.map(item => [item.storeName, item.paymentAccepted, item.marketplace, item.platform].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.href) {
        URL.revokeObjectURL(link.href);
    }
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `backlog_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Backlog data exported as CSV." });
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
        const newItems: BacklogItem[] = [];
        let maxId = backlogItems.length > 0 ? Math.max(...backlogItems.map(item => item.id)) : 0;
        
        lines.forEach((line, index) => {
          if (index === 0 && line.toLowerCase().includes('store name')) return; // Skip header

          const [storeName, paymentAcceptedStr, marketplace, platform] = line.split(',').map(s => s.trim());
          const paymentAccepted = parseInt(paymentAcceptedStr, 10);

          if (storeName && !isNaN(paymentAccepted) && marketplace && platform) {
            newItems.push({
              id: ++maxId,
              storeName,
              paymentAccepted,
              marketplace,
              platform,
            });
          } else {
            throw new Error(`Invalid CSV format on line ${index + 1}: ${line}`);
          }
        });

        setBacklogItems(prev => [...prev, ...newItems]);
        toast({
          title: "Success",
          description: `${newItems.length} items uploaded successfully.`,
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


  const chartData = useMemo(() => {
    const groupedData: { [key: string]: { value: number; platform: string } } = {};
  
    backlogItems.forEach(item => {
      const key = item[chartGrouping];
      if (!groupedData[key]) {
        groupedData[key] = { value: 0, platform: item.platform };
      }
      groupedData[key].value += item.paymentAccepted;
    });
  
    return Object.entries(groupedData).map(([name, data]) => ({
      name: name,
      'Payment Accepted': data.value,
      fill: marketplaceColors[data.platform] || '#6366f1',
    }));
  }, [backlogItems, chartGrouping]);

  const totalMarketplaceStore = useMemo(() => {
    const uniqueStores = new Set(initialStores.map(s => s.id));
    return uniqueStores.size;
  }, []);

  const totalPaymentAccepted = useMemo(() => {
    return backlogItems.reduce((acc, item) => acc + item.paymentAccepted, 0);
  }, [backlogItems]);

  const handleEditToggle = () => {
    if (isEditing) {
      const updatedBacklogItems = backlogItems.map(item => {
        const editedValue = editedItems[item.id];
        if (editedValue !== undefined) {
          const newPaymentAccepted = parseInt(editedValue, 10);
          if (!isNaN(newPaymentAccepted)) {
            return { ...item, paymentAccepted: newPaymentAccepted };
          }
        }
        return item;
      });
      setBacklogItems(updatedBacklogItems);
      setEditedItems({});
      toast({ title: "Success", description: "Payment accepted values have been updated." });
    }
    setIsEditing(!isEditing);
  };

  const handleItemChange = (id: number, value: string) => {
    setEditedItems(prev => ({...prev, [id]: value}));
  };

  if (!isClient) {
    return null;
  }

  return (
    <MainLayout>
      <div className="w-full space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Backlog Marketplace</h1>
          <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
              <Button variant="outline" onClick={handleUploadClick}>
                  <Upload className="mr-2 h-4 w-4" /> Import
              </Button>
              <Button variant="outline" onClick={handleEditToggle}>
                {isEditing ? <Save className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                {isEditing ? 'Save' : 'Edit'}
              </Button>
              <Button variant="default" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" /> Export
              </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all-store">
            <TabsList className="bg-gray-200">
                <TabsTrigger value="all-store" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">MP All-Store</TabsTrigger>
                <TabsTrigger value="detail-store" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">MP Detail Store</TabsTrigger>
            </TabsList>
              <TabsContent value="all-store">
                <Card className="mt-4">
                    <CardContent className="pt-6">
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
                                <TableCell className="font-medium">
                                  {item.storeName}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input 
                                      type="number"
                                      value={editedItems[item.id] ?? item.paymentAccepted} 
                                      onChange={(e) => handleItemChange(item.id, e.target.value)} 
                                      className="h-8"
                                    />
                                  ) : (
                                    item.paymentAccepted
                                  )}
                                </TableCell>
                                <TableCell>{item.marketplace}</TableCell>
                                <TableCell>{item.platform}</TableCell>
                                </TableRow>
                            ))
                            ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                No backlog data available.
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
                                    {[10, 20, 30].map((pageSize) => (
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
            </TabsContent>
            <TabsContent value="detail-store">
                <Card className="mt-4">
                    <CardContent className="pt-6">
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PLATFORM</TableHead>
                                        <TableHead className="text-right">PAYMENT ACCEPTED</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detailStoreData.length > 0 ? (
                                        detailStoreData.map((item) => (
                                            <TableRow key={item.platform}>
                                                <TableCell className="font-medium">{item.platform}</TableCell>
                                                <TableCell className="text-right">{item.paymentAccepted.toLocaleString()}</TableCell>
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
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Grafik Backlog</CardTitle>
                <Tabs defaultValue="storeName" onValueChange={(value) => setChartGrouping(value as GroupingKey)} className="mt-2">
                  <TabsList className="bg-gray-200">
                    <TabsTrigger value="storeName" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Store Name</TabsTrigger>
                    <TabsTrigger value="marketplace" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Marketplace</TabsTrigger>
                    <TabsTrigger value="platform" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Platform</TabsTrigger>
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
                      <span className="font-bold ml-4">{totalPaymentAccepted.toLocaleString()}</span>
                  </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
              <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                          data={chartData}
                          margin={{ top: 20, right: 20, left: -10, bottom: 80 }}
                      >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis 
                              dataKey="name" 
                              tickLine={false} 
                              axisLine={false} 
                              tick={{ fontSize: 12 }} 
                              angle={-45}
                              textAnchor="end"
                              interval={0}
                              height={100}
                          />
                          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} allowDecimals={false}/>
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-1 gap-2">
                                      <div className="flex flex-col">
                                        <span className="text-[0.8rem] font-bold">
                                          {label}
                                        </span>
                                      </div>
                                      <div className="flex flex-col">
                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                          Payment Accepted
                                        </span>
                                        <span className="font-bold text-foreground">
                                          {payload[0].value?.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar dataKey="Payment Accepted" radius={[4, 4, 0, 0]}>
                              {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                              <LabelList dataKey="Payment Accepted" position="top" className="fill-foreground" fontSize={12} formatter={(value: number) => value.toLocaleString()} />
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
