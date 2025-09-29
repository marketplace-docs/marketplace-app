
'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

type Step = 'putaway_code' | 'ean_code';

export default function AssignTaskPage() {
  const [putawayCode, setPutawayCode] = useState('');
  const [eanCode, setEanCode] = useState('');
  const [currentStep, setCurrentStep] = useState<Step>('putaway_code');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const putawayCodeRef = useRef<HTMLInputElement>(null);
  const eanCodeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentStep === 'putaway_code') {
      putawayCodeRef.current?.focus();
    } else if (currentStep === 'ean_code') {
      eanCodeRef.current?.focus();
    }
  }, [currentStep]);

  const handlePutawayCodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && putawayCode) {
      // Here you would typically validate the putaway code
      // For now, we'll just move to the next step
      setCurrentStep('ean_code');
      toast({ title: 'Putaway Code Scanned', description: `Code: ${putawayCode}` });
    }
  };

  const handleEanCodeSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && eanCode) {
      // Here you would process both codes
      setIsLoading(true);
      toast({ title: 'Processing...', description: `Putaway: ${putawayCode}, EAN: ${eanCode}` });
      setTimeout(() => {
        // Simulate API call
        console.log({ putawayCode, eanCode });
        // Reset for next task
        setPutawayCode('');
        setEanCode('');
        setCurrentStep('putaway_code');
        setIsLoading(false);
        toast({ title: 'Task Assigned', description: 'Ready for next scan.' });
      }, 1500);
    }
  };

  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">Assign Task</h1>
        <Card>
          <CardContent className="p-0">
            <div className="relative">
              <Label htmlFor="putaway-code" className="sr-only">
                Scan/Input putaway code
              </Label>
              <Input
                id="putaway-code"
                ref={putawayCodeRef}
                type="text"
                placeholder="Scan/Input putaway code"
                className="w-full h-20 text-lg px-4 border-x-0 border-t-0 rounded-t-lg rounded-b-none border-b-2 focus-visible:ring-0 focus-visible:ring-offset-0"
                value={putawayCode}
                onChange={(e) => setPutawayCode(e.target.value)}
                onKeyDown={handlePutawayCodeSubmit}
                disabled={currentStep !== 'putaway_code' || isLoading}
              />
              {isLoading && currentStep === 'putaway_code' && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />
              )}
            </div>
            <div>
              <Label htmlFor="ean-code" className="sr-only">
                Scan/Input ean code
              </Label>
              <Input
                id="ean-code"
                ref={eanCodeRef}
                type="text"
                placeholder="Scan/Input ean code"
                className="w-full h-20 text-lg px-4 border-0 rounded-b-lg rounded-t-none bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
                value={eanCode}
                onChange={(e) => setEanCode(e.target.value)}
                onKeyDown={handleEanCodeSubmit}
                disabled={currentStep !== 'ean_code' || isLoading}
              />
                {isLoading && currentStep === 'ean_code' && (
                <Loader2 className="absolute right-4 bottom-7 h-5 w-5 animate-spin" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
