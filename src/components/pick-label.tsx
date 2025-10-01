
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
            padding: '10mm',
            boxSizing: 'border-box',
            fontSize: '12pt',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid black', paddingBottom: '10px' }}>
                <div>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>Customer Address</p>
                    <p style={{ margin: 0 }}>{order.customer_name}</p>
                    <p style={{ margin: 0, maxWidth: '250px' }}>{order.customer_address}</p>
                    <p style={{ margin: '10px 0 0 0', fontWeight: 'bold' }}>From Marketplace</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                     <Barcode 
                        value={order.order_reference} 
                        format="CODE128"
                        width={1.5}
                        height={40}
                        displayValue={false}
                        margin={0}
                    />
                    <QRCode value={order.order_reference} size={80} level="M" />
                </div>
            </div>
            
            {/* Document Number and Details */}
            <div style={{ padding: '20px 0' }}>
                <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 20px 0' }}>{order.order_reference}</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ margin: 0, color: 'grey' }}>Type</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Receipt</p>
                    </div>
                     <div>
                        <p style={{ margin: 0, color: 'grey' }}>Date</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{format(new Date(), 'E, dd/MMM/yyyy HH:mm')}</p>
                    </div>
                     <div>
                        <p style={{ margin: 0, color: 'grey' }}>Source</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Gudang Marketplace</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'grey' }}>Destination</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{order.customer_name}</p>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div style={{ borderTop: '2px solid black', flexGrow: 1 }}>
                 <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid black' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>SKU</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Barcode</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Exp Date</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Qty</th>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '8px' }}>{order.sku}</td>
                            <td style={{ padding: '8px' }}>{order.barcode}</td>
                            <td style={{ padding: '8px' }}>{order.name}</td>
                            <td style={{ padding: '8px' }}>{format(new Date(order.exp_date), 'dd/MM/yyyy')}</td>
                            <td style={{ padding: '8px' }}>{order.qty}</td>
                            <td style={{ padding: '8px' }}>{order.location}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            {/* Footer Signature Table */}
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', border: '1px solid black' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid black' }}>
                            <th style={{ padding: '4px', textAlign: 'center', border: '1px solid black' }}>Picked By</th>
                            <th style={{ padding: '4px', textAlign: 'center', border: '1px solid black' }}>Check By</th>
                            <th style={{ padding: '4px', textAlign: 'center', border: '1px solid black' }}>Carrier Check</th>
                            <th style={{ padding: '4px', textAlign: 'center', border: '1px solid black' }}>Total Qty</th>
                            <th style={{ padding: '4px', textAlign: 'center', border: '1px solid black' }}>Weight</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ height: '60px', border: '1px solid black' }}></td>
                            <td style={{ height: '60px', border: '1px solid black', textAlign: 'center', verticalAlign: 'bottom', paddingBottom: '4px' }}>Supervisor</td>
                            <td style={{ height: '60px', border: '1px solid black', textAlign: 'center', verticalAlign: 'bottom', paddingBottom: '4px' }}>Driver</td>
                            <td style={{ height: '60px', border: '1px solid black', textAlign: 'center', verticalAlign: 'top', paddingTop: '4px' }}>Units</td>
                            <td style={{ height: '60px', border: '1px solid black' }}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

    