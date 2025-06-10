'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, setPassword: setNewPasswordAuth, isPasswordSet, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentIsPasswordSet, setCurrentIsPasswordSet] = useState(false);
  const [isCheckingPasswordStatus, setIsCheckingPasswordStatus] = useState(true);

  useEffect(() => {
    if (!authIsLoading) {
      setCurrentIsPasswordSet(isPasswordSet);
      setIsCheckingPasswordStatus(false);
    }
  }, [isPasswordSet, authIsLoading]);


  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!currentIsPasswordSet) { // Setting password for the first time
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
    } else { // Logging in
      const success = await login(password);
      if (success) {
        toast({ title: 'Success', description: 'Logged in successfully.' });
        router.push('/vault');
      } else {
        toast({ title: 'Error', description: 'Invalid password. Please try again.', variant: 'destructive' });
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

  return (
    <Card className="w-full bg-card border-primary/30 shadow-xl shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">
          {currentIsPasswordSet ? 'Unlock Vault' : 'Create Your Secure Vault'}
        </CardTitle>
        <CardDescription>
          {currentIsPasswordSet ? 'Enter your password to access your secure files.' : 'Set a strong password to protect your vault.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10 bg-input border-primary/50 focus:ring-primary focus:border-primary"
                placeholder="Enter your password"
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
          {!currentIsPasswordSet && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10 bg-input border-primary/50 focus:ring-primary focus:border-primary"
                  placeholder="Confirm your password"
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
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentIsPasswordSet ? 'Unlock' : 'Create Vault'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
