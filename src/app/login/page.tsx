
'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AppLogo } from '@/components/common/AppLogo';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { AboutModal } from '@/components/info/AboutModal';

export default function LoginPage() {
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <AppLogo className="justify-center mb-6" imageRenderHeightPx={48} textSize="text-3xl" />
          </div>
          <LoginForm />
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-4 text-muted-foreground hover:text-primary"
        onClick={() => setShowAboutModal(true)}
        aria-label="About FNH Secure Vault"
      >
        <Info className="h-6 w-6" />
      </Button>
      <AboutModal isOpen={showAboutModal} onClose={() => setShowAboutModal(false)} />
    </>
  );
}

