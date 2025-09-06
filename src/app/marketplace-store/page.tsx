'use client';

import {
  Card,
  CardContent,
  CardDescription,
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Store = {
  id: number;
  marketplace: string;
  storeName: string;
  nameStore: string;
};

const initialStores: Store[] = [
  { id: 1, marketplace: 'Shopee', storeName: 'Jung Saem Mool Official Store', nameStore: 'Shopee Jung Saem Mool' },
  { id: 2, marketplace: 'Shopee', storeName: 'Amuse Official Store', nameStore: 'Shopee Amuse' },
  { id: 3, marketplace: 'Shopee', storeName: 'Carasun.id Official Store', nameStore: 'Shopee Carasun' },
  { id: 4, marketplace: 'Shopee', storeName: 'Ariul Official Store', nameStore: 'Shopee Ariul' },
  { id: 5, marketplace: 'Shopee', storeName: 'Dr G Official Store', nameStore: 'Shopee Dr G' },
  { id: 6, marketplace: 'Shopee', storeName: 'Im From Official Store', nameStore: 'Shopee Im From' },
  { id: 7, marketplace: 'Shopee', storeName: 'COSRX Official Store', nameStore: 'Shopee COSRX' },
  { id: 8, marketplace: 'Shopee', storeName: 'Espoir Official Store', nameStore: 'Shopee Espoir' },
  { id: 9, marketplace: 'Shopee', storeName: 'Mediheal Official Store', nameStore: 'Shopee Mediheal' },
  { id: 10, marketplace: 'Shopee', storeName: 'Keana Official Store', nameStore: 'Shopee Keana' },
  { id: 11, marketplace: 'Shopee', storeName: 'Lilla Baby Indonesia', nameStore: 'Shopee Lilla Baby' },
  { id: 12, marketplace: 'Shopee', storeName: 'Lilla Official store', nameStore: 'Shopee lilla' },
  { id: 13, marketplace: 'Shopee', storeName: 'Edit by Sociolla', nameStore: 'Shopee' },
  { id: 14, marketplace: 'Shopee', storeName: 'Round Lab Official Store', nameStore: 'Shopee Round Lab' },
  { id: 15, marketplace: 'Shopee', storeName: 'Speak To Me Official Store', nameStore: 'Shopee Speak to me' },
  { id: 16, marketplace: 'Shopee', storeName: 'Sukin Official Store', nameStore: 'Shopee Sukin' },
  { id: 17, marketplace: 'Shopee', storeName: 'Woshday Official Store', nameStore: 'Shopee Woshday' },
  { id: 18, marketplace: 'Shopee', storeName: 'Gemistry Official Store', nameStore: 'Shopee Gemistry' },
  { id: 19, marketplace: 'Shopee', storeName: 'Sungboon Editor Official Store', nameStore: 'Shopee Sungboon Editor' },
  { id: 20, marketplace: 'Shopee', storeName: 'Derma Angel Official Store', nameStore: 'Shopee Derma Angel' },
  { id: 21, marketplace: 'Shopee', storeName: 'UIQ Official Store', nameStore: 'Shopee UIQ' },
  { id: 22, marketplace: 'Shopee', storeName: 'UB Mom Indonesia', nameStore: 'Shopee UB Mom' },
  { id: 23, marketplace: 'Shopee', storeName: 'Bioheal Official Store', nameStore: 'Shopee Bioheal' },
  { id: 24, marketplace: 'Lazada', storeName: 'COSRX Official Store', nameStore: 'Lazada Cosrx' },
  { id: 25, marketplace: 'Tiktok', storeName: 'Lilla Official store', nameStore: 'Tiktok_lilla' },
  { id: 26, marketplace: 'Tiktok', storeName: 'COSRX Official Store', nameStore: 'Tiktok_cosrx' },
  { id: 27, marketplace: 'Tiktok', storeName: 'Carasun.id Official Store', nameStore: 'Tiktok_carasun' },
  { id: 28, marketplace: 'Tiktok', storeName: 'Derma Angel Official Store', nameStore: 'Tiktok_derma_angel' },
  { id: 29, marketplace: 'Tiktok', storeName: 'Lilla Baby Indonesia', nameStore: 'Tiktok_lilla_Baby' },
  { id: 30, marketplace: 'Tiktok', storeName: 'Edit by Sociolla', nameStore: 'Tiktok' },
  { id: 31, marketplace: 'Tiktok', storeName: 'Round Lab Official Store', nameStore: 'Tiktok_roundlab' },
];

export default function MarketplaceStorePage() {
  const [stores] = useState<Store[]>(initialStores);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const totalPages = Math.ceil(stores.length / rowsPerPage);
  const paginatedStores = stores.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev));
  };

  return (
    <div className="w-full max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Marketplace Store</h1>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Toko</CardTitle>
          <CardDescription>
            Berikut adalah daftar toko yang terdaftar di berbagai marketplace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>Name Store</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>{store.id}</TableCell>
                  <TableCell>{store.marketplace}</TableCell>
                  <TableCell className="font-medium">{store.storeName}</TableCell>
                  <TableCell>{store.nameStore}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Page {stores.length > 0 ? currentPage : 0} of {totalPages}
        </div>
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
              {[10, 20, 30, 50].map((pageSize) => (
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
    </div>
  );
}
