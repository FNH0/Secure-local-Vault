'use client';

import { useVault } from '@/providers/VaultProvider';
import { FileItem } from './FileItem';
import { EmptyVault } from './EmptyVault';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';

export function FileList() {
  const { files, isLoading } = useVault();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return files;
    return files.filter(file => 
      file.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [files, searchTerm]);

  if (isLoading && files.length === 0) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-md" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-48 rounded" />
                <Skeleton className="h-3 w-32 rounded" />
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

  if (files.length === 0 && !isLoading) {
    return <EmptyVault />;
  }
  
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          type="search"
          placeholder="Search files..."
          className="pl-10 w-full md:w-1/2 lg:w-1/3 bg-input border-primary/50 focus:ring-primary focus:border-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {filteredFiles.length === 0 && searchTerm && (
        <p className="text-center text-muted-foreground py-8">No files found matching "{searchTerm}".</p>
      )}
      {filteredFiles.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {filteredFiles.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((file) => (
            <FileItem key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}
