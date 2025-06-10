
'use client';

import { AddCredentialForm } from '@/components/vault/credentials/AddCredentialForm';
import { CredentialList } from '@/components/vault/credentials/CredentialList';
import { Separator } from '@/components/ui/separator';

export default function CredentialsPage() {
  return (
    <div className="space-y-8 animate-slide-in">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary mb-2">Credentials</h1>
        <p className="text-muted-foreground">
          Securely store and manage your passwords, API keys, and other sensitive textual information.
        </p>
      </div>
      <AddCredentialForm />
      <Separator />
      <CredentialList />
    </div>
  );
}
