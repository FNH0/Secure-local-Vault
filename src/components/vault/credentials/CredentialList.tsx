
'use client';

import { useVault } from '@/providers/VaultProvider';
import { CredentialItem } from './CredentialItem';
import { Skeleton } from '@/components/ui/skeleton';
import { LockKeyhole } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';


export function CredentialList() {
  const { credentials, isLoadingCredentials } = useVault();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCredentials = useMemo(() => {
    if (!searchTerm) return credentials;
    return credentials.filter(cred => 
      cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [credentials, searchTerm]);
  
  if (isLoadingCredentials && credentials.length === 0) {
    return (
      <div className="space-y-3">
        <h2 className="text-2xl font-headline font-semibold text-primary mb-3">Stored Credentials</h2>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (credentials.length === 0 && !isLoadingCredentials) {
    return (
      <div className="text-center py-10 border-2 border-dashed border-primary/30 rounded-lg bg-card mt-6">
        <LockKeyhole className="mx-auto h-16 w-16 text-primary mb-4 animate-subtle-pulse" />
        <h2 className="text-xl font-semibold text-foreground mb-2">No Credentials Stored Yet</h2>
        <p className="text-muted-foreground">Use the form above to add your first secure credential.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-headline font-semibold text-primary mb-4">Stored Credentials</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            type="search"
            placeholder="Search credentials by name or type..."
            className="pl-10 w-full md:w-1/2 lg:w-1/3 bg-input border-primary/50 focus:ring-primary focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {filteredCredentials.length === 0 && searchTerm && (
        <p className="text-center text-muted-foreground py-8">No credentials found matching "{searchTerm}".</p>
      )}
      {filteredCredentials.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {filteredCredentials.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((cred) => (
            <CredentialItem key={cred.id} credential={cred} />
          ))}
        </div>
      )}
    </div>
  );
}
