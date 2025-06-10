
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
import { Input } from '@/components/ui/input'; // For displaying password
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, Copy, Check, Eye, EyeOff, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { PasswordCredentialContentStructure } from '@/providers/VaultProvider';

interface ViewCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentialName: string;
  credentialType: string;
  decryptedContent: string | PasswordCredentialContentStructure | null; // Can be string or structured
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
  const [copiedField, setCopiedField] = useState<string | null>(null); // To track which field was copied
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // Reset showPassword when modal reopens or content changes
  useEffect(() => {
    if (isOpen) {
      setShowPassword(false);
      setCopiedField(null);
    }
  }, [isOpen, decryptedContent]);


  const handleCopy = (textToCopy: string | undefined, fieldName: string) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedField(fieldName);
        toast({ title: "Copied!", description: `${fieldName} copied to clipboard.`});
        setTimeout(() => setCopiedField(null), 2000);
      }).catch(err => {
        console.error("Failed to copy:", err);
        toast({ title: "Copy Failed", description: `Could not copy ${fieldName}.`, variant: "destructive" });
      });
    }
  };

  const renderPasswordTypeContent = (content: PasswordCredentialContentStructure) => {
    return (
      <div className="space-y-4">
        {content.url && (
          <div className="space-y-1">
            <Label htmlFor="view-url">Website URL</Label>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-primary flex-shrink-0" />
              <a 
                href={content.url.startsWith('http') ? content.url : `https://${content.url}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate"
                title={content.url}
              >
                {content.url}
              </a>
            </div>
          </div>
        )}
        {content.username && (
          <div className="space-y-1">
            <Label htmlFor="view-username">Username</Label>
            <div className="relative">
              <Input 
                id="view-username" 
                value={content.username} 
                readOnly 
                className="bg-muted/50 border-border pr-10" 
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                onClick={() => handleCopy(content.username, 'Username')}
                title="Copy Username"
              >
                {copiedField === 'Username' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
        {content.password && (
          <div className="space-y-1">
            <Label htmlFor="view-password">Password</Label>
            <div className="relative">
              <Input 
                id="view-password" 
                type={showPassword ? 'text' : 'password'} 
                value={content.password} 
                readOnly 
                className="bg-muted/50 border-border pr-20" // More padding for two icons
              />
              <div className="absolute right-0 top-0 h-full flex items-center">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => handleCopy(content.password, 'Password')}
                  title="Copy Password"
                >
                  {copiedField === 'Password' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}
        {content.note && (
          <div className="space-y-1">
            <Label htmlFor="view-note">Note</Label>
            <Textarea
              id="view-note"
              value={content.note}
              readOnly
              rows={3}
              className="w-full bg-muted/50 border-border font-sans text-sm"
              aria-label="Credential note"
            />
          </div>
        )}
      </div>
    );
  };

  const renderGenericContent = (content: string) => {
     return (
      <div className="space-y-3">
        <Textarea
          value={content}
          readOnly
          rows={8}
          className="w-full bg-muted/50 border-border font-mono text-sm"
          aria-label="Decrypted credential content"
        />
        <Button onClick={() => handleCopy(content, 'Content')} variant="outline" size="sm" className="w-full">
          {copiedField === 'Content' ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
          {copiedField === 'Content' ? 'Copied!' : 'Copy to Clipboard'}
        </Button>
      </div>
    );
  }

  const renderModalBody = () => {
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

    if (credentialType === "Password" && typeof decryptedContent === 'object') {
      return renderPasswordTypeContent(decryptedContent as PasswordCredentialContentStructure);
    } else if (typeof decryptedContent === 'string') {
      // Handles generic types and fallback for Password type if content is string (e.g. old data)
      return renderGenericContent(decryptedContent);
    }
    
    // Should not happen if decryptedContent is not null and not error
    return <p>Unexpected content format.</p>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle className="truncate">View Credential: {credentialName}</DialogTitle>
          <DialogDescription>Type: {credentialType}</DialogDescription>
        </DialogHeader>
        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
          {renderModalBody()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
