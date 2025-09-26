

'use client';

import React from 'react';
import QRCode from 'qrcode.react';
import Barcode from 'react-barcode';
import { format } from 'date-fns';

type OrderInfo = {
    from: string;
    order_reference: string;
    location: string;
}

export const PickLabel: React.FC<{ order: OrderInfo }> = ({ order }) => {
    return (
        <div 
            className="w-[80mm] h-[100mm] bg-white p-2 flex flex-col justify-between font-sans text-black"
            style={{ boxSizing: 'border-box' }}
        >
            <div className="text-center">
                <p className="font-bold text-lg leading-tight">{order.from}</p>
                <p className="text-xs">by sociolla</p>
                <p className="text-xs mt-2 font-semibold">Order At</p>
                <p className="text-xs">{format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
            </div>
            
            <div className="text-center my-1">
                <p className="font-bold text-sm">PICKING LIST</p>
                <p className="font-bold text-sm">FLOOR {order.location?.split('-')[0].toUpperCase() || 'N/A'}</p>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center p-1">
                <QRCode value={order.order_reference} size={120} level="M" />
                <Barcode 
                    value={order.order_reference} 
                    format="CODE128"
                    width={1.5}
                    height={40}
                    displayValue={false}
                    margin={5}
                />
                <p className="font-mono font-bold text-lg tracking-widest mt-1"># {order.order_reference}</p>
            </div>
            
            <div className="border-b-2 border-dashed border-black w-full"></div>
        </div>
    );
};
