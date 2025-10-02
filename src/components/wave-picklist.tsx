
'use client';

import React from 'react';
import QRCode from 'qrcode.react';
import Barcode from 'react-barcode';
import { format } from 'date-fns';
import type { Wave } from '@/types/wave';

export const WavePickList: React.FC<{ wave: Wave }> = ({ wave }) => {
    return (
        <div style={{
            width: '148mm',
            height: '105mm',
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10mm',
            boxSizing: 'border-box',
            textAlign: 'center',
        }}>
            <h1 style={{ fontSize: '18pt', fontWeight: 'bold', margin: '0 0 5px 0' }}>
                BULK PICKING
            </h1>
            <p style={{ fontSize: '12pt', margin: '0 0 15px 0' }}>
                {format(new Date(), 'yyyy-MM-dd HH:mm')}
            </p>
            
            <div style={{ marginBottom: '15px' }}>
                <QRCode value={wave.wave_document_number} size={128} level="M" />
            </div>

            <div style={{ marginBottom: '15px' }}>
                <Barcode 
                    value={wave.wave_document_number} 
                    format="CODE128"
                    width={2}
                    height={60}
                    displayValue={false}
                    margin={0}
                />
                 <p style={{ fontSize: '14pt', fontWeight: 'bold', margin: '5px 0 0 0', letterSpacing: '2px' }}>
                    {wave.wave_document_number}
                </p>
            </div>
            
            <div style={{ marginTop: 'auto', borderTop: '2px dashed #ccc', paddingTop: '10px', width: '100%' }}>
                <p style={{ fontSize: '9pt', margin: 0, fontWeight: 'bold' }}>PT Sociolla Ritel Indonesia</p>
                <p style={{ fontSize: '9pt', margin: 0 }}>E-mail: cs@sociolla.com</p>
                <p style={{ fontSize: '9pt', margin: 0 }}>Web: www.sociolla.com</p>
            </div>
        </div>
    );
};
