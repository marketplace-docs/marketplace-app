
'use client';

import React from 'react';
import QRCode from 'qrcode.react';
import Barcode from 'react-barcode';
import { format } from 'date-fns';
import type { InboundDocument } from '@/types/inbound-document';

type InboundPrintData = InboundDocument & {
    name: string;
};

export const InboundLabel: React.FC<{ document: InboundPrintData }> = ({ document: doc }) => {
    return (
        <div style={{
            width: '210mm',
            height: '297mm',
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
                    <p style={{ margin: 0, fontWeight: 'bold' }}>From Marketplace</p>
                    <p style={{ margin: 0, maxWidth: '250px' }}>Gudang Marketplace</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                     <Barcode 
                        value={doc.reference} 
                        format="CODE128"
                        width={1.5}
                        height={40}
                        displayValue={false}
                        margin={0}
                    />
                    <div style={{ marginTop: '5px' }}>
                      <QRCode value={doc.reference} size={80} level="M" />
                    </div>
                </div>
            </div>
            
            {/* Document Number and Details */}
            <div style={{ padding: '20px 0' }}>
                <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 20px 0' }}>{doc.reference}</h1>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ margin: 0, color: 'grey' }}>Type</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Receipt</p>
                    </div>
                     <div>
                        <p style={{ margin: 0, color: 'grey' }}>Date</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{format(new Date(doc.date), 'E, dd/MMM/yyyy HH:mm')}</p>
                    </div>
                     <div>
                        <p style={{ margin: 0, color: 'grey' }}>Source</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Gudang Marketplace</p>
                    </div>
                    <div>
                        <p style={{ margin: 0, color: 'grey' }}>Destination</p>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Gudang Marketplace</p>
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
                            <td style={{ padding: '8px' }}>{doc.sku}</td>
                            <td style={{ padding: '8px' }}>{doc.barcode}</td>
                            <td style={{ padding: '8px' }}>{doc.name}</td>
                            <td style={{ padding: '8px' }}>{format(new Date(doc.exp_date), 'dd/MM/yyyy')}</td>
                            <td style={{ padding: '8px' }}>{doc.qty}</td>
                            <td style={{ padding: '8px' }}>Staging Area Inbound</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            {/* Footer Signature Table */}
            <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt', border: '1px solid black' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid black' }}>
                            <th style={{ padding: '4px', textAlign: 'center', border: '1px solid black' }}>Received By</th>
                            <th style={{ padding: '4px', textAlign: 'center', border: '1px solid black' }}>Check By</th>
                            <th style={{ padding: '4px', textAlign: 'center', border: '1px solid black' }}>Security</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ height: '60px', border: '1px solid black', textAlign: 'center', verticalAlign: 'bottom', paddingBottom: '4px' }}>{doc.received_by}</td>
                            <td style={{ height: '60px', border: '1px solid black', textAlign: 'center', verticalAlign: 'bottom', paddingBottom: '4px' }}>Supervisor</td>
                            <td style={{ height: '60px', border: '1px solid black' }}></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
