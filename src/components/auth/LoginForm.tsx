
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, RotateCcw, ShieldQuestion } from 'lucide-react';

type LoginFormMode = 'login' | 'setPassword' | 'recoverPassword';

export function LoginForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, setPassword: setNewPasswordAuth, resetPasswordWithRecoveryPhrase, isPasswordSet, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentMode, setCurrentMode] = useState<LoginFormMode>('login');
  const [isCheckingPasswordStatus, setIsCheckingPasswordStatus] = useState(true);

  useEffect(() => {
    if (!authIsLoading) {
      if (isPasswordSet) {
        setCurrentMode('login');
      } else {
        setCurrentMode('setPassword');
      }
      setIsCheckingPasswordStatus(false);
    }
  }, [isPasswordSet, authIsLoading]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (currentMode === 'setPassword') {
      if (password !== confirmPassword) {
        toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      if (password.length < 8) {
        toast({ title: 'Error', description: 'Password must be at least 8 characters long.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      const success = await setNewPasswordAuth(password);
      if (success) {
        toast({ title: 'Success', description: 'Vault password set. Welcome!' });
        router.push('/vault');
      } else {
        toast({ title: 'Error', description: 'Failed to set password. Please try again.', variant: 'destructive' });
      }
    } else if (currentMode === 'login') {
      const success = await login(password);
      if (success) {
        toast({ title: 'Success', description: 'Logged in successfully.' });
        router.push('/vault');
      } else {
        toast({ title: 'Error', description: 'Invalid password. Please try again.', variant: 'destructive' });
      }
    } else if (currentMode === 'recoverPassword') {
      if (!recoveryPhrase.trim()) {
        toast({ title: 'Error', description: 'Recovery phrase cannot be empty.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      const phraseWords = recoveryPhrase.trim().split(/\s+/);
      if (phraseWords.length !== 12) {
         toast({ title: 'Error', description: 'Recovery phrase must be 12 words.', variant: 'destructive' });
         setIsSubmitting(false);
         return;
      }
      if (password !== confirmPassword) {
        toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      if (password.length < 8) {
        toast({ title: 'Error', description: 'New password must be at least 8 characters long.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }
      const success = await resetPasswordWithRecoveryPhrase(recoveryPhrase.trim(), password);
      if (success) {
        toast({ 
          title: 'Password Reset Successful', 
          description: 'You can now log in with your new password. Note: Files encrypted with your old password require the old password to be accessed.',
          duration: 9000, // Longer duration for important message
        });
        router.push('/vault');
      } else {
        toast({ title: 'Error', description: 'Failed to reset password. Please check your recovery phrase and try again.', variant: 'destructive' });
      }
    }
    setIsSubmitting(false);
  };

  if (isCheckingPasswordStatus) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTitle = () => {
    if (currentMode === 'setPassword') return 'Create Your Secure Vault';
    if (currentMode === 'recoverPassword') return 'Recover Your Vault';
    return 'Unlock Vault';
  };

  const getDescription = () => {
    if (currentMode === 'setPassword') return 'Set a strong password to protect your vault.';
    if (currentMode === 'recoverPassword') return 'Enter your 12-word recovery phrase and set a new password.';
    return 'Enter your password to access your secure files.';
  };
  
  const getButtonText = () => {
    if (currentMode === 'setPassword') return 'Create Vault';
    if (currentMode === 'recoverPassword') return 'Reset Password & Login';
    return 'Unlock';
  }

  return (
    <Card className="w-full bg-card border-primary/30 shadow-xl shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {currentMode === 'recoverPassword' && (
            <div className="space-y-2">
              <Label htmlFor="recovery-phrase">12-Word Recovery Phrase</Label>
              <Textarea
                id="recovery-phrase"
                value={recoveryPhrase}
                onChange={(e) => setRecoveryPhrase(e.target.value)}
                required
                className="bg-input border-primary/50 focus:ring-primary focus:border-primary min-h-[80px]"
                placeholder="Enter your 12 words separated by spaces"
                rows={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">{currentMode === 'recoverPassword' ? 'New Password' : 'Password'}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 bg-input border-primary/50 focus:ring-primary focus:border-primary"
                placeholder={currentMode === 'recoverPassword' ? 'Enter new password' : 'Enter your password'}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          {(currentMode === 'setPassword' || currentMode === 'recoverPassword') && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">{currentMode === 'recoverPassword' ? 'Confirm New Password' : 'Confirm Password'}</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10 bg-input border-primary/50 focus:ring-primary focus:border-primary"
                  placeholder={currentMode === 'recoverPassword' ? 'Confirm new password' : 'Confirm your password'}
                />
                 <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
               <p className="text-xs text-muted-foreground pt-1">Password must be at least 8 characters long.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getButtonText()}
          </Button>
          
          {currentMode === 'login' && isPasswordSet && (
            <Button 
              type="button" 
              variant="link" 
              className="text-sm text-primary/80 hover:text-primary"
              onClick={() => {
                setCurrentMode('recoverPassword');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <ShieldQuestion className="mr-2 h-4 w-4" /> Forgot Password? / Recover Account
            </Button>
          )}
           {currentMode === 'recoverPassword' && (
            <Button 
              type="button" 
              variant="link" 
              className="text-sm text-primary/80 hover:text-primary"
              onClick={() => {
                setCurrentMode('login');
                setPassword('');
                setConfirmPassword('');
                setRecoveryPhrase('');
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Back to Login
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
