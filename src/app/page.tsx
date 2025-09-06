'use client';

import { useState, useEffect } from 'react';
import { Loader2, Store } from 'lucide-react';

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500); // Simulate loading for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center">
            <Store className="w-24 h-24 text-primary mb-4 animate-spin" />
            <span className="text-2xl font-bold text-primary">Marketplace</span>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold">Selamat Datang di Market Place</h1>
      <p className="text-muted-foreground">Pilih fitur dari sidebar untuk memulai.</p>
    </div>
  );
}
