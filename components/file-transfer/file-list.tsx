import React from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileIcon, Copy, Check, File, FileText, Image } from 'lucide-react';

// Update the FileItem interface to include id as string and add fileId
export interface FileItem {
  id: number | string;
  name: string;
  size: number;
  type: string;
  timestamp: string;
  fileId?: string; // Codex file ID
  isUploading?: boolean; // Whether the file is currently being uploaded
  progress?: number; // Upload progress percentage
}

interface FileListProps {
  files: FileItem[];
  type: 'sent' | 'received';
  copiedFileCid: string | null;
  handleCopyFileCid: (fileId: string) => void;
  handleDownloadFile: (fileId: string) => void;
}

const getFileIcon = (fileType: string) => {
  if (fileType.includes('image')) {
    return <Image size={24} />;
  } else if (fileType.includes('pdf')) {
    return <FileText size={24} />;
  } else if (fileType.includes('spreadsheet') || fileType.includes('excel') || fileType.includes('xlsx')) {
    return <FileText size={24} />;
  } else if (fileType.includes('presentation') || fileType.includes('powerpoint') || fileType.includes('pptx')) {
    return <FileText size={24} />;
  } else if (fileType.includes('zip') || fileType.includes('archive')) {
    return <File size={24} />;
  } else {
    return <FileIcon size={24} />;
  }
};

export const FileList: React.FC<FileListProps> = ({
  files,
  type,
  copiedFileCid,
  handleCopyFileCid,
  handleDownloadFile,
}) => {
  const NoFilesContent = () => (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="p-3 rounded-full bg-muted/50">
        {type === 'sent' ? (
          <Upload size={24} className="text-muted-foreground/60" />
        ) : (
          <Download size={24} className="text-muted-foreground/60" />
        )}
      </div>
      <p className="text-muted-foreground font-mono mt-3">No files {type === 'sent' ? 'sent' : 'received'} yet</p>
      <p className="text-xs text-muted-foreground/70 font-mono mt-1">
        {type === 'sent' ? 'Upload files to see them here' : 'Received files will appear here'}
      </p>
    </div>
  );

  if (files.length === 0) {
    return <NoFilesContent />;
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors w-full">
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <div className={`p-2 rounded-md bg-card text-primary shadow-sm border border-border flex-shrink-0 ${file.isUploading ? 'animate-pulse' : ''}`}>
              {getFileIcon(file.type)}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm font-mono truncate">{file.name}</p>
                {file.isUploading && (
                  <div className="flex items-center gap-1 text-xs text-primary animate-pulse">
                    <span className="font-mono">{file.progress}%</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {file.size.toFixed(2)} MB • {file.isUploading ? 'Uploading...' : file.timestamp}
              </p>
              {file.isUploading && (
                <div className="w-full bg-muted rounded-full h-1 mt-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-300 ease-in-out"
                    style={{ width: `${file.progress}%` }}
                  ></div>
                </div>
              )}
              {type === 'received' && file.fileId && (
                <p className="text-xs text-primary/70 font-mono truncate" title={file.fileId}>
                  CID: {file.fileId.substring(0, 0)}...{file.fileId.substring(file.fileId.length - 6)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {!file.isUploading && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopyFileCid(file.id.toString())}
                  className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary text-accent-foreground border border-primary/20 transition-all relative group"
                  disabled={!file.fileId}
                  title={file.fileId ? "Copy file CID" : "No CID available"}
                >
                  {copiedFileCid === file.id.toString() ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Copy CID
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownloadFile(file.id.toString())}
                  className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary text-accent-foreground border border-primary/20 transition-all relative group"
                  disabled={!file.fileId}
                  title={file.fileId ? "Download file" : "No file available for download"}
                >
                  <Download size={14} />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    Download File
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
