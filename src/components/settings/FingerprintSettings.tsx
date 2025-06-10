
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Fingerprint, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function FingerprintSettings() {
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);
  const [isFingerprintSupported, setIsFingerprintSupported] = useState(false);
  
  // Placeholder states - these will be replaced by actual logic later
  const [isFingerprintEnabled, setIsFingerprintEnabled] = useState(false); 
  const [isSettingUp, setIsSettingUp] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && navigator.credentials && typeof navigator.credentials.create === 'function') {
      setIsFingerprintSupported(true);
    } else {
      setIsFingerprintSupported(false);
    }
  }, []);

  const handleEnableFingerprint = () => {
    setIsSettingUp(true); // Show loading state on button if needed
    // Placeholder for actual WebAuthn registration logic
    // For now, just show a toast.
    setTimeout(() => {
      toast({
        title: 'Coming Soon!',
        description: 'Fingerprint login setup will be available in a future update.',
      });
      // setIsFingerprintEnabled(true); // Simulate enabling
      setIsSettingUp(false);
    }, 1000);
  };

  const handleDisableFingerprint = () => {
    // Placeholder
    toast({
        title: 'Coming Soon!',
        description: 'Disabling fingerprint login will be available in a future update.',
    });
    // setIsFingerprintEnabled(false); // Simulate disabling
  }

  if (!isClient) {
    // Avoid hydration mismatch by not rendering browser-specific checks on server
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
            <AlertTitle>Unsupported Browser</AlertTitle>
            <AlertDescription>
              Your browser does not support WebAuthn, or it's not available in this context. Fingerprint login cannot be used.
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
                    className="border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive-foreground"
                >
                  Disable Fingerprint Login
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Set up fingerprint login to unlock your vault using your device's biometric sensor.
                  You will still need your master password for the initial setup and occasionally for security.
                </p>
                <Button onClick={handleEnableFingerprint} disabled={isSettingUp} className="bg-primary hover:bg-primary/90">
                  <Fingerprint className="mr-2 h-4 w-4" />
                  {isSettingUp ? 'Setting up...' : 'Enable Fingerprint Login'}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
