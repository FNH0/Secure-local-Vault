'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { encryptData, decryptData, arrayBufferToBase64, base64ToArrayBuffer, uint8ArrayToBase64, base64ToUint8Array } from '@/lib/cryptoUtils';
import { LOCAL_STORAGE_FILES_METADATA_KEY, LOCAL_STORAGE_FILE_PREFIX } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  ivBase64: string; // Store IV as base64 string
  createdAt: string;
}

interface VaultContextType {
  files: FileMetadata[];
  uploadFile: (file: File) => Promise<void>;
  downloadFile: (fileId: string) => Promise<{ name: string; blob: Blob } | null>;
  deleteFile: (fileId: string) => Promise<void>;
  isLoading: boolean;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { derivedKey, isAuthenticated } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadFilesMetadata = useCallback(() => {
    if (!isAuthenticated) return;
    try {
      const metadataJson = localStorage.getItem(LOCAL_STORAGE_FILES_METADATA_KEY);
      if (metadataJson) {
        setFiles(JSON.parse(metadataJson));
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Error loading files metadata:", error);
      setFiles([]);
      toast({ title: "Error", description: "Could not load file list.", variant: "destructive"});
    }
  }, [isAuthenticated, toast]);

  useEffect(() => {
    loadFilesMetadata();
  }, [loadFilesMetadata]);

  const saveFilesMetadata = (updatedFiles: FileMetadata[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FILES_METADATA_KEY, JSON.stringify(updatedFiles));
      setFiles(updatedFiles);
    } catch (error) {
      console.error("Error saving files metadata:", error);
      toast({ title: "Error", description: "Could not save file list changes.", variant: "destructive"});
    }
  };

  const uploadFile = async (file: File) => {
    if (!derivedKey) {
      toast({ title: "Error", description: "Encryption key not available. Please log in again.", variant: "destructive"});
      return;
    }
    setIsLoading(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      const { encryptedData, iv } = await encryptData(fileBuffer, derivedKey);
      
      const fileId = crypto.randomUUID();
      const encryptedDataBase64 = arrayBufferToBase64(encryptedData);
      const ivBase64 = uint8ArrayToBase64(iv);

      localStorage.setItem(`${LOCAL_STORAGE_FILE_PREFIX}${fileId}`, encryptedDataBase64);
      
      const newFileMetadata: FileMetadata = {
        id: fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        ivBase64: ivBase64,
        createdAt: new Date().toISOString(),
      };
      saveFilesMetadata([...files, newFileMetadata]);
      toast({ title: "Success", description: `File "${file.name}" uploaded successfully.` });
    } catch (error) {
      console.error('File upload error:', error);
      toast({ title: "Error", description: `Failed to upload file "${file.name}".`, variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (fileId: string): Promise<{ name: string; blob: Blob } | null> => {
    if (!derivedKey) {
      toast({ title: "Error", description: "Decryption key not available. Please log in again.", variant: "destructive"});
      return null;
    }
    setIsLoading(true);
    try {
      const metadata = files.find(f => f.id === fileId);
      if (!metadata) {
        toast({ title: "Error", description: "File not found.", variant: "destructive"});
        return null;
      }

      const encryptedDataBase64 = localStorage.getItem(`${LOCAL_STORAGE_FILE_PREFIX}${fileId}`);
      if (!encryptedDataBase64) {
        toast({ title: "Error", description: "File data not found.", variant: "destructive"});
        return null;
      }

      const encryptedData = base64ToArrayBuffer(encryptedDataBase64);
      const iv = base64ToUint8Array(metadata.ivBase64);
      
      const decryptedData = await decryptData(encryptedData, derivedKey, iv);
      const blob = new Blob([decryptedData], { type: metadata.type });
      
      toast({ title: "Success", description: `File "${metadata.name}" ready for download.` });
      return { name: metadata.name, blob };
    } catch (error) {
      console.error('File download error:', error);
      toast({ title: "Error", description: "Failed to decrypt or download file.", variant: "destructive"});
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    setIsLoading(true);
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_FILE_PREFIX}${fileId}`);
      const updatedFiles = files.filter(f => f.id !== fileId);
      saveFilesMetadata(updatedFiles);
      const fileName = files.find(f => f.id === fileId)?.name || "File";
      toast({ title: "Success", description: `"${fileName}" deleted successfully.` });
    } catch (error) {
      console.error('File deletion error:', error);
      toast({ title: "Error", description: "Failed to delete file.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    files,
    uploadFile,
    downloadFile,
    deleteFile,
    isLoading,
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
