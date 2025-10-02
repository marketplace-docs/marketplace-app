
'use client';

import React from 'react';
import QRCode from 'qrcode.react';
import Barcode from 'react-barcode';
import { format } from 'date-fns';

type OrderInfo = {
    from: string;
    order_reference: string;
    location: string;
    sku: string;
    name: string;
    barcode: string;
    exp_date: string;
    qty: number;
    customer_address: string;
    customer_name: string;
};

export const PickLabel: React.FC<{ order: OrderInfo }> = ({ order }) => {
    return (
        <div style={{
            width: '210mm', // A4 width
            height: '297mm', // A4 height
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10mm',
            boxSizing: 'border-box',
            textAlign: 'center',
        }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 10px 0' }}>
                PICKING LIST
            </h1>
            <p style={{ fontSize: '14pt', margin: '0 0 20px 0', fontWeight: 'bold' }}>
                FLOOR F01
            </p>
            
            <div style={{ marginBottom: '20px' }}>
                <QRCode value={order.order_reference} size={160} level="M" />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <Barcode 
                    value={order.order_reference} 
                    format="CODE128"
                    width={2}
                    height={60}
                    displayValue={false}
                    margin={0}
                />
                 <p style={{ fontSize: '16pt', fontWeight: 'bold', margin: '5px 0 0 0', letterSpacing: '2px' }}>
                    #{order.order_reference}
                </p>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '20px', width: '100%', borderTop: '2px dashed #ccc' }}>
                <p style={{ margin: 0 }}>PT Sociolla Ritel Indonesia</p>
                <p style={{ margin: 0 }}>E-mail: cs@sociolla.com</p>
                <p style={{ margin: 0 }}>Web: www.sociolla.com</p>
            </div>
        </div>
    );
};
