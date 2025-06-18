
'use client';

import type { FileMetadata } from '@/providers/VaultProvider';
import { useVault } from '@/providers/VaultProvider';
import { Button } from '@/components/ui/button';
import { FileTypeIcon } from '@/components/icons/FileTypeIcon';
import { Download, Trash2, Loader2, Eye } from 'lucide-react';
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
import { useState, useEffect } from 'react';
import { FilePreviewModal } from './FilePreviewModal';

interface FileItemProps {
  file: FileMetadata;
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const SUPPORTED_PREVIEW_TYPES = ['image/', 'text/plain', 'application/pdf', 'text/markdown', 'text/html', 'text/css', 'text/javascript', 'application/json'];

function isPreviewSupported(fileType: string): boolean {
  return SUPPORTED_PREVIEW_TYPES.some(type => fileType.startsWith(type));
}

function safeFormatDate(dateInput: string | undefined, formatString: string): string {
  if (!dateInput) return 'Date N/A';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  try {
    return format(date, formatString);
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'Date Error';
  }
}

export function FileItem({ file }: FileItemProps) {
  const { downloadFile, deleteFile, isLoading: vaultIsLoading } = useVault();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState<{ url: string; type: string; name: string } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    let currentUrl = previewContent?.url;
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [previewContent?.url]);


  const handleDownload = async () => {
    setIsDownloading(true);
    const downloaded = await downloadFile(file.id);
    if (downloaded) {
      const url = URL.createObjectURL(downloaded.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloaded.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setIsDownloading(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await deleteFile(file.id);
  };

  const handlePreview = async () => {
    if (!isPreviewSupported(file.type)) return;
    setIsPreviewing(true);
    setPreviewError(null);
    
    if (previewContent?.url) {
        URL.revokeObjectURL(previewContent.url);
    }

    const decryptedFile = await downloadFile(file.id);
    if (decryptedFile) {
      const objectUrl = URL.createObjectURL(decryptedFile.blob);
      setPreviewContent({ url: objectUrl, type: decryptedFile.blob.type, name: decryptedFile.name });
      setShowPreviewModal(true);
    } else {
      setPreviewError("Could not load file for preview.");
      setShowPreviewModal(true);
    }
    setIsPreviewing(false);
  };

  const currentActionLoading = vaultIsLoading || isDownloading || isDeleting || isPreviewing;
  const canPreview = isPreviewSupported(file.type);

  return (
    <>
      <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 animate-slide-in">
        <div className="flex items-center space-x-3 overflow-hidden">
          <FileTypeIcon fileType={file.type} fileName={file.name} className="h-8 w-8 text-primary shrink-0" />
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate text-foreground" title={file.name}>{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(file.size)} &bull; Added: {safeFormatDate(file.createdAt, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1 shrink-0">
          {canPreview && (
            <Button variant="ghost" size="icon" onClick={handlePreview} disabled={currentActionLoading} aria-label="Preview file">
              {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4 text-primary" />}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleDownload} disabled={currentActionLoading} aria-label="Download file">
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-primary" />}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" disabled={currentActionLoading} aria-label="Delete file">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin text-destructive" /> : <Trash2 className="h-4 w-4 text-destructive" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the file "{file.name}" from your vault.
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
      {showPreviewModal && (
        <FilePreviewModal
          isOpen={showPreviewModal}
          onClose={() => {
            setShowPreviewModal(false);
            if (previewContent?.url) {
                URL.revokeObjectURL(previewContent.url);
            }
            setPreviewContent(null);
            setPreviewError(null);
          }}
          content={previewContent}
          error={previewError}
        />
      )}
    </>
  );
}
