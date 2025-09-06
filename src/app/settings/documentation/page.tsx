
'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";

export default function DocumentationPage() {
    return (
      <MainLayout>
        <div className="w-full space-y-8">
            <h1 className="text-3xl font-bold">Documentation</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Getting Started</CardTitle>
                    <CardDescription>Welcome to the documentation. Here you will find information on how to use the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p>This is the documentation page. Information on how to use the app will be available here.</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>How do I log in?</AccordionTrigger>
                            <AccordionContent>
                            You can log in using one of the provided email addresses and the password 'Marketplace@123!!!'. The allowed emails are for Arlan Saputra, Rudi Setiawan, Nova Aurelia, Nurul Tanzilla, and Regina Rifana.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-2">
                            <AccordionTrigger>How do I manage users?</AccordionTrigger>
                            <AccordionContent>
                            Navigate to the 'Database' section in the sidebar, and then select 'User'. From there you can view, edit, and delete users.
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="item-3">
                            <AccordionTrigger>Can I export data?</AccordionTrigger>
                            <AccordionContent>
                            Yes, on pages like 'Backlog' and 'Absensi Manpower', you will find an 'Export' button to download the data as a CSV file.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>
        </div>
      </MainLayout>
    )
}
