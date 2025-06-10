'use client';

import { LoginForm } from '@/components/auth/LoginForm';
import { AppLogo } from '@/components/common/AppLogo';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <AppLogo className="justify-center mb-6" imageRenderHeightPx={48} textSize="text-3xl" />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
