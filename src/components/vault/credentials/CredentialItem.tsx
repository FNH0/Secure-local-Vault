
'use client';

import type { CredentialMetadata, PasswordCredentialContentStructure } from '@/providers/VaultProvider';
import { useVault } from '@/providers/VaultProvider';
import { Button } from '@/components/ui/button';
import { KeyRound, Eye, Trash2, Loader2, Pencil } from 'lucide-react';
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
import { EditCredentialModal } from './EditCredentialModal';
import { Badge } from '@/components/ui/badge';

interface CredentialItemProps {
  credential: CredentialMetadata;
}

export function CredentialItem({ credential }: CredentialItemProps) {
  const { getDecryptedCredentialContent, deleteCredential, isLoadingCredentials } = useVault();
  const [isViewing, setIsViewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreparingEdit, setIsPreparingEdit] = useState(false);
  
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [decryptedContentForView, setDecryptedContentForView] = useState<string | PasswordCredentialContentStructure | null>(null);
  const [decryptedContentForEdit, setDecryptedContentForEdit] = useState<string | PasswordCredentialContentStructure | null>(null);
  
  const [viewError, setViewError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);


  const handleView = async () => {
    setIsViewing(true);
    setViewError(null);
    setDecryptedContentForView(null);
    
    const content = await getDecryptedCredentialContent(credential.id);
    if (content !== null) {
      setDecryptedContentForView(content);
    } else {
      setViewError("Could not decrypt credential content for viewing.");
    }
    setShowViewModal(true);
    setIsViewing(false);
  };

  const handlePrepareEdit = async () => {
    setIsPreparingEdit(true);
    setEditError(null);
    setDecryptedContentForEdit(null);

    const content = await getDecryptedCredentialContent(credential.id);
    if (content !== null) {
      setDecryptedContentForEdit(content);
    } else {
      setEditError("Could not load credential content for editing. You can still modify name/type or provide new content.");
      // Pass null content to modal, modal will handle display of error and allow editing fields.
    }
    setShowEditModal(true);
    setIsPreparingEdit(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteCredential(credential.id);
    // State update handled by VaultProvider, which will remove item from list.
  };
  
  const currentActionLoading = isLoadingCredentials || isViewing || isDeleting || isPreparingEdit;

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
          <Button variant="ghost" size="icon" onClick={handlePrepareEdit} disabled={currentActionLoading} aria-label="Edit credential">
            {isPreparingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pencil className="h-4 w-4 text-primary" />}
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
            setDecryptedContentForView(null); // Clear content when modal closes
            setViewError(null);
          }}
          credentialName={credential.name}
          credentialType={credential.type}
          decryptedContent={decryptedContentForView}
          error={viewError}
        />
      )}

      {showEditModal && (
        <EditCredentialModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setDecryptedContentForEdit(null); // Clear content when modal closes
            setEditError(null);
          }}
          credential={{...credential, content: decryptedContentForEdit}} // Pass potentially null content if error
          error={editError}
        />
      )}
    </>
  );
}
