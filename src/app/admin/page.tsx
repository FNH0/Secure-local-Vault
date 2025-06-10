
'use client';

import { useState, type FormEvent } from 'react';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ShieldAlert, LogIn, LogOut, Loader2 } from 'lucide-react'; // Added LogOut
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// Hardcoded admin credentials for prototyping
const ADMIN_USERNAME = 'admin_fnh';
const ADMIN_PASSWORD = 'superSecureAdminPa$$wOrd!2024';

export default function AdminPage() {
  const [enteredUsername, setEnteredUsername] = useState('');
  const [enteredPassword, setEnteredPassword] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    // Simulate network delay
    setTimeout(() => {
      if (enteredUsername === ADMIN_USERNAME && enteredPassword === ADMIN_PASSWORD) {
        toast({ title: 'Admin Access Granted', description: 'Welcome, Administrator!' });
        setIsAdminAuthenticated(true);
      } else {
        setLoginError('Invalid admin username or password.');
        toast({ title: 'Admin Login Failed', description: 'Invalid credentials.', variant: 'destructive' });
      }
      setIsLoggingIn(false);
    }, 500);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setEnteredUsername('');
    setEnteredPassword('');
    setLoginError(null);
    toast({ title: 'Admin Logged Out', description: 'You have been logged out from the admin panel.' });
  };

  if (isAdminAuthenticated) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">
            This panel allows administrators to view user account summaries and manage user data stored locally in this browser.
            Deleting a user will permanently remove all their associated data from this browser's local storage.
            This action is irreversible.
          </p>
          <Button variant="outline" onClick={handleAdminLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Admin Logout
          </Button>
        </div>
        <AdminPanel />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] py-8"> {/* Adjusted min-height */}
      <Card className="w-full max-w-md bg-card border-primary/30 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary flex items-center">
            <ShieldAlert className="mr-2 h-6 w-6" /> Admin Panel Access
          </CardTitle>
          <CardDescription>
            Please enter administrator credentials to proceed.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleAdminLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Admin Username</Label>
              <Input
                id="admin-username"
                type="text"
                value={enteredUsername}
                onChange={(e) => setEnteredUsername(e.target.value)}
                required
                className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                placeholder="Enter admin username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={enteredPassword}
                onChange={(e) => setEnteredPassword(e.target.value)}
                required
                className="bg-input border-primary/50 focus:ring-primary focus:border-primary"
                placeholder="Enter admin password"
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive text-center">{loginError}</p>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isLoggingIn}>
              {isLoggingIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Login as Admin
            </Button>
            <Button variant="link" asChild className="text-sm text-primary/80 hover:text-primary">
                <Link href="/login">
                    Return to User Login
                </Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
