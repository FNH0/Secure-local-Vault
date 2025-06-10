'use client';

import { FileUpload } from '@/components/vault/FileUpload';
import { FileList } from '@/components/vault/FileList';

export default function VaultPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary mb-2">Secure Vault</h1>
        <p className="text-muted-foreground">Manage your encrypted files. All files are stored locally and encrypted in your browser.</p>
      </div>
      <FileUpload />
      <FileList />
    </div>
  );
}
