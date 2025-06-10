
'use client';

import { FileUpload } from '@/components/vault/FileUpload';
import { FileList } from '@/components/vault/FileList';
import { ImportCredentials } from '@/components/settings/ImportCredentials'; // Added
import { Separator } from '@/components/ui/separator'; // Added

export default function VaultPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary mb-2">Secure Vault</h1>
        <p className="text-muted-foreground">Manage your encrypted files. All files are stored locally and encrypted in your browser.</p>
      </div>
      <ImportCredentials /> {/* Added component */}
      <Separator className="my-8" /> {/* Added separator */}
      <FileUpload />
      <FileList />
    </div>
  );
}
