
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LOCAL_STORAGE_PASSWORD_HASH_KEY, LOCAL_STORAGE_SALT_KEY } from '@/lib/constants';
import * as bip39 from 'bip39';

interface AuthContextType {
  isAuthenticated: boolean;
  derivedKey: CryptoKey | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  setPassword: (password: string) => Promise<boolean>;
  resetPasswordWithRecoveryPhrase: (phrase: string, newPassword: string) => Promise<boolean>;
  isPasswordSet: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PBKDF2_ITERATIONS = 100000;
const KEY_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const KEY_EXTRACTABLE = true;
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];

async function deriveKeyInternal(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: KEY_ALGORITHM, length: KEY_LENGTH },
    KEY_EXTRACTABLE,
    KEY_USAGE
  );
}

async function hashPasswordInternal(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 
  );
  return btoa(String.fromCharCode(...new Uint8Array(derivedBits))); // Base64 encode
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);
  const [isPasswordSet, setIsPasswordSet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedHash = localStorage.getItem(LOCAL_STORAGE_PASSWORD_HASH_KEY);
      setIsPasswordSet(!!storedHash);
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      setIsPasswordSet(false); // Assume password not set if localStorage is inaccessible
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const storedHash = localStorage.getItem(LOCAL_STORAGE_PASSWORD_HASH_KEY);
      const saltHex = localStorage.getItem(LOCAL_STORAGE_SALT_KEY);

      if (!storedHash || !saltHex) {
        console.error('Password or salt not set.');
        setIsLoading(false);
        return false;
      }
      
      const salt = Uint8Array.from(atob(saltHex), c => c.charCodeAt(0));
      const currentHash = await hashPasswordInternal(password, salt);

      if (currentHash === storedHash) {
        const key = await deriveKeyInternal(password, salt);
        setDerivedKey(key);
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    setDerivedKey(null);
    setIsLoading(false);
    return false;
  }, []);

  const setPassword = useCallback(async (password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const newHash = await hashPasswordInternal(password, salt);
      
      localStorage.setItem(LOCAL_STORAGE_PASSWORD_HASH_KEY, newHash);
      localStorage.setItem(LOCAL_STORAGE_SALT_KEY, btoa(String.fromCharCode(...salt))); // Store salt as base64
      
      const key = await deriveKeyInternal(password, salt);
      setDerivedKey(key);
      setIsPasswordSet(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Set password error:', error);
    }
    setIsLoading(false);
    return false;
  }, []);

  const resetPasswordWithRecoveryPhrase = useCallback(async (phrase: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (!bip39.validateMnemonic(phrase)) {
        console.error('Invalid recovery phrase.');
        setIsLoading(false);
        return false;
      }

      // If phrase is valid, proceed to set the new password
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const newHash = await hashPasswordInternal(newPassword, salt);
      
      localStorage.setItem(LOCAL_STORAGE_PASSWORD_HASH_KEY, newHash);
      localStorage.setItem(LOCAL_STORAGE_SALT_KEY, btoa(String.fromCharCode(...salt)));
      
      const key = await deriveKeyInternal(newPassword, salt);
      setDerivedKey(key);
      setIsPasswordSet(true); // Ensure this is true
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Reset password with recovery phrase error:', error);
    }
    setIsLoading(false);
    return false;
  }, []);

  const logout = useCallback(() => {
    setDerivedKey(null);
    router.push('/login');
  }, [router]);

  const value = {
    isAuthenticated: !!derivedKey,
    derivedKey,
    login,
    logout,
    setPassword,
    resetPasswordWithRecoveryPhrase,
    isPasswordSet,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
