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

export function FileItem({ file }: FileItemProps) {
  const { downloadFile, deleteFile, isLoading } = useVault();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    // No need to setIsDeleting(false) if item is removed from list by parent
  };

  const currentActionLoading = isLoading || isDownloading || isDeleting;

  return (
    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 animate-slide-in">
      <div className="flex items-center space-x-3 overflow-hidden">
        <FileTypeIcon fileType={file.type} fileName={file.name} className="h-8 w-8 text-primary shrink-0" />
        <div className="overflow-hidden">
          <p className="text-sm font-medium truncate text-foreground" title={file.name}>{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatBytes(file.size)} &bull; Added: {format(new Date(file.createdAt), "MMM d, yyyy")}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2 shrink-0">
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
  );
}
