import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface FileUploadAreaProps {
  onDrop: (acceptedFiles: File[]) => void;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onDrop }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100MB max size
  });

  return (
    <div className="mt-8">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all mb-4 bg-card shadow-sm relative overflow-hidden ${
          isDragActive
            ? "border-primary bg-accent scale-[0.99]"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-3 relative z-10">
          <div className={`p-4 rounded-full bg-accent transition-transform ${isDragActive ? 'scale-110' : ''}`}>
            <Upload size={36} className={`transition-colors ${isDragActive ? 'text-primary' : 'text-primary/70'}`} />
          </div>
          <h3 className="text-lg font-medium mt-2 font-mono">
            {isDragActive ? "Drop to share" : "Drag and drop your files here"}
          </h3>
          <p className="text-sm text-muted-foreground mb-2 font-mono">
            or click to select files
          </p>
          <div className="px-4 py-1.5 rounded-full bg-muted text-xs text-muted-foreground font-mono border border-primary/10">
            MAX_SIZE=100MB
          </div>
        </div>
      </div>
    </div>
  );
};
