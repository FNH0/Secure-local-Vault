
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: { url: string; type: string; name: string } | null;
  error: string | null;
}

export function FilePreviewModal({ isOpen, onClose, content, error }: FilePreviewModalProps) {
  const renderContent = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-destructive">
          <AlertTriangle className="h-12 w-12 mb-4" />
          <p className="text-lg font-semibold">Preview Error</p>
          <p>{error}</p>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p>Loading preview...</p>
        </div>
      );
    }

    const { url, type, name } = content;

    if (type.startsWith('image/')) {
      return <img src={url} alt={`Preview of ${name}`} className="max-w-full max-h-[70vh] object-contain rounded-md shadow-md" />;
    }
    if (type === 'application/pdf') {
      // Using <iframe> for PDFs is generally more robust than <embed> or <object> for modern browsers
      return <iframe src={url} title={`Preview of ${name}`} className="w-full h-[75vh] border-0 rounded-md shadow-md" />;
    }
    // For text based types, try fetching and displaying.
    // Note: This requires the blob URL to have appropriate CORS headers if it were a remote URL,
    // but for local Blob URLs, it should work.
    // A more robust solution for various text types might involve a specific text viewer component.
    if (type.startsWith('text/')) {
        // To display text content from a blob URL, we'd typically fetch it.
        // However, for simplicity and to avoid async operations directly in render,
        // if it's text, we might assume the `downloadFile` could eventually return text directly or Blob for text.
        // For now, let's indicate it's a text file and link it. A direct display would be more complex.
        // A simple approach for text files:
         return (
             <iframe src={url} title={`Preview of ${name}`} className="w-full h-[75vh] border-0 rounded-md shadow-md bg-background" />
         );
    }


    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertTriangle className="h-12 w-12 mb-4 text-muted-foreground" />
        <p className="text-lg font-semibold">Unsupported File Type</p>
        <p className="text-muted-foreground">Preview is not available for "{name}" ({type}).</p>
         <Button variant="outline" size="sm" className="mt-4" onClick={() => {
            const a = document.createElement('a');
            a.href = url;
            a.download = name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            // URL.revokeObjectURL(url) is handled by FileItem on modal close
        }}>Download File</Button>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl w-auto p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="truncate">Preview: {content?.name || 'File'}</DialogTitle>
          {content && <DialogDescription className="text-xs text-muted-foreground">{content.type} - {content.name}</DialogDescription>}
        </DialogHeader>
        <div className="p-6 pt-0 max-h-[80vh] overflow-auto">
          {renderContent()}
        </div>
        <DialogFooter className="p-6 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
