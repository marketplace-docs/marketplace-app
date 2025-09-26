

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
        <div className="label-container">
            <div className="label-header">
                <p>{order.from}</p>
                <p className="sociolla">by sociolla</p>
                <p className="order-date-label">Order At</p>
                <p className="order-date">{format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
            </div>
            
            <div className="label-title">
                <p>PICKING LIST</p>
                <p>FLOOR {order.location?.split('-')[0].toUpperCase() || 'N/A'}</p>
            </div>

            <div className="label-qr-code">
                <QRCode value={order.order_reference} size={120} level="M" />
                <Barcode 
                    value={order.order_reference} 
                    format="CODE128"
                    width={1.5}
                    height={40}
                    displayValue={false}
                    margin={5}
                />
                <p className="ref-number"># {order.order_reference}</p>
            </div>
            
            <div className="label-footer"></div>
        </div>
    );
};
