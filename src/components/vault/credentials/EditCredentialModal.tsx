
'use client';

import { useState, useEffect } from 'react';
import { useVault, type CredentialMetadata } from '@/providers/VaultProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const credentialTypes = ["Password", "API Key", "Secure Note", "License Key", "Database Credential", "SSH Key", "Generic Secret"];

interface EditCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: CredentialMetadata & { content?: string | null }; // Content is optional initially or if error
  error?: string | null; // Error during content decryption
}

export function EditCredentialModal({ isOpen, onClose, credential, error: initialError }: EditCredentialModalProps) {
  const { updateCredential, isLoadingCredentials } = useVault();
  const { toast } = useToast();

  const [name, setName] = useState(credential.name);
  const [type, setType] = useState(credential.type);
  const [content, setContent] = useState(credential.content || '');
  const [error, setError] = useState<string | null>(initialError || null);

  useEffect(() => {
    setName(credential.name);
    setType(credential.type);
    setContent(credential.content || ''); // If content is null/undefined (e.g. decryption failed), default to empty
    setError(initialError || null);
  }, [credential, initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim() || !content.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    if (error && !content.trim()) { // If there was an initial error and user hasn't provided new content
        toast({ title: "Content Required", description: "Credential content is missing or could not be decrypted. Please provide it.", variant: "destructive"});
        return;
    }
    await updateCredential(credential.id, name, type, content);
    onClose(); // VaultProvider's updateCredential method will show toast
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Credential: {credential.name}</DialogTitle>
          <DialogDescription>Update the details for this credential.</DialogDescription>
        </DialogHeader>
        {error && !credential.content && ( // Show error prominently if content couldn't be loaded
            <div className="my-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">Error loading content:</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-sm mt-1">You can still edit the name and type, or provide new content below.</p>
                </div>
            </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-credential-name">Name / Label</Label>
            <Input 
              id="edit-credential-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Gmail Login, AWS API Key" 
              className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
              required 
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-credential-type">Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger id="edit-credential-type" className="bg-input border-primary/50 focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Select credential type" />
              </SelectTrigger>
              <SelectContent>
                {credentialTypes.map((typeName) => (
                  <SelectItem key={typeName} value={typeName}>{typeName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-credential-content">Sensitive Content</Label>
            <Textarea
              id="edit-credential-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={error && !credential.content ? "Enter new content here" : "Enter the password, API key, note, etc. here."}
              rows={5}
              className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
              required
            />
            <p className="text-xs text-muted-foreground">This content will be re-encrypted upon saving.</p>
          </div>
          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoadingCredentials}>
              {isLoadingCredentials && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
