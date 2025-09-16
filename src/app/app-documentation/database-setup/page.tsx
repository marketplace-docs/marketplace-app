
'use client';

import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";
import React from "react";

const cycleCountTableSql = `
CREATE TABLE public.cycle_count_docs (
    id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    no_doc text NOT NULL,
    date timestamp with time zone NOT NULL DEFAULT now(),
    counter_name text NOT NULL,
    count_type text NOT NULL,
    items_to_count text NOT NULL,
    status text NOT NULL,
    notes text
);

ALTER TABLE public.cycle_count_docs OWNER TO postgres;

CREATE SEQUENCE public.cycle_count_docs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.cycle_count_docs_id_seq OWNER TO postgres;

ALTER SEQUENCE public.cycle_count_docs_id_seq OWNED BY public.cycle_count_docs.id;

ALTER TABLE ONLY public.cycle_count_docs ALTER COLUMN id SET DEFAULT nextval('public.cycle_count_docs_id_seq'::regclass);

ALTER TABLE ONLY public.cycle_count_docs
    ADD CONSTRAINT cycle_count_docs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.cycle_count_docs
    ADD CONSTRAINT cycle_count_docs_no_doc_key UNIQUE (no_doc);
`.trim();

const SqlCodeBlock = ({ sql }: { sql: string }) => {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(sql);
        setHasCopied(true);
        toast({ title: "Copied!", description: "SQL script has been copied to your clipboard." });
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <div className="relative">
            <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm border">
                <code>
                    {sql}
                </code>
            </pre>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={handleCopy}
            >
                {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    );
};


export default function DatabaseSetupPage() {
    return (
        <MainLayout>
             <div className="w-full space-y-6">
                <h1 className="text-2xl font-bold">Database Setup Scripts</h1>
                <Card>
                    <CardHeader>
                        <CardTitle>Panduan Setup Tabel</CardTitle>
                        <CardDescription>
                            Salin dan jalankan skrip SQL di bawah ini di Supabase SQL Editor Anda untuk membuat tabel yang diperlukan.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tabel: `cycle_count_docs`</CardTitle>
                        <CardDescription>
                            Tabel ini digunakan untuk menyimpan semua dokumen dan tugas terkait Cycle Count (Stock Opname).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <SqlCodeBlock sql={cycleCountTableSql} />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
