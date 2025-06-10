
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck, ListChecks, Loader2, RefreshCw, Copy, ShieldAlertIcon } from 'lucide-react'; // Changed ShieldAlert to ShieldAlertIcon
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
    if (typeof bip39.generateMnemonic !== 'function') {
        toast({ title: "Error", description: "Recovery library not loaded. Please try again.", variant: "destructive"});
        setIsGenerating(false);
        return;
    }
    try {
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
              Generate a recovery phrase. If you forget your master password, this phrase will allow you to reset it.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant="destructive">
          <ShieldAlertIcon className="h-4 w-4" /> {/* Changed from ShieldAlert to ShieldAlertIcon */}
          <AlertTitle>Critical: Store Securely!</AlertTitle>
          <AlertDescription>
            If you lose your master password AND this recovery phrase, your encrypted data will be permanently unrecoverable.
            Store this phrase in a safe, offline location. Do NOT store it digitally in an unsecured manner.
          </AlertDescription>
        </Alert>

        {!showPhrase && !recoveryPhrase && ( // Only show generate button if no phrase is actively shown or set
          <Button onClick={handleGeneratePhrase} disabled={isGenerating} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <RefreshCw className="mr-2 h-4 w-4" />
            Generate New Recovery Phrase
          </Button>
        )}
        
        {recoveryPhrase && !showPhrase && ( // If phrase exists but is hidden (after confirmation)
             <div className="space-y-3">
                <p className="text-sm text-green-500">A recovery phrase has been generated. You confirmed you saved it.</p>
                <Button onClick={() => { setShowPhrase(true); setHasSavedPhrase(false); }} variant="outline" className="w-full sm:w-auto">
                    <ListChecks className="mr-2 h-4 w-4" />
                    View My Saved Phrase Again
                </Button>
                 <Button onClick={handleGeneratePhrase} variant="destructive" disabled={isGenerating} className="w-full sm:w-auto ml-0 sm:ml-2 mt-2 sm:mt-0">
                    {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate a New Phrase (Discards Old)
                </Button>
            </div>
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
            This phrase allows you to reset your master password if forgotten. Using the recovery phrase will create a new master password.
            Files encrypted with your old master password will require the old password to be decrypted.
        </p>
      </CardContent>
    </Card>
  );
}

// Note: ShieldAlertIcon from lucide-react should be used. If ShieldAlert was a custom SVG, this change assumes ShieldAlertIcon replaces it.
// If ShieldAlert was from lucide-react, it might have been renamed or you intended ShieldAlertIcon.
// I'm using ShieldAlertIcon as it's a common pattern in lucide for alert icons.
// The original code had a custom SVG definition for ShieldAlert, if this component is removed because ShieldAlertIcon exists,
// then no custom SVG is needed here.
