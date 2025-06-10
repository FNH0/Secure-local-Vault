
'use client';

import { useEffect, useState } from 'react';
import { useAuth, type UserDetailsForAdmin } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Trash2, ShieldCheck, ShieldAlert, Home, Package, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function AdminPanel() {
  const { getAllUserDetailsForAdmin, deleteUserDataForAdmin, isLoading: authIsLoading } = useAuth();
  const [users, setUsers] = useState<UserDetailsForAdmin[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null); // Store username being deleted
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const userDetails = await getAllUserDetailsForAdmin();
      setUsers(userDetails);
    } catch (error) {
      console.error("Failed to fetch user details for admin:", error);
      toast({ title: "Error", description: "Could not load user list.", variant: "destructive" });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteUser = async (username: string) => {
    setIsDeletingUser(username);
    const result = await deleteUserDataForAdmin(username);
    if (result.success) {
      toast({ title: "Success", description: result.message });
      fetchUsers(); // Refresh the list
    } else {
      toast({ title: "Error", description: result.message || "Failed to delete user data.", variant: "destructive" });
    }
    setIsDeletingUser(null);
  };

  const totalLoading = authIsLoading || isLoadingUsers;

  if (totalLoading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading user data...</p>
      </div>
    );
  }

  return (
    <Card className="bg-card border-primary/30 shadow-xl shadow-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">User Account Management</CardTitle>
        <CardDescription>
          View user profiles and data summaries from this browser's local storage. 
          Passwords are not displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 && !totalLoading ? (
          <p className="text-center text-muted-foreground py-8">No user accounts found in local storage.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Password Set</TableHead>
                <TableHead><Package className="inline-block mr-1 h-4 w-4" />Files</TableHead>
                <TableHead>Total Size</TableHead>
                <TableHead><KeyRound className="inline-block mr-1 h-4 w-4" />Credentials</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.username}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>
                    {user.hasPasswordSet ? (
                      <ShieldCheck className="h-5 w-5 text-green-500 inline-block mr-2" />
                    ) : (
                      <ShieldAlert className="h-5 w-5 text-yellow-500 inline-block mr-2" />
                    )}
                    {user.hasPasswordSet ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>{user.fileCount}</TableCell>
                  <TableCell>{formatBytes(user.totalFileSize)}</TableCell>
                  <TableCell>{user.credentialCount}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          disabled={isDeletingUser === user.username || authIsLoading}
                        >
                          {isDeletingUser === user.username ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 h-4 w-4" />
                          )}
                          Delete User Data
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you absolutely sure you want to delete all data for user "{user.username}"?
                            This action is irreversible and will remove their login credentials, encrypted files,
                            and any other associated information from this browser's local storage.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeletingUser === user.username}>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(user.username)}
                            disabled={isDeletingUser === user.username}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          >
                            {isDeletingUser === user.username && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, Delete All Data
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center border-t pt-6">
        <Button variant="outline" onClick={fetchUsers} disabled={totalLoading}>
          <Loader2 className={`mr-2 h-4 w-4 ${totalLoading ? 'animate-spin' : 'hidden'}`} />
          Refresh User List
        </Button>
        <Button asChild variant="ghost" className="text-primary hover:text-primary/80">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Vault Login
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
