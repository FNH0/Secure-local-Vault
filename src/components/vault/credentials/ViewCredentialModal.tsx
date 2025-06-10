
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, AlertTriangle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ViewCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentialName: string;
  credentialType: string;
  decryptedContent: string | null;
  error: string | null;
}

export function ViewCredentialModal({ 
  isOpen, 
  onClose, 
  credentialName,
  credentialType, 
  decryptedContent, 
  error 
}: ViewCredentialModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    if (decryptedContent) {
      navigator.clipboard.writeText(decryptedContent).then(() => {
        setCopied(true);
        toast({ title: "Copied!", description: "Credential content copied to clipboard."});
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.error("Failed to copy:", err);
        toast({ title: "Copy Failed", description: "Could not copy content.", variant: "destructive" });
      });
    }
  };

  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-destructive">
          <AlertTriangle className="h-10 w-10 mb-3" />
          <p className="text-md font-semibold">Decryption Error</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    if (decryptedContent === null) { // Still loading
      return (
        <div className="flex flex-col items-center justify-center h-40">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
          <p>Decrypting credential...</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <Textarea
          value={decryptedContent}
          readOnly
          rows={8}
          className="w-full bg-muted/50 border-border font-mono text-sm"
          aria-label="Decrypted credential content"
        />
        <Button onClick={handleCopy} variant="outline" size="sm" className="w-full">
          {copied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="truncate">View Credential: {credentialName}</DialogTitle>
          <DialogDescription>Type: {credentialType}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {renderContent()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
