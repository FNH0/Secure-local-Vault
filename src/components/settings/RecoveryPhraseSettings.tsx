
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, ListChecks, Loader2, RefreshCw, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import * as bip39 from 'bip39';

export function RecoveryPhraseSettings() {
  const { toast } = useToast();
  const [recoveryPhrase, setRecoveryPhrase] = useState<string | null>(null);
  const [showPhrase, setShowPhrase] = useState(false);
  const [hasSavedPhrase, setHasSavedPhrase] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleGeneratePhrase = async () => {
    setIsGenerating(true);
    setHasSavedPhrase(false); // Reset confirmation if regenerating
    // Ensure bip39 is loaded (it should be, but good practice for client-side)
    if (typeof bip39.generateMnemonic !== 'function') {
        toast({ title: "Error", description: "Recovery library not loaded. Please try again.", variant: "destructive"});
        setIsGenerating(false);
        return;
    }
    try {
      // Generate a 12-word mnemonic
      const mnemonic = bip39.generateMnemonic();
      setRecoveryPhrase(mnemonic);
      setShowPhrase(true);
      toast({ title: "Recovery Phrase Generated", description: "Please write it down and store it securely." });
    } catch (error) {
      console.error("Error generating recovery phrase:", error);
      toast({ title: "Error", description: "Could not generate recovery phrase.", variant: "destructive"});
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSaved = () => {
    if (!hasSavedPhrase) {
        toast({ title: "Confirmation Required", description: "Please confirm you have saved the phrase.", variant: "destructive" });
        return;
    }
    setShowPhrase(false);
    // setRecoveryPhrase(null); // Optionally clear the phrase from state after confirmation
    toast({ title: "Confirmation Received", description: "Remember to keep your recovery phrase safe!" });
  };

  const handleCopyToClipboard = () => {
    if (recoveryPhrase) {
      navigator.clipboard.writeText(recoveryPhrase)
        .then(() => {
          toast({ title: "Copied!", description: "Recovery phrase copied to clipboard." });
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          toast({ title: "Copy Failed", description: "Could not copy phrase. Please select and copy manually.", variant: "destructive" });
        });
    }
  };
  
  if (!isClient) {
    return (
      <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-xl font-headline text-primary">Master Password Recovery</CardTitle>
              <CardDescription>Loading recovery phrase settings...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-xl font-headline text-primary">Master Password Recovery</CardTitle>
            <CardDescription>
              Generate a recovery phrase to regain access if you forget your master password.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Critical: Store Securely!</AlertTitle>
          <AlertDescription>
            If you lose your master password AND this recovery phrase, your encrypted data will be permanently unrecoverable.
            Store this phrase in a safe, offline location. Do NOT store it digitally in an unsecured manner.
          </AlertDescription>
        </Alert>

        {!showPhrase && (
          <Button onClick={handleGeneratePhrase} disabled={isGenerating} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate New Recovery Phrase
          </Button>
        )}

        {showPhrase && recoveryPhrase && (
          <div className="space-y-4 p-4 border border-dashed border-primary/50 rounded-md bg-background/30">
            <p className="text-sm text-muted-foreground">
              Write down the following 12 words in order. This is your unique recovery phrase.
            </p>
            <div className="p-3 bg-muted rounded-md text-center font-mono text-lg tracking-wider break-words">
              {recoveryPhrase.split(' ').map((word, index) => (
                <span key={index} className="inline-block mx-1 p-1">
                  <span className="text-xs text-primary/70">{index + 1}. </span>{word}
                </span>
              ))}
            </div>
             <Button onClick={handleCopyToClipboard} variant="outline" size="sm" className="w-full sm:w-auto">
              <Copy className="mr-2 h-4 w-4" />
              Copy to Clipboard
            </Button>
            <div className="items-top flex space-x-2 pt-4">
              <Checkbox id="terms1" checked={hasSavedPhrase} onCheckedChange={(checked) => setHasSavedPhrase(Boolean(checked))} />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="terms1"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I have written down and securely stored my recovery phrase.
                </Label>
                <p className="text-xs text-muted-foreground">
                  You understand that losing this phrase and your password means losing access to your data.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 pt-2">
                <Button onClick={handleConfirmSaved} disabled={!hasSavedPhrase} className="w-full sm:w-auto">
                  <ListChecks className="mr-2 h-4 w-4" />
                  Done, I've Saved It
                </Button>
                <Button onClick={handleGeneratePhrase} variant="outline" disabled={isGenerating} className="w-full sm:w-auto">
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate (Discards Current)
                </Button>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
            This phrase allows you to reset your master password if forgotten. The actual recovery process using this phrase on the login page will be implemented in a future update.
        </p>
      </CardContent>
    </Card>
  );
}

// Helper Icon for Alert (if not already globally available)
const ShieldAlert = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
  </svg>
);
