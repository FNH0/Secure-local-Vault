
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Fingerprint, Loader2, ShieldAlert, LockKeyhole } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/cryptoUtils';
import { getWebAuthnCredentialIdKey, getWebAuthnUserHandleKey } from '@/lib/constants';
import { useAuth } from '@/providers/AuthProvider';

function generateRandomBuffer(length = 32): ArrayBuffer {
  const randomNumber = new Uint8Array(length);
  window.crypto.getRandomValues(randomNumber);
  return randomNumber.buffer;
}

export function FingerprintSettings() {
  const { toast } = useToast();
  const { activeUserVaultId, activeUsername } = useAuth(); // Use activeUserVaultId
  const [isClient, setIsClient] = useState(false);
  const [isBiometricAuthSupported, setIsBiometricAuthSupported] = useState(false);
  const [isBiometricAuthEnabled, setIsBiometricAuthEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Simplified, optimistic check for WebAuthn support.
    // The actual success/failure will be determined when the user tries to enable it.
    const isSupported = typeof window !== 'undefined' && !!navigator.credentials && !!navigator.credentials.create;
    setIsBiometricAuthSupported(isSupported);

    if (activeUserVaultId) {
      const storedCredentialId = localStorage.getItem(getWebAuthnCredentialIdKey(activeUserVaultId));
      const storedUserHandle = localStorage.getItem(getWebAuthnUserHandleKey(activeUserVaultId));
      if (storedCredentialId && storedUserHandle) {
        setIsBiometricAuthEnabled(true);
      } else {
        setIsBiometricAuthEnabled(false);
      }
    } else {
      setIsBiometricAuthEnabled(false);
    }
  }, [activeUserVaultId]);

  const handleEnableBiometricAuth = async () => {
    if (!activeUserVaultId || !activeUsername) {
      toast({ title: 'Error', description: 'User or Vault identifier not found. Cannot enable biometrics.', variant: 'destructive' });
      return;
    }
    if (!isBiometricAuthSupported) {
      toast({ title: 'Error', description: 'Biometric login is not supported by your browser or no authenticator is available.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);

    try {
      const userHandleStorageKey = getWebAuthnUserHandleKey(activeUserVaultId);
      let userHandleBase64 = localStorage.getItem(userHandleStorageKey);
      let userHandleArrayBuffer: ArrayBuffer;

      if (userHandleBase64) {
        userHandleArrayBuffer = base64ToArrayBuffer(userHandleBase64);
      } else {
        userHandleArrayBuffer = generateRandomBuffer();
        userHandleBase64 = arrayBufferToBase64(userHandleArrayBuffer);
      }

      const challenge = generateRandomBuffer();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        rp: {
          name: 'FNH Secure Vault',
          id: window.location.hostname,
        },
        user: {
          id: userHandleArrayBuffer,
          name: `${activeUsername}@${window.location.hostname}`, // Use activeUsername
          displayName: `${activeUsername} (FNH Vault)`, // Use activeUsername
        },
        challenge: challenge,
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, 
          { type: 'public-key', alg: -257 }, 
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred',
          requireResidentKey: false, 
        },
        attestation: 'none',
      };

      const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });

      if (credential && (credential as PublicKeyCredential).rawId) {
        const newCredentialIdBase64 = arrayBufferToBase64((credential as PublicKeyCredential).rawId);
        localStorage.setItem(getWebAuthnCredentialIdKey(activeUserVaultId), newCredentialIdBase64);
        if (!localStorage.getItem(userHandleStorageKey) && userHandleBase64) {
            localStorage.setItem(userHandleStorageKey, userHandleBase64);
        }
        setIsBiometricAuthEnabled(true);
        toast({
          title: 'Success!',
          description: 'Biometric login has been enabled for this vault on this device.',
        });
      } else {
        throw new Error('Credential creation failed or returned an unexpected format.');
      }
    } catch (error) {
      console.error('Error enabling biometric login:', error);
      let description = 'An unknown error occurred while setting up biometric login.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          description = 'Biometric setup was cancelled or not allowed by the authenticator.';
        } else if (error.message.includes("Permissions Policy")) {
          description = "Browser security policy prevented biometric setup. This often happens in iframes. Try in a standalone tab or deployed environment.";
        } else {
          description = error.message;
        }
      }
      toast({
        title: 'Biometric Setup Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableBiometricAuth = () => {
    if (!activeUserVaultId) {
      toast({ title: 'Error', description: 'Vault identifier not found. Cannot disable biometrics.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);
    try {
      localStorage.removeItem(getWebAuthnCredentialIdKey(activeUserVaultId));
      localStorage.removeItem(getWebAuthnUserHandleKey(activeUserVaultId));
      setIsBiometricAuthEnabled(false);
      toast({
        title: 'Biometric Login Disabled',
        description: 'Biometric login has been disabled for this vault on this device.',
      });
    } catch (error) {
      console.error('Error disabling biometric login:', error);
      toast({ title: 'Error', description: 'Could not disable biometric login.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isClient || !activeUserVaultId && isClient) {
    return (
      <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <LockKeyhole className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-xl font-headline text-primary">Biometric Login</CardTitle>
              <CardDescription>{!activeUserVaultId && isClient ? "User or Vault not fully initialized." : "Loading biometric login settings..."}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted rounded animate-pulse"></div>
          {!activeUserVaultId && isClient && <p className="text-xs text-muted-foreground mt-2">Please ensure you are logged in and your vault is set up correctly.</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <LockKeyhole className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-xl font-headline text-primary">Biometric Login (Face ID / Fingerprint)</CardTitle>
            <CardDescription>
              Enable or manage biometric login for quick and secure access to this vault ({activeUsername}) on this device.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isBiometricAuthSupported && isClient && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Unsupported Browser or Device</AlertTitle>
            <AlertDescription>
              Your browser does not support WebAuthn, or no platform authenticator (like Face ID or a fingerprint scanner) is available. Biometric login cannot be used.
            </AlertDescription>
          </Alert>
        )}
        {isBiometricAuthSupported && (
          <div>
            {isBiometricAuthEnabled ? (
              <div className="space-y-3">
                <p className="text-sm text-green-500">Biometric login is currently enabled for {activeUsername}'s vault on this device.</p>
                <Button
                  variant="outline"
                  onClick={handleDisableBiometricAuth}
                  disabled={isProcessing}
                  className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive-foreground"
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Disable Biometric Login
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Set up biometric login (e.g., Face ID, Fingerprint) to unlock {activeUsername}'s vault on this device.
                  You will still need your master password for initial setup and occasionally for security.
                </p>
                <Button onClick={handleEnableBiometricAuth} disabled={isProcessing || !activeUsername} className="bg-primary hover:bg-primary/90">
                  {(isProcessing || !activeUsername) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Enable Biometric Login
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
    