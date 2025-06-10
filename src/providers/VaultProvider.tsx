
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { encryptData, decryptData, arrayBufferToBase64, base64ToArrayBuffer, uint8ArrayToBase64, base64ToUint8Array } from '@/lib/cryptoUtils';
import { 
  getFilesMetadataKey, 
  getFileKeyPrefix, 
  getCredentialsMetadataKey, 
  getCredentialContentPrefix 
} from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

export interface FileMetadata {
  id: string;
  name: string;
  type: string;
  size: number;
  ivBase64: string; 
  createdAt: string;
}

export interface CredentialMetadata {
  id: string;
  name: string;
  type: string; 
  createdAt: string;
  ivBase64: string; 
}

export interface DecryptedCredential extends CredentialMetadata {
  content: string; 
}

interface VaultContextType {
  files: FileMetadata[];
  uploadFile: (file: File) => Promise<void>;
  downloadFile: (fileId: string) => Promise<{ name: string; blob: Blob } | null>;
  deleteFile: (fileId: string) => Promise<void>;
  isLoading: boolean; 

  credentials: CredentialMetadata[];
  addCredential: (name: string, type: string, content: string) => Promise<void>;
  getDecryptedCredentialContent: (credentialId: string) => Promise<string | null>;
  deleteCredential: (credentialId: string) => Promise<void>;
  isLoadingCredentials: boolean; 
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { derivedKey, isAuthenticated, activeUserVaultId } = useAuth();
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<CredentialMetadata[]>([]);
  const [isLoadingCredentials, setIsLoadingCredentials] = useState(false);
  const { toast } = useToast();

  const loadFilesMetadata = useCallback(() => {
    if (!isAuthenticated || !activeUserVaultId) {
      setFiles([]);
      return;
    }
    setIsLoading(true);
    try {
      const metadataJson = localStorage.getItem(getFilesMetadataKey(activeUserVaultId));
      if (metadataJson) {
        setFiles(JSON.parse(metadataJson));
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Error loading files metadata:", error);
      setFiles([]);
      toast({ title: "Error", description: "Could not load file list.", variant: "destructive"});
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, activeUserVaultId, toast]);

  const loadCredentialsMetadata = useCallback(() => {
    if (!isAuthenticated || !activeUserVaultId) {
      setCredentials([]);
      return;
    }
    setIsLoadingCredentials(true);
    try {
      const metadataJson = localStorage.getItem(getCredentialsMetadataKey(activeUserVaultId));
      if (metadataJson) {
        setCredentials(JSON.parse(metadataJson));
      } else {
        setCredentials([]);
      }
    } catch (error) {
      console.error("Error loading credentials metadata:", error);
      setCredentials([]);
      toast({ title: "Error", description: "Could not load credentials list.", variant: "destructive"});
    } finally {
      setIsLoadingCredentials(false);
    }
  }, [isAuthenticated, activeUserVaultId, toast]);

  useEffect(() => {
    if (isAuthenticated && activeUserVaultId) {
      loadFilesMetadata();
      loadCredentialsMetadata();
    } else {
      // Clear data if not authenticated or no vaultId
      setFiles([]);
      setCredentials([]);
    }
  }, [isAuthenticated, activeUserVaultId, loadFilesMetadata, loadCredentialsMetadata]);

  const saveFilesMetadata = (updatedFiles: FileMetadata[]) => {
    if (!activeUserVaultId) return;
    try {
      localStorage.setItem(getFilesMetadataKey(activeUserVaultId), JSON.stringify(updatedFiles));
      setFiles(updatedFiles);
    } catch (error) {
      console.error("Error saving files metadata:", error);
      toast({ title: "Error", description: "Could not save file list changes.", variant: "destructive"});
    }
  };

  const saveCredentialsMetadata = (updatedCredentials: CredentialMetadata[]) => {
    if (!activeUserVaultId) return;
    try {
      localStorage.setItem(getCredentialsMetadataKey(activeUserVaultId), JSON.stringify(updatedCredentials));
      setCredentials(updatedCredentials);
    } catch (error) {
      console.error("Error saving credentials metadata:", error);
      toast({ title: "Error", description: "Could not save credentials list changes.", variant: "destructive"});
    }
  };

  const uploadFile = async (file: File) => {
    if (!derivedKey || !activeUserVaultId) {
      toast({ title: "Error", description: "Encryption key or vault ID not available. Please log in again.", variant: "destructive"});
      return;
    }
    setIsLoading(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      const { encryptedData, iv } = await encryptData(fileBuffer, derivedKey);
      
      const fileId = crypto.randomUUID();
      const encryptedDataBase64 = arrayBufferToBase64(encryptedData);
      const ivBase64 = uint8ArrayToBase64(iv);

      localStorage.setItem(`${getFileKeyPrefix(activeUserVaultId)}${fileId}`, encryptedDataBase64);
      
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
    if (!derivedKey || !activeUserVaultId) {
      toast({ title: "Error", description: "Decryption key or vault ID not available. Please log in again.", variant: "destructive"});
      return null;
    }
    setIsLoading(true);
    try {
      const metadata = files.find(f => f.id === fileId);
      if (!metadata) {
        toast({ title: "Error", description: "File not found.", variant: "destructive"});
        return null;
      }

      const encryptedDataBase64 = localStorage.getItem(`${getFileKeyPrefix(activeUserVaultId)}${fileId}`);
      if (!encryptedDataBase64) {
        toast({ title: "Error", description: "File data not found.", variant: "destructive"});
        return null;
      }

      const encryptedData = base64ToArrayBuffer(encryptedDataBase64);
      const iv = base64ToUint8Array(metadata.ivBase64);
      
      const decryptedData = await decryptData(encryptedData, derivedKey, iv);
      const blob = new Blob([decryptedData], { type: metadata.type });
      
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
    if (!activeUserVaultId) return;
    setIsLoading(true);
    try {
      localStorage.removeItem(`${getFileKeyPrefix(activeUserVaultId)}${fileId}`);
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

  const addCredential = async (name: string, type: string, content: string) => {
    if (!derivedKey || !activeUserVaultId) {
      toast({ title: "Error", description: "Encryption key or vault ID not available.", variant: "destructive" });
      return;
    }
    setIsLoadingCredentials(true);
    try {
      const contentBuffer = new TextEncoder().encode(content);
      const { encryptedData, iv } = await encryptData(contentBuffer, derivedKey);

      const credentialId = crypto.randomUUID();
      const encryptedContentBase64 = arrayBufferToBase64(encryptedData);
      const ivBase64 = uint8ArrayToBase64(iv);

      localStorage.setItem(`${getCredentialContentPrefix(activeUserVaultId)}${credentialId}`, encryptedContentBase64);

      const newCredentialMetadata: CredentialMetadata = {
        id: credentialId,
        name,
        type,
        createdAt: new Date().toISOString(),
        ivBase64,
      };
      saveCredentialsMetadata([...credentials, newCredentialMetadata]);
      toast({ title: "Success", description: `Credential "${name}" added successfully.` });
    } catch (error) {
      console.error('Add credential error:', error);
      toast({ title: "Error", description: `Failed to add credential "${name}".`, variant: "destructive" });
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const getDecryptedCredentialContent = async (credentialId: string): Promise<string | null> => {
    if (!derivedKey || !activeUserVaultId) {
      toast({ title: "Error", description: "Decryption key or vault ID not available.", variant: "destructive" });
      return null;
    }
    setIsLoadingCredentials(true);
    try {
      const metadata = credentials.find(c => c.id === credentialId);
      if (!metadata) {
        toast({ title: "Error", description: "Credential metadata not found.", variant: "destructive" });
        return null;
      }

      const encryptedContentBase64 = localStorage.getItem(`${getCredentialContentPrefix(activeUserVaultId)}${credentialId}`);
      if (!encryptedContentBase64) {
        toast({ title: "Error", description: "Credential content not found.", variant: "destructive" });
        return null;
      }

      const encryptedContent = base64ToArrayBuffer(encryptedContentBase64);
      const iv = base64ToUint8Array(metadata.ivBase64);

      const decryptedBuffer = await decryptData(encryptedContent, derivedKey, iv);
      const decryptedContent = new TextDecoder().decode(decryptedBuffer);
      return decryptedContent;
    } catch (error) {
      console.error('Get decrypted credential error:', error);
      toast({ title: "Error", description: "Failed to decrypt credential.", variant: "destructive" });
      return null;
    } finally {
      setIsLoadingCredentials(false);
    }
  };
  
  const deleteCredential = async (credentialId: string) => {
    if (!activeUserVaultId) return;
    setIsLoadingCredentials(true);
    try {
      localStorage.removeItem(`${getCredentialContentPrefix(activeUserVaultId)}${credentialId}`);
      const updatedCredentials = credentials.filter(c => c.id !== credentialId);
      saveCredentialsMetadata(updatedCredentials);
      const credentialName = credentials.find(c => c.id === credentialId)?.name || "Credential";
      toast({ title: "Success", description: `"${credentialName}" deleted successfully.` });
    } catch (error) {
      console.error('Credential deletion error:', error);
      toast({ title: "Error", description: "Failed to delete credential.", variant: "destructive" });
    } finally {
      setIsLoadingCredentials(false);
    }
  };
  
  const value = {
    files,
    uploadFile,
    downloadFile,
    deleteFile,
    isLoading,
    credentials,
    addCredential,
    getDecryptedCredentialContent,
    deleteCredential,
    isLoadingCredentials,
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
