
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

export interface PasswordCredentialContentStructure {
  username?: string;
  password?: string;
  url?: string;
  note?: string;
}

export interface CredentialMetadata {
  id: string;
  name: string;
  type: string; 
  createdAt: string;
  ivBase64: string; 
}

export interface DecryptedCredential extends CredentialMetadata {
  content: string | PasswordCredentialContentStructure; // Content can be string or structured object
}

interface VaultContextType {
  files: FileMetadata[];
  uploadFile: (file: File) => Promise<boolean>;
  downloadFile: (fileId: string) => Promise<{ name: string; blob: Blob } | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  isLoading: boolean; 

  credentials: CredentialMetadata[];
  addCredential: (name: string, type: string, content: string) => Promise<boolean>; // content is string (can be JSON string)
  updateCredential: (credentialId: string, newName: string, newType: string, newContent: string) => Promise<boolean>; // newContent is string
  getDecryptedCredentialContent: (credentialId: string) => Promise<string | PasswordCredentialContentStructure | null>;
  deleteCredential: (credentialId: string) => Promise<boolean>;
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
      setFiles([]);
      setCredentials([]);
    }
  }, [isAuthenticated, activeUserVaultId, loadFilesMetadata, loadCredentialsMetadata]);

  const saveFilesMetadata = (updatedFiles: FileMetadata[]) => {
    if (!activeUserVaultId) return false;
    try {
      localStorage.setItem(getFilesMetadataKey(activeUserVaultId), JSON.stringify(updatedFiles));
      setFiles(updatedFiles);
      return true;
    } catch (error) {
      console.error("Error saving files metadata:", error);
      toast({ title: "Error", description: "Could not save file list changes.", variant: "destructive"});
      return false;
    }
  };

  const saveCredentialsMetadata = (updatedCredentials: CredentialMetadata[]) => {
    if (!activeUserVaultId) return false;
    try {
      localStorage.setItem(getCredentialsMetadataKey(activeUserVaultId), JSON.stringify(updatedCredentials));
      setCredentials(updatedCredentials);
      return true;
    } catch (error) {
      console.error("Error saving credentials metadata:", error);
      toast({ title: "Error", description: "Could not save credentials list changes.", variant: "destructive"});
      return false;
    }
  };

  const uploadFile = async (file: File): Promise<boolean> => {
    if (!derivedKey || !activeUserVaultId) {
      toast({ title: "Error", description: "Encryption key or vault ID not available. Please log in again.", variant: "destructive"});
      return false;
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
      const success = saveFilesMetadata([...files, newFileMetadata]);
      if (success) {
        toast({ title: "Success", description: `File "${file.name}" uploaded successfully.` });
      }
      return success;
    } catch (error) {
      console.error('File upload error:', error);
      toast({ title: "Error", description: `Failed to upload file "${file.name}".`, variant: "destructive"});
      return false;
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

  const deleteFile = async (fileId: string): Promise<boolean> => {
    if (!activeUserVaultId) return false;
    setIsLoading(true);
    try {
      localStorage.removeItem(`${getFileKeyPrefix(activeUserVaultId)}${fileId}`);
      const updatedFiles = files.filter(f => f.id !== fileId);
      const success = saveFilesMetadata(updatedFiles);
      if (success) {
        const fileName = files.find(f => f.id === fileId)?.name || "File";
        toast({ title: "Success", description: `"${fileName}" deleted successfully.` });
      }
      return success;
    } catch (error) {
      console.error('File deletion error:', error);
      toast({ title: "Error", description: "Failed to delete file.", variant: "destructive"});
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addCredential = async (name: string, type: string, content: string): Promise<boolean> => {
    if (!derivedKey || !activeUserVaultId) {
      toast({ title: "Error", description: "Encryption key or vault ID not available.", variant: "destructive" });
      return false;
    }
    setIsLoadingCredentials(true);
    try {
      // Content is already a string (could be plain or JSON stringified by the form)
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
      const success = saveCredentialsMetadata([...credentials, newCredentialMetadata]);
      if (success) {
        toast({ title: "Success", description: `Credential "${name}" added successfully.` });
      }
      return success;
    } catch (error) {
      console.error('Add credential error:', error);
      toast({ title: "Error", description: `Failed to add credential "${name}".`, variant: "destructive" });
      return false;
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const updateCredential = async (credentialId: string, newName: string, newType: string, newContent: string): Promise<boolean> => {
    if (!derivedKey || !activeUserVaultId) {
      toast({ title: "Error", description: "Encryption key or vault ID not available.", variant: "destructive" });
      return false;
    }
    setIsLoadingCredentials(true);
    try {
      const contentBuffer = new TextEncoder().encode(newContent); // newContent is already string (plain or JSON string)
      const { encryptedData, iv } = await encryptData(contentBuffer, derivedKey);

      const encryptedContentBase64 = arrayBufferToBase64(encryptedData);
      const newIvBase64 = uint8ArrayToBase64(iv);

      localStorage.setItem(`${getCredentialContentPrefix(activeUserVaultId)}${credentialId}`, encryptedContentBase64);

      const updatedCredentials = credentials.map(cred => {
        if (cred.id === credentialId) {
          return {
            ...cred,
            name: newName,
            type: newType,
            ivBase64: newIvBase64,
          };
        }
        return cred;
      });
      const success = saveCredentialsMetadata(updatedCredentials);
      if (success) {
        toast({ title: "Success", description: `Credential "${newName}" updated successfully.` });
      }
      return success;
    } catch (error) {
      console.error('Update credential error:', error);
      toast({ title: "Error", description: `Failed to update credential "${newName}".`, variant: "destructive" });
      return false;
    } finally {
      setIsLoadingCredentials(false);
    }
  };

  const getDecryptedCredentialContent = async (credentialId: string): Promise<string | PasswordCredentialContentStructure | null> => {
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
      const decryptedString = new TextDecoder().decode(decryptedBuffer);

      if (metadata.type === "Password") {
        try {
          const structuredContent = JSON.parse(decryptedString) as PasswordCredentialContentStructure;
          return structuredContent;
        } catch (parseError) {
          console.error("Failed to parse Password content as JSON, returning raw string:", parseError);
          // Fallback for old data or if JSON is malformed
          return decryptedString; 
        }
      }
      return decryptedString;
    } catch (error) {
      console.error('Get decrypted credential error:', error);
      toast({ title: "Error", description: "Failed to decrypt credential.", variant: "destructive" });
      return null;
    } finally {
      setIsLoadingCredentials(false);
    }
  };
  
  const deleteCredential = async (credentialId: string): Promise<boolean> => {
    if (!activeUserVaultId) return false;
    setIsLoadingCredentials(true);
    try {
      localStorage.removeItem(`${getCredentialContentPrefix(activeUserVaultId)}${credentialId}`);
      const updatedCredentials = credentials.filter(c => c.id !== credentialId);
      const success = saveCredentialsMetadata(updatedCredentials);
      if (success) {
        const credentialName = credentials.find(c => c.id === credentialId)?.name || "Credential";
        toast({ title: "Success", description: `"${credentialName}" deleted successfully.` });
      }
      return success;
    } catch (error) {
      console.error('Credential deletion error:', error);
      toast({ title: "Error", description: "Failed to delete credential.", variant: "destructive" });
      return false;
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
    updateCredential,
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
