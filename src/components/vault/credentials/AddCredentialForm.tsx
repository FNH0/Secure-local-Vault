
'use client';

import { useState, useEffect } from 'react';
import { useVault } from '@/providers/VaultProvider';
import { useAuth } from '@/providers/AuthProvider'; // Import useAuth
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const credentialTypes = ["Password", "API Key", "Secure Note", "License Key", "Database Credential", "SSH Key", "Generic Secret"];

const DRAFT_STORAGE_KEY_PREFIX = 'fnh_vault_add_credential_draft_';

interface CredentialFormDraft {
  name: string;
  type: string;
  content: string;
}

export function AddCredentialForm() {
  const { addCredential, isLoadingCredentials } = useVault();
  const { activeUserVaultId } = useAuth(); // Get activeUserVaultId
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [content, setContent] = useState('');

  const getDraftKey = () => activeUserVaultId ? `${DRAFT_STORAGE_KEY_PREFIX}${activeUserVaultId}` : null;

  // Load draft from localStorage on component mount
  useEffect(() => {
    const draftKey = getDraftKey();
    if (draftKey) {
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draft: CredentialFormDraft = JSON.parse(savedDraft);
          setName(draft.name || '');
          setType(draft.type || '');
          setContent(draft.content || '');
        }
      } catch (error) {
        console.error("Error loading credential draft:", error);
        // Optionally, clear corrupted draft
        // localStorage.removeItem(draftKey);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserVaultId]); // Rerun if activeUserVaultId changes (e.g., on login)

  // Save draft to localStorage on input change
  useEffect(() => {
    const draftKey = getDraftKey();
    if (draftKey) {
      const draft: CredentialFormDraft = { name, type, content };
      if (name || type || content) { // Only save if there's something to save
        try {
          localStorage.setItem(draftKey, JSON.stringify(draft));
        } catch (error) {
          console.error("Error saving credential draft:", error);
          toast({ title: "Draft Not Saved", description: "Could not save your form draft due to a storage error.", variant: "destructive" });
        }
      } else {
        // If all fields are empty, remove any existing draft
        localStorage.removeItem(draftKey);
      }
    }
  }, [name, type, content, activeUserVaultId, toast]);

  const clearDraft = () => {
    const draftKey = getDraftKey();
    if (draftKey) {
      localStorage.removeItem(draftKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim() || !content.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    const success = await addCredential(name, type, content);
    if (success) { // Assuming addCredential now returns a boolean or similar to indicate success
      setName('');
      setType('');
      setContent('');
      clearDraft();
    }
    // The VaultProvider's addCredential method will show a success/error toast.
  };

  return (
    <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">Add New Credential</CardTitle>
        <CardDescription>Enter the details for the credential you want to store securely. Your progress is auto-saved as a draft.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="credential-name">Name / Label</Label>
            <Input 
              id="credential-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g., Gmail Login, AWS API Key" 
              className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credential-type">Type</Label>
            <Select value={type} onValueChange={setType} required>
              <SelectTrigger id="credential-type" className="bg-input border-primary/50 focus:ring-primary focus:border-primary">
                <SelectValue placeholder="Select credential type" />
              </SelectTrigger>
              <SelectContent>
                {credentialTypes.map((typeName) => (
                  <SelectItem key={typeName} value={typeName}>{typeName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="credential-content">Sensitive Content</Label>
            <Textarea
              id="credential-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the password, API key, note, etc. here. This content will be encrypted."
              rows={5}
              className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
              required
            />
            <p className="text-xs text-muted-foreground">This content will be end-to-end encrypted.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoadingCredentials} className="w-full sm:w-auto">
            {isLoadingCredentials && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Credential
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
