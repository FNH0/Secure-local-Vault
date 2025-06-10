
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Fingerprint, Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { arrayBufferToBase64, base64ToArrayBuffer } from '@/lib/cryptoUtils';
import { LOCAL_STORAGE_WEBAUTHN_CREDENTIAL_ID, LOCAL_STORAGE_WEBAUTHN_USER_HANDLE } from '@/lib/constants';

// Helper to generate a random buffer (for challenge and user handle)
function generateRandomBuffer(length = 32): ArrayBuffer {
  const randomNumber = new Uint8Array(length);
  window.crypto.getRandomValues(randomNumber);
  return randomNumber.buffer;
}

export function FingerprintSettings() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isFingerprintSupported, setIsFingerprintSupported] = useState(false);
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // For enable/disable operations

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && navigator.credentials && typeof navigator.credentials.create === 'function') {
      setIsFingerprintSupported(true);
      // Check if fingerprint is already enabled
      const storedCredentialId = localStorage.getItem(LOCAL_STORAGE_WEBAUTHN_CREDENTIAL_ID);
      const storedUserHandle = localStorage.getItem(LOCAL_STORAGE_WEBAUTHN_USER_HANDLE);
      if (storedCredentialId && storedUserHandle) {
        setIsFingerprintEnabled(true);
      }
    } else {
      setIsFingerprintSupported(false);
    }
  }, []);

  const handleEnableFingerprint = async () => {
    if (!isFingerprintSupported) {
      toast({ title: 'Error', description: 'Fingerprint login is not supported by your browser.', variant: 'destructive' });
      return;
    }
    setIsProcessing(true);

    try {
      let userHandleBase64 = localStorage.getItem(LOCAL_STORAGE_WEBAUTHN_USER_HANDLE);
      let userHandleArrayBuffer: ArrayBuffer;

      if (userHandleBase64) {
        userHandleArrayBuffer = base64ToArrayBuffer(userHandleBase64);
      } else {
        userHandleArrayBuffer = generateRandomBuffer();
        userHandleBase64 = arrayBufferToBase64(userHandleArrayBuffer);
        localStorage.setItem(LOCAL_STORAGE_WEBAUTHN_USER_HANDLE, userHandleBase64);
      }

      const challenge = generateRandomBuffer();

      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        rp: {
          name: 'FNH Secure Vault',
          id: window.location.hostname,
        },
        user: {
          id: userHandleArrayBuffer,
          name: `user@${window.location.hostname}`, // Simple unique name
          displayName: 'Vault User',
        },
        challenge: challenge,
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: 'platform', // Prefer platform authenticators
          userVerification: 'required', // Require user verification (fingerprint, PIN, etc.)
          residentKey: 'preferred', // Prefer creating a discoverable credential
          requireResidentKey: false,
        },
        attestation: 'none', // Simplest for client-side only
      };

      const credential = await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });

      if (credential && (credential as PublicKeyCredential).rawId) {
        const newCredentialIdBase64 = arrayBufferToBase64((credential as PublicKeyCredential).rawId);
        localStorage.setItem(LOCAL_STORAGE_WEBAUTHN_CREDENTIAL_ID, newCredentialIdBase64);
        setIsFingerprintEnabled(true);
        toast({
          title: 'Success!',
          description: 'Fingerprint login has been enabled for this device.',
        });
      } else {
        throw new Error('Credential creation failed or returned an unexpected format.');
      }
    } catch (error) {
      console.error('Error enabling fingerprint:', error);
      let description = 'An unknown error occurred.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          description = 'Fingerprint setup was cancelled or not allowed by the authenticator.';
        } else {
          description = error.message;
        }
      }
      toast({
        title: 'Fingerprint Setup Failed',
        description: description,
        variant: 'destructive',
      });
      // Clean up user handle if it was newly created and registration failed
      if (!localStorage.getItem(LOCAL_STORAGE_WEBAUTHN_CREDENTIAL_ID)) {
         localStorage.removeItem(LOCAL_STORAGE_WEBAUTHN_USER_HANDLE); // Only remove if no credential was stored
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisableFingerprint = () => {
    setIsProcessing(true);
    try {
      localStorage.removeItem(LOCAL_STORAGE_WEBAUTHN_CREDENTIAL_ID);
      localStorage.removeItem(LOCAL_STORAGE_WEBAUTHN_USER_HANDLE); // Also remove user handle
      setIsFingerprintEnabled(false);
      toast({
        title: 'Fingerprint Login Disabled',
        description: 'Fingerprint login has been disabled on this device.',
      });
    } catch (error) {
      console.error('Error disabling fingerprint:', error);
      toast({ title: 'Error', description: 'Could not disable fingerprint login.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isClient) {
    return (
      <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <Fingerprint className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-xl font-headline text-primary">Fingerprint Login</CardTitle>
              <CardDescription>Loading fingerprint settings...</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-10 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-primary/30 shadow-md shadow-primary/10">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <Fingerprint className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-xl font-headline text-primary">Fingerprint Login</CardTitle>
            <CardDescription>
              Enable or manage fingerprint login for quick and secure access to your vault.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isFingerprintSupported && (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Unsupported Browser or Device</AlertTitle>
            <AlertDescription>
              Your browser does not support WebAuthn, or no platform authenticator (like a fingerprint scanner) is available. Fingerprint login cannot be used.
            </AlertDescription>
          </Alert>
        )}
        {isFingerprintSupported && (
          <div>
            {isFingerprintEnabled ? (
              <div className="space-y-3">
                <p className="text-sm text-green-500">Fingerprint login is currently enabled on this device.</p>
                <Button
                  variant="outline"
                  onClick={handleDisableFingerprint}
                  disabled={isProcessing}
                  className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive-foreground"
                >
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Disable Fingerprint Login
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Set up fingerprint login to unlock your vault using your device's biometric sensor.
                  You will still need your master password for the initial setup and occasionally for security.
                </p>
                <Button onClick={handleEnableFingerprint} disabled={isProcessing} className="bg-primary hover:bg-primary/90">
                  {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Fingerprint className="mr-2 h-4 w-4" />
                  Enable Fingerprint Login
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
