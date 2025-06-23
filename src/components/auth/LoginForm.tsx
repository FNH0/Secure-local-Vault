
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, RotateCcw, ShieldQuestion, UserPlus, LogIn, Fingerprint } from 'lucide-react';
import { getVaultIdKey, getWebAuthnCredentialIdKey } from '@/lib/constants';

type LoginFormMode = 'login' | 'signup' | 'recoverPassword';

export function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUsernames, setExistingUsernames] = useState<string[]>([]);
  const [isBiometricSupportedForUser, setIsBiometricSupportedForUser] = useState(false);

  const { 
    login,
    loginWithBiometrics,
    signup, 
    resetPasswordWithRecoveryPhrase, 
    getAllUsernames,
    isLoading: authIsLoading,
    activeUsername: previouslyActiveUsername 
  } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentMode, setCurrentMode] = useState<LoginFormMode>('login');
  const [initialModeDetermined, setInitialModeDetermined] = useState(false);

  useEffect(() => {
    if (!authIsLoading && !initialModeDetermined) {
      setCurrentMode('login'); 
      setInitialModeDetermined(true);
    }
  }, [authIsLoading, initialModeDetermined]);

  useEffect(() => {
    const fetchUsernames = async () => {
      const users = await getAllUsernames();
      setExistingUsernames(users);
      if (previouslyActiveUsername && users.includes(previouslyActiveUsername)) {
        setUsername(previouslyActiveUsername);
      } else if (users.length > 0 && !previouslyActiveUsername) {
        // Optionally pre-select the first user or leave blank
        // setUsername(users[0]); 
      }
    };
    fetchUsernames();
  }, [getAllUsernames, previouslyActiveUsername]);

  // Check for biometric support when username changes
  useEffect(() => {
    if (username) {
      try {
        const vaultId = localStorage.getItem(getVaultIdKey(username));
        const credentialId = vaultId ? localStorage.getItem(getWebAuthnCredentialIdKey(vaultId)) : null;
        setIsBiometricSupportedForUser(!!credentialId);
      } catch (e) {
        setIsBiometricSupportedForUser(false);
      }
    } else {
      setIsBiometricSupportedForUser(false);
    }
  }, [username]);

  const handlePasswordLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const success = await login(username, password);
    if (success) {
      toast({ title: 'Success', description: 'Logged in successfully.' });
      router.push('/vault');
    } else {
      toast({ title: 'Error', description: 'Invalid username or password.', variant: 'destructive' });
    }
    
    setIsSubmitting(false);
  }

  const handleBiometricLogin = async () => {
    setIsSubmitting(true);

    const success = await loginWithBiometrics(username, password);
    if (success) {
        toast({ title: 'Success!', description: 'Biometric login successful.' });
        router.push('/vault');
    } else {
        // AuthProvider will show specific toasts for biometric failure vs. password failure
    }
    setIsSubmitting(false);
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    if (!username.trim() && (currentMode === 'login' || currentMode === 'signup' || currentMode === 'recoverPassword')) {
        toast({ title: 'Error', description: 'Username is required.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
    }

    if (currentMode === 'signup') {
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
      const result = await signup(username, password);
      if (result.success) {
        toast({ title: 'Account Created!', description: 'Welcome! Your secure vault is ready.' });
        router.push('/vault');
      } else {
        toast({ title: 'Error', description: result.message || 'Failed to create account. Please try again.', variant: 'destructive' });
      }
    } else if (currentMode === 'login') {
      // This path is now only for the main form submission, not the button click directly
      await handlePasswordLogin(event);
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
      const success = await resetPasswordWithRecoveryPhrase(username, recoveryPhrase.trim(), password);
      if (success) {
        toast({ 
          title: 'Password Reset Successful', 
          description: 'You can now log in with your new password. Note: Files encrypted with your old password require the old password to be accessed.',
          duration: 9000,
        });
        const loginSuccess = await login(username, password);
        if (loginSuccess) {
            router.push('/vault');
        } else {
            setCurrentMode('login'); 
        }
      } else {
        toast({ title: 'Error', description: 'Failed to reset password. Please check your username, recovery phrase and try again.', variant: 'destructive' });
      }
    }
    setIsSubmitting(false);
  };

  if (authIsLoading && !initialModeDetermined) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTitle = () => {
    if (currentMode === 'signup') return 'Create Your Secure Account';
    if (currentMode === 'recoverPassword') return 'Recover Your Vault Account';
    return 'Unlock Your Vault';
  };

  const getDescription = () => {
    if (currentMode === 'signup') return 'Choose a username and a strong password to protect your vault.';
    if (currentMode === 'recoverPassword') return 'Enter your username, 12-word recovery phrase, and set a new password.';
    return 'Enter your username and password to access your secure files.';
  };
  
  const getButtonText = () => {
    if (currentMode === 'signup') return 'Create Account & Login';
    if (currentMode === 'recoverPassword') return 'Reset Password & Login';
    return 'Login with Password';
  }

  return (
    <Card className="w-full bg-card border-primary/30 shadow-xl shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">{getTitle()}</CardTitle>
        <CardDescription>{getDescription()}</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {existingUsernames.length > 0 && currentMode === 'login' && (
            <div className="space-y-2">
              <Label htmlFor="select-username">Select Existing User</Label>
              <Select onValueChange={(value) => setUsername(value)} defaultValue={username}>
                <SelectTrigger id="select-username" className="bg-input border-primary/50 focus:ring-primary focus:border-primary">
                  <SelectValue placeholder="Choose a user..." />
                </SelectTrigger>
                <SelectContent>
                  {existingUsernames.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              required
              className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
              placeholder={currentMode === 'login' && existingUsernames.length > 0 ? "Or type new username..." : "Enter your username"}
              autoComplete="username"
            />
          </div>

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
                autoComplete={currentMode === 'login' ? "current-password" : "new-password"}
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
          {(currentMode === 'signup' || currentMode === 'recoverPassword') && (
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
                  autoComplete="new-password"
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
          <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading}>
            {(isSubmitting || authIsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {getButtonText()}
          </Button>

          {currentMode === 'login' && isBiometricSupportedForUser && (
            <Button type="button" variant="outline" className="w-full" disabled={isSubmitting || authIsLoading} onClick={handleBiometricLogin}>
              {(isSubmitting || authIsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Fingerprint className="mr-2 h-4 w-4" />
              Login with Face ID / Fingerprint
            </Button>
          )}
          
          {currentMode === 'login' && (
            <>
            <Button 
              type="button" 
              variant="link" 
              className="text-sm text-primary/80 hover:text-primary"
              onClick={() => {
                setCurrentMode('signup');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Create New Account
            </Button>
            <Button 
              type="button" 
              variant="link" 
              className="text-sm text-primary/80 hover:text-primary -mt-2"
              onClick={() => {
                setCurrentMode('recoverPassword');
                setPassword('');
                setConfirmPassword('');
              }}
            >
              <ShieldQuestion className="mr-2 h-4 w-4" /> Forgot Password? / Recover
            </Button>
            </>
          )}
           {(currentMode === 'signup' || currentMode === 'recoverPassword') && (
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
              {currentMode === 'signup' ? <LogIn className="mr-2 h-4 w-4"/> : <RotateCcw className="mr-2 h-4 w-4" />} 
              Back to Login
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
