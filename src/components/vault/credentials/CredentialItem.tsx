
'use client';

import type { CredentialMetadata } from '@/providers/VaultProvider';
import { useVault } from '@/providers/VaultProvider';
import { Button } from '@/components/ui/button';
import { KeyRound, Eye, Trash2, Loader2, Pencil } from 'lucide-react'; // Added Pencil
import { format } from 'date-fns';
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
import { useState } from 'react';
import { ViewCredentialModal } from './ViewCredentialModal';
import { EditCredentialModal } from './EditCredentialModal'; // To be created
import { Badge } from '@/components/ui/badge';

interface CredentialItemProps {
  credential: CredentialMetadata;
}

export function CredentialItem({ credential }: CredentialItemProps) {
  const { getDecryptedCredentialContent, deleteCredential, isLoadingCredentials } = useVault();
  const [isViewing, setIsViewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // For fetching content before edit modal
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [decryptedContentForView, setDecryptedContentForView] = useState<string | null>(null);
  const [decryptedContentForEdit, setDecryptedContentForEdit] = useState<string | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);


  const handleView = async () => {
    setIsViewing(true);
    setViewError(null);
    setDecryptedContentForView(null);
    
    const content = await getDecryptedCredentialContent(credential.id);
    if (content) {
      setDecryptedContentForView(content);
    } else {
      setViewError("Could not decrypt credential content for viewing.");
    }
    setShowViewModal(true);
    setIsViewing(false);
  };

  const handleEdit = async () => {
    setIsEditing(true);
    setEditError(null);
    setDecryptedContentForEdit(null);

    const content = await getDecryptedCredentialContent(credential.id);
    if (content !== null) {
      setDecryptedContentForEdit(content);
      setShowEditModal(true);
    } else {
      setEditError("Could not load credential content for editing.");
      // Optionally, still show the modal to display the error or prevent modal opening.
      // For now, we'll prevent modal if content fetch fails.
      // Consider adding a toast message here.
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteCredential(credential.id);
    // Deletion is handled by VaultProvider, toast included there.
    // State update will remove item from list.
  };
  
  const currentActionLoading = isLoadingCredentials || isViewing || isDeleting || isEditing;

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 animate-slide-in">
        <div className="flex items-center space-x-3 overflow-hidden">
          <KeyRound className="h-8 w-8 text-primary shrink-0" />
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate text-foreground" title={credential.name}>{credential.name}</p>
            <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">{credential.type}</Badge>
                <p className="text-xs text-muted-foreground">
                    Added: {format(new Date(credential.createdAt), "MMM d, yyyy")}
                </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          <Button variant="ghost" size="icon" onClick={handleEdit} disabled={currentActionLoading} aria-label="Edit credential">
            {isEditing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4 text-primary" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleView} disabled={currentActionLoading} aria-label="View credential">
            {isViewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 text-primary" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={currentActionLoading} aria-label="Delete credential">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the credential "{credential.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {showViewModal && (
        <ViewCredentialModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setDecryptedContentForView(null);
            setViewError(null);
          }}
          credentialName={credential.name}
          credentialType={credential.type}
          decryptedContent={decryptedContentForView}
          error={viewError}
        />
      )}
      {showEditModal && decryptedContentForEdit !== null && (
        <EditCredentialModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setDecryptedContentForEdit(null);
            setEditError(null);
          }}
          credential={{...credential, content: decryptedContentForEdit}}
          error={editError}
        />
      )}
       {showEditModal && decryptedContentForEdit === null && editError && ( // Handle error case for edit modal
         <EditCredentialModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setDecryptedContentForEdit(null);
            setEditError(null);
          }}
          credential={credential} // Pass original credential if content fetch failed
          error={editError} // Pass the error to the modal
        />
      )}
    </>
  );
}
