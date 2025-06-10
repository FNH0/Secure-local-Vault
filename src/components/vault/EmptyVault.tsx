import { FolderOpen } from 'lucide-react';

export function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 border-2 border-dashed border-primary/30 rounded-lg bg-card">
      <FolderOpen className="h-20 w-20 text-primary mb-6 animate-subtle-pulse" />
      <h2 className="text-2xl font-headline font-semibold mb-2 text-foreground">Your Vault is Empty</h2>
      <p className="text-muted-foreground max-w-md">
        It looks like you haven't uploaded any files yet. Start by uploading your first file to keep it secure.
      </p>
    </div>
  );
}
