'use client';

import type React from 'react';
import { useState, useRef } from 'react';
import { useVault } from '@/providers/VaultProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FileUpload() {
  const { uploadFile, isLoading: isVaultLoading } = useVault();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" });
      return;
    }
    setIsUploading(true);
    await uploadFile(selectedFile);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input
    }
    setIsUploading(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const totalLoading = isVaultLoading || isUploading;

  return (
    <div className="mb-6 p-6 border border-dashed border-primary/50 rounded-lg bg-card shadow-md">
      <div className="flex flex-col items-center space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <Button 
          onClick={triggerFileInput} 
          variant="outline"
          className="w-full md:w-auto border-primary text-primary hover:bg-primary/10"
          disabled={totalLoading}
        >
          <UploadCloud className="mr-2 h-5 w-5" />
          {selectedFile ? `Selected: ${selectedFile.name.substring(0,20)}${selectedFile.name.length > 20 ? '...' : ''}` : 'Choose File'}
        </Button>
        <Input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden" 
          disabled={totalLoading}
        />
        {selectedFile && (
          <Button 
            onClick={handleUpload} 
            className="w-full md:w-auto"
            disabled={totalLoading || !selectedFile}
          >
            {totalLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <UploadCloud className="mr-2 h-5 w-5" />
            )}
            Upload File
          </Button>
        )}
      </div>
      {selectedFile && <p className="mt-3 text-sm text-muted-foreground text-center md:text-left">Ready to upload: {selectedFile.name}</p>}
      {!selectedFile && <p className="mt-3 text-sm text-muted-foreground text-center md:text-left">Click "Choose File" to select a file for secure storage.</p>}
    </div>
  );
}
