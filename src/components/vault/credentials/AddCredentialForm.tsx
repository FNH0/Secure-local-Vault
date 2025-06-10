
'use client';

import { useState, useEffect } from 'react';
import { useVault } from '@/providers/VaultProvider';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const credentialTypes = ["Password", "API Key", "Secure Note", "License Key", "Database Credential", "SSH Key", "Generic Secret"];

const DRAFT_STORAGE_KEY_PREFIX = 'fnh_vault_add_credential_draft_';

interface CredentialFormDraft {
  name: string;
  type: string;
  // For non-password types
  genericContent?: string;
  // For password type
  username?: string;
  passwordValue?: string;
  url?: string;
  note?: string;
}

export function AddCredentialForm() {
  const { addCredential, isLoadingCredentials } = useVault();
  const { activeUserVaultId } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  
  // Fields for "Password" type
  const [username, setUsername] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field for other types
  const [genericContent, setGenericContent] = useState('');

  const getDraftKey = () => activeUserVaultId ? `${DRAFT_STORAGE_KEY_PREFIX}${activeUserVaultId}` : null;

  useEffect(() => {
    const draftKey = getDraftKey();
    if (draftKey) {
      try {
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
          const draft: CredentialFormDraft = JSON.parse(savedDraft);
          setName(draft.name || '');
          setType(draft.type || '');
          if (draft.type === "Password") {
            setUsername(draft.username || '');
            setPasswordValue(draft.passwordValue || '');
            setUrl(draft.url || '');
            setNote(draft.note || '');
            setGenericContent('');
          } else {
            setGenericContent(draft.genericContent || '');
            setUsername('');
            setPasswordValue('');
            setUrl('');
            setNote('');
          }
        }
      } catch (error) {
        console.error("Error loading credential draft:", error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserVaultId]);

  useEffect(() => {
    const draftKey = getDraftKey();
    if (draftKey) {
      const draft: CredentialFormDraft = { 
        name, 
        type, 
        genericContent: type !== "Password" ? genericContent : undefined,
        username: type === "Password" ? username : undefined,
        passwordValue: type === "Password" ? passwordValue : undefined,
        url: type === "Password" ? url : undefined,
        note: type === "Password" ? note : undefined,
      };
      if (name || type || genericContent || username || passwordValue || url || note) {
        try {
          localStorage.setItem(draftKey, JSON.stringify(draft));
        } catch (error) {
          console.error("Error saving credential draft:", error);
        }
      } else {
        localStorage.removeItem(draftKey);
      }
    }
  }, [name, type, genericContent, username, passwordValue, url, note, activeUserVaultId]);

  const clearFormAndDraft = () => {
    setName('');
    // setType(''); // Keep type or reset? User might want to add another of same type. Let's keep it.
    setGenericContent('');
    setUsername('');
    setPasswordValue('');
    setUrl('');
    setNote('');
    setShowPassword(false);
    const draftKey = getDraftKey();
    if (draftKey) {
      localStorage.removeItem(draftKey);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in Name and Type.", variant: "destructive" });
      return;
    }

    let contentToStore: string;
    if (type === "Password") {
      if (!passwordValue.trim()) { // Username can be optional for some "Password" like entries maybe? But password itself is key.
        toast({ title: "Missing Password", description: "Password field is required for 'Password' type.", variant: "destructive" });
        return;
      }
      contentToStore = JSON.stringify({
        username: username.trim(),
        password: passwordValue, // Keep password as is, don't trim leading/trailing spaces by default
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

    const success = await addCredential(name, type, contentToStore);
    if (success) {
      clearFormAndDraft();
    }
  };

  return (
    <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">Add New Credential</CardTitle>
        <CardDescription>Enter the details for the credential. Your progress is auto-saved as a draft.</CardDescription>
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

          {type === "Password" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="credential-username">Username</Label>
                <Input 
                  id="credential-username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  placeholder="e.g., user@example.com" 
                  className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credential-password">Password</Label>
                <div className="relative">
                  <Input 
                    id="credential-password" 
                    type={showPassword ? 'text' : 'password'}
                    value={passwordValue} 
                    onChange={(e) => setPasswordValue(e.target.value)} 
                    placeholder="Enter password" 
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
              <div className="space-y-2">
                <Label htmlFor="credential-url">Website URL (Optional)</Label>
                <Input 
                  id="credential-url" 
                  type="url"
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)} 
                  placeholder="e.g., https://example.com" 
                  className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="credential-note">Note (Optional)</Label>
                <Textarea
                  id="credential-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any additional notes"
                  rows={3}
                  className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                />
              </div>
            </>
          )}

          {type && type !== "Password" && (
            <div className="space-y-2">
              <Label htmlFor="credential-content">Sensitive Content</Label>
              <Textarea
                id="credential-content"
                value={genericContent}
                onChange={(e) => setGenericContent(e.target.value)}
                placeholder="Enter the API key, note, SSH key, etc. here. This content will be encrypted."
                rows={5}
                className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                required={type !== "Password"}
              />
              <p className="text-xs text-muted-foreground">This content will be end-to-end encrypted.</p>
            </div>
          )}

        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoadingCredentials || !type} className="w-full sm:w-auto">
            {isLoadingCredentials && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Credential
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
