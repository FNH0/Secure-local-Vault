
'use client';

import type React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ACTIVE_USERNAME_KEY,
  getPasswordHashKey, 
  getSaltKey, 
  getVaultIdKey
} from '@/lib/constants';
import * as bip39 from 'bip39';

interface AuthContextType {
  isAuthenticated: boolean;
  activeUsername: string | null;
  activeUserVaultId: string | null;
  derivedKey: CryptoKey | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (username: string, password: string) => Promise<{success: boolean, message?: string}>;
  resetPasswordWithRecoveryPhrase: (username: string, phrase: string, newPassword: string) => Promise<boolean>;
  isAccountAvailable: (username: string) => Promise<boolean>;
  getAllUsernames: () => Promise<string[]>;
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
  return btoa(String.fromCharCode(...new Uint8Array(derivedBits)));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [derivedKey, setDerivedKey] = useState<CryptoKey | null>(null);
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const [activeUserVaultId, setActiveUserVaultId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedActiveUser = localStorage.getItem(ACTIVE_USERNAME_KEY);
      if (storedActiveUser) {
        setActiveUsername(storedActiveUser);
        const vaultId = localStorage.getItem(getVaultIdKey(storedActiveUser));
        if (vaultId) { // Ensure vaultId exists before setting
          setActiveUserVaultId(vaultId);
        } else {
            // This case could happen if vaultId was somehow not set during signup for an existing user.
            // Or if localStorage was manually tampered with.
            console.warn(`Vault ID not found for active user: ${storedActiveUser}. User may need to re-authenticate or setup fully.`);
            // Consider clearing active user if vaultId is crucial and missing.
            // localStorage.removeItem(ACTIVE_USERNAME_KEY);
            // setActiveUsername(null); 
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage during initial load:", error);
    }
    setIsLoading(false);
  }, []);

  const isAccountAvailable = useCallback(async (username: string): Promise<boolean> => {
    try {
      const storedHash = localStorage.getItem(getPasswordHashKey(username));
      return !storedHash; 
    } catch (error) {
      console.error("Error checking account availability:", error);
      return false; 
    }
  }, []);

  const getAllUsernames = useCallback(async (): Promise<string[]> => {
    const usernames: string[] = [];
    try {
      const prefix = 'fnh_vault_user_';
      const suffix = '_password_hash';
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix) && key.endsWith(suffix)) {
          const username = key.substring(prefix.length, key.length - suffix.length);
          usernames.push(username);
        }
      }
    } catch (error) {
      console.error("Error retrieving all usernames:", error);
    }
    return usernames;
  }, []);


  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const storedHashKey = getPasswordHashKey(username);
      const saltKey = getSaltKey(username);
      const vaultIdKey = getVaultIdKey(username);

      const storedHash = localStorage.getItem(storedHashKey);
      const saltBase64 = localStorage.getItem(saltKey);
      const userVaultId = localStorage.getItem(vaultIdKey);

      if (!storedHash || !saltBase64 || !userVaultId) {
        console.error('Account data not found for this username.');
        setDerivedKey(null);
        setActiveUsername(null);
        setActiveUserVaultId(null);
        setIsLoading(false);
        return false;
      }
      
      const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
      const currentPasswordHash = await hashPasswordInternal(password, salt);

      if (currentPasswordHash === storedHash) {
        const key = await deriveKeyInternal(password, salt);
        setDerivedKey(key);
        setActiveUsername(username);
        setActiveUserVaultId(userVaultId);
        localStorage.setItem(ACTIVE_USERNAME_KEY, username);
        setIsLoading(false);
        return true;
      } else {
        console.error('Invalid password.');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
    setDerivedKey(null);
    setActiveUsername(null);
    setActiveUserVaultId(null);
    localStorage.removeItem(ACTIVE_USERNAME_KEY);
    setIsLoading(false);
    return false;
  }, []);

  const signup = useCallback(async (username: string, password: string): Promise<{success: boolean, message?: string}> => {
    setIsLoading(true);
    try {
      const accountExists = !(await isAccountAvailable(username));
      if (accountExists) {
        setIsLoading(false);
        return { success: false, message: "Username already taken. Please choose another." };
      }

      const salt = crypto.getRandomValues(new Uint8Array(16));
      const newHash = await hashPasswordInternal(password, salt);
      const newVaultId = crypto.randomUUID();

      localStorage.setItem(getPasswordHashKey(username), newHash);
      localStorage.setItem(getSaltKey(username), btoa(String.fromCharCode(...salt)));
      localStorage.setItem(getVaultIdKey(username), newVaultId);
      
      const key = await deriveKeyInternal(password, salt);
      setDerivedKey(key);
      setActiveUsername(username);
      setActiveUserVaultId(newVaultId);
      localStorage.setItem(ACTIVE_USERNAME_KEY, username);
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return { success: false, message: "An error occurred during signup. Please try again." };
    }
  }, [isAccountAvailable]);

  const resetPasswordWithRecoveryPhrase = useCallback(async (username: string, phrase: string, newPassword: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const storedHashKey = getPasswordHashKey(username);
      if (!localStorage.getItem(storedHashKey)) { 
         console.error("No account found for this username to reset password.");
         setIsLoading(false);
         return false;
      }

      if (!bip39.validateMnemonic(phrase)) {
        console.error('Invalid recovery phrase.');
        setIsLoading(false);
        return false;
      }
      
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const newHash = await hashPasswordInternal(newPassword, salt);
      
      localStorage.setItem(storedHashKey, newHash);
      localStorage.setItem(getSaltKey(username), btoa(String.fromCharCode(...salt)));
      
      const userVaultId = localStorage.getItem(getVaultIdKey(username));
      if (!userVaultId) {
          // This should ideally not happen if an account exists, but good to check
          console.error("Vault ID not found during password reset, cannot proceed.");
          setIsLoading(false);
          return false;
      }
      setActiveUserVaultId(userVaultId); // Ensure vaultId is set

      const key = await deriveKeyInternal(newPassword, salt);
      setDerivedKey(key);
      setActiveUsername(username); 
      localStorage.setItem(ACTIVE_USERNAME_KEY, username);
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
    setActiveUsername(null);
    setActiveUserVaultId(null);
    localStorage.removeItem(ACTIVE_USERNAME_KEY);
    router.push('/login');
  }, [router]);

  const value = {
    isAuthenticated: !!derivedKey && !!activeUsername,
    activeUsername,
    activeUserVaultId,
    derivedKey,
    login,
    logout,
    signup,
    resetPasswordWithRecoveryPhrase,
    isAccountAvailable,
    getAllUsernames,
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
