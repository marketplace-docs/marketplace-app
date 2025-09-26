
'use client';

import React from 'react';
import QRCode from 'qrcode.react';

type OrderInfo = {
    from: string;
    order_reference: string;
}

export const PickLabel: React.FC<{ order: OrderInfo }> = ({ order }) => {
    return (
        <div 
            className="w-[80mm] h-[50mm] bg-white border-2 border-black flex flex-col font-sans text-black"
            style={{ boxSizing: 'border-box' }}
        >
            <div className="text-center border-b-2 border-black p-1">
                <p className="font-bold text-blue-700 text-sm">Market Place</p>
                <p className="font-bold text-xs">{order.from}</p>
            </div>
            <div className="flex-grow flex items-center justify-center p-1">
                <QRCode value={order.order_reference} size={100} level="M" />
            </div>
            <div className="text-center border-t-2 border-black p-1">
                <p className="font-mono font-bold text-sm tracking-widest">{order.order_reference}</p>
            </div>
        </div>
    );
};
