
import React from 'react';
import type { Order } from '@/types/order';
import { Barcode } from 'lucide-react';
import Image from 'next/image';

type ShippingLabelProps = {
  order: Order;
};

export const ShippingLabel: React.FC<ShippingLabelProps> = ({ order }) => {
  return (
    <div className="w-[4in] h-[6in] bg-white p-4 border border-black text-black font-sans flex flex-col text-xs">
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-2">
        <div className="text-left">
          <p className="font-bold text-lg">Asal:</p>
          <p className="font-bold">GUDANG MARKETPLACE</p>
          <p>Tangerang</p>
        </div>
        <div className="w-24 h-12 relative">
            <Image src="/sicepat-logo.png" alt="SiCepat" layout="fill" objectFit="contain" />
        </div>
      </div>
      
      {/* Recipient */}
      <div className="border-b-2 border-black py-2">
        <p className="font-bold text-lg">Tujuan:</p>
        <p className="font-bold text-sm">{order.customer}</p>
        <p>{order.address}</p>
        <p>Kota {order.city}</p>
        <p>{order.phone}</p>
      </div>

      {/* Order Details */}
      <div className="flex-grow flex flex-col justify-between py-2">
         <div>
            <div className="flex justify-between text-center">
                <div className="flex-1">
                    <p className="font-bold">Tipe Layanan</p>
                    <p className="border border-black py-1">{order.delivery_type.toUpperCase()}</p>
                </div>
                <div className="flex-1 border-l-0 border border-black">
                     <p className="font-bold">Berat</p>
                    <p className="py-1">1 kg</p>
                </div>
                 <div className="flex-1 border-l-0 border border-black">
                     <p className="font-bold">Total Koli</p>
                    <p className="py-1">1 / 1</p>
                </div>
            </div>
             <p className="text-center text-sm my-2">Order No: <span className="font-bold">{order.reference}</span></p>
             <p className="font-bold">Isi Paket:</p>
             <p>{order.sku} (QTY: {order.qty})</p>
         </div>

         {/* Barcode */}
        <div className="text-center mt-auto">
           <Barcode className="h-16 w-full" />
            <p className="font-mono tracking-widest text-lg">{order.reference}</p>
        </div>
      </div>
       <div className="text-center border-t-2 border-black pt-1">
            <p className="font-bold text-sm">TERIMA KASIH TELAH BERBELANJA</p>
        </div>
    </div>
  );
};
