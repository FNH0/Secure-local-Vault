
'use client';

import { useState } from 'react';
import { useVault } from '@/providers/VaultProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const credentialTypes = ["Password", "API Key", "Secure Note", "License Key", "Database Credential", "SSH Key", "Generic Secret"];

export function AddCredentialForm() {
  const { addCredential, isLoadingCredentials } = useVault();
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type.trim() || !content.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    await addCredential(name, type, content);
    setName('');
    setType('');
    setContent('');
    // The VaultProvider's addCredential method will show a success/error toast.
  };

  return (
    <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-xl font-headline text-primary">Add New Credential</CardTitle>
        <CardDescription>Enter the details for the credential you want to store securely.</CardDescription>
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
