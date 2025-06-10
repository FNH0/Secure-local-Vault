
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/common/AppLogo';
import Link from 'next/link';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_CLICK_COUNT_TARGET = 5;
const ADMIN_CLICK_TIME_LIMIT_MS = 3000; // 3 seconds

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const router = useRouter();
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    // Reset click count if modal is closed or reopened
    if (!isOpen) {
      setAdminClickCount(0);
      setLastClickTime(0);
    }
  }, [isOpen]);

  const handleLogoClick = () => {
    const currentTime = Date.now();

    if (currentTime - lastClickTime > ADMIN_CLICK_TIME_LIMIT_MS) {
      // Reset if too much time has passed since last click
      setAdminClickCount(1);
    } else {
      setAdminClickCount((prevCount) => prevCount + 1);
    }
    setLastClickTime(currentTime);
  };

  useEffect(() => {
    if (adminClickCount >= ADMIN_CLICK_COUNT_TARGET) {
      router.push('/admin');
      onClose(); // Close the modal after navigating
    }
  }, [adminClickCount, router, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-primary/30 shadow-xl shadow-primary/10">
        <DialogHeader className="items-center text-center">
          <div onClick={handleLogoClick} className="cursor-pointer p-2 rounded-md hover:bg-muted/50 transition-colors" title="Click me...">
            <AppLogo imageRenderHeightPx={40} textSize="text-2xl" />
          </div>
          <DialogTitle className="text-xl font-headline text-primary mt-2">FNH Secure Vault</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground px-4">
            Locally encrypted, secure storage for your sensitive files and credentials. 
            Your data is protected by your master password and never leaves your browser unencrypted.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Brought to you by:
          </p>
          <Link
            href="https://friendlyneighborhoodhacker.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold text-lg"
          >
            FriendlyNeighborhoodHacker.com
          </Link>
        </div>

        <DialogFooter className="mt-6 sm:justify-center">
          <Button type="button" variant="outline" onClick={onClose} className="border-primary/50 text-primary hover:bg-primary/10">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
