import {
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  FileAudio,
  Archive,
  FileQuestion,
  File as GenericFileIcon,
  FileCode,
  FileSpreadsheet,
  FileDigit,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface FileTypeIconProps extends LucideProps {
  fileType: string;
  fileName?: string;
}

export function FileTypeIcon({ fileType, fileName, ...props }: FileTypeIconProps) {
  if (fileType.startsWith('image/')) {
    return <ImageIcon {...props} />;
  }
  if (fileType.startsWith('video/')) {
    return <VideoIcon {...props} />;
  }
  if (fileType.startsWith('audio/')) {
    return <FileAudio {...props} />;
  }
  if (fileType.startsWith('text/')) {
    if (fileName?.endsWith('.json')) return <FileCode {...props} />;
    if (fileName?.endsWith('.csv')) return <FileSpreadsheet {...props} />;
    return <FileText {...props} />;
  }
  if (fileType === 'application/pdf') {
    return <FileText {...props} />;
  }
  if (fileType === 'application/zip' || fileType === 'application/x-rar-compressed' || fileType === 'application/x-7z-compressed' || fileType === 'application/gzip' || fileType === 'application/x-tar') {
    return <Archive {...props} />;
  }
  if (fileType === 'application/msword' || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return <FileText {...props} />;
  }
  if (fileType === 'application/vnd.ms-excel' || fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
    return <FileSpreadsheet {...props} />;
  }
  if (fileType === 'application/vnd.ms-powerpoint' || fileType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return <FileDigit {...props} />; // Using FileDigit as a placeholder, could use a presentation icon if available.
  }
   if (fileType.includes('javascript') || fileType.includes('typescript') || fileType.includes('html') || fileType.includes('css') || fileType.includes('python')) {
    return <FileCode {...props} />;
  }

  // Fallback icons
  if(fileType === '' && !fileName) { // No info
    return <FileQuestion {...props} />;
  }
  return <GenericFileIcon {...props} />;
}
