
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
import { Loader2, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const credentialTypes = ["Password", "API Key", "Secure Note", "License Key", "Database Credential", "SSH Key", "Generic Secret"];

export interface PasswordCredentialContentStructure {
  username?: string;
  password?: string;
  url?: string;
  note?: string;
}
interface EditCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credential: CredentialMetadata & { content?: string | PasswordCredentialContentStructure | null };
  error?: string | null;
}

export function EditCredentialModal({ isOpen, onClose, credential, error: initialError }: EditCredentialModalProps) {
  const { updateCredential, isLoadingCredentials } = useVault();
  const { toast } = useToast();

  const [name, setName] = useState(credential.name);
  const [type, setType] = useState(credential.type);
  
  // Fields for "Password" type
  const [username, setUsername] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field for other types
  const [genericContent, setGenericContent] = useState('');
  
  const [error, setError] = useState<string | null>(initialError || null);

  useEffect(() => {
    setName(credential.name);
    setType(credential.type);
    setError(initialError || null);

    if (credential.type === "Password" && typeof credential.content === 'object' && credential.content !== null) {
      const structuredContent = credential.content as PasswordCredentialContentStructure;
      setUsername(structuredContent.username || '');
      setPasswordValue(structuredContent.password || '');
      setUrl(structuredContent.url || '');
      setNote(structuredContent.note || '');
      setGenericContent('');
    } else if (typeof credential.content === 'string') {
      setGenericContent(credential.content);
      setUsername('');
      setPasswordValue('');
      setUrl('');
      setNote('');
    } else { // Content might be null or undefined (e.g., decryption error before modal opens)
      setGenericContent('');
      setUsername('');
      setPasswordValue('');
      setUrl('');
      setNote('');
    }
  }, [credential, initialError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in Name and Type.", variant: "destructive" });
      return;
    }

    let contentToStore: string;
    if (type === "Password") {
      if (!passwordValue.trim()) {
        toast({ title: "Missing Password", description: "Password field is required for 'Password' type.", variant: "destructive" });
        return;
      }
      contentToStore = JSON.stringify({
        username: username.trim(),
        password: passwordValue,
        url: url.trim(),
        note: note.trim()
      });
    } else {
      if (!genericContent.trim()) {
        toast({ title: "Missing Content", description: "Content field is required for this credential type.", variant: "destructive" });
        return;
      }
      contentToStore = genericContent;
    }
    
    // Special handling if there was an initial error and content was missing
    if (error && ( (type === "Password" && !passwordValue.trim()) || (type !== "Password" && !genericContent.trim()) ) ) {
        toast({ title: "Content Required", description: "Credential content is missing or could not be decrypted. Please provide it.", variant: "destructive"});
        return;
    }

    await updateCredential(credential.id, name, type, contentToStore);
    onClose();
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
        {error && (credential.content === null || credential.content === undefined) && (
            <div className="my-4 p-3 bg-destructive/10 border border-destructive text-destructive rounded-md flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                    <p className="font-semibold">Error loading original content:</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-sm mt-1">You can still edit the name and type, or provide new content below. Saving will overwrite previous content.</p>
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

          {type === "Password" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="edit-username">Username</Label>
                <Input 
                  id="edit-username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-password">Password</Label>
                 <div className="relative">
                    <Input 
                        id="edit-password" 
                        type={showPassword ? 'text' : 'password'}
                        value={passwordValue} 
                        onChange={(e) => setPasswordValue(e.target.value)} 
                        className="bg-input border-primary/50 focus:ring-primary focus:border-primary pr-10"
                        required={type === "Password"}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-url">Website URL (Optional)</Label>
                <Input 
                  id="edit-url" 
                  type="url"
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-note">Note (Optional)</Label>
                <Textarea
                  id="edit-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                />
              </div>
            </>
          )}

          {type && type !== "Password" && (
            <div className="space-y-1.5">
              <Label htmlFor="edit-generic-content">Sensitive Content</Label>
              <Textarea
                id="edit-generic-content"
                value={genericContent}
                onChange={(e) => setGenericContent(e.target.value)}
                rows={5}
                className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                required={type !== "Password"}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">Content will be re-encrypted upon saving.</p>

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
