
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
        <div style={{
            width: '100mm',
            height: '150mm',
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            padding: '4mm',
            boxSizing: 'border-box',
        }}>
            <div style={{ textAlign: 'left', fontSize: '14px', borderBottom: '1.5px solid black', paddingBottom: '5px' }}>
                <p style={{ margin: 0 }}>{order.from}</p>
                <p style={{ margin: '2px 0', fontWeight: 'bold' }}>by sociolla</p>
                <p style={{ margin: '5px 0 0 0' }}>Order At</p>
                <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{format(new Date(), 'yyyy-MM-dd HH:mm')}</p>
            </div>
            
            <div style={{ textAlign: 'left', fontSize: '14px', marginTop: '5px' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>PICKING LIST</p>
                <p style={{ margin: '2px 0', fontWeight: 'bold' }}>FLOOR {order.location?.split('-')[0].toUpperCase() || 'N/A'}</p>
            </div>

            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                <QRCode value={order.order_reference} size={128} level="M" />
                <Barcode 
                    value={order.order_reference} 
                    format="CODE128"
                    width={2}
                    height={50}
                    displayValue={false}
                    margin={10}
                />
                <p style={{ margin: '5px 0 0 0', fontWeight: 'bold', fontSize: '16px' }}># {order.order_reference}</p>
            </div>
            
            <div style={{ borderTop: '1.5px dashed black', height: '1px' }}></div>
        </div>
    );
};

    