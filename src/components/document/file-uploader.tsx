"use client";

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadIcon, FileTextIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export type FileWithPreview = File & {
  preview: string;
  extension: string;
};

type FileUploaderProps = {
  onFileSelect: (file: FileWithPreview | null) => void;
};

export function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [file, setFile] = useState<FileWithPreview | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const selectedFile = acceptedFiles[0];

      const fileWithPreview = Object.assign(selectedFile, {
        preview: URL.createObjectURL(selectedFile),
        extension: selectedFile.name.split('.').pop()?.toLowerCase() || '',
      }) as FileWithPreview;

      setFile(fileWithPreview);
      onFileSelect(fileWithPreview);
      toast.success(`${selectedFile.name} successfully uploaded`);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
  });

  const removeFile = () => {
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
    onFileSelect(null);
  };

  React.useEffect(() => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];

      if (rejection.errors.some(e => e.code === 'file-too-large')) {
        toast.error(`File is too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB can be uploaded.`);
      } else if (rejection.errors.some(e => e.code === 'file-invalid-type')) {
        toast.error('Unsupported file type. Please upload a PDF, TXT or MD file.');
      } else {
        toast.error('An error occurred while uploading the file.');
      }
    }
  }, [fileRejections]);

  React.useEffect(() => {
    return () => {
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
    };
  }, [file]);

  return (
    <div className="w-full">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-700'
            }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center gap-4">
            <UploadIcon className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">Upload your file here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to select a file</p>
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, TXT and MD files (max: 50MB)
            </p>
          </div>
        </div>
      ) : (
        <Card className="p-6 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={removeFile}
          >
            <XIcon className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <FileTextIcon className="h-12 w-12 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-base font-medium truncate text-left">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB • {file.extension.toUpperCase()}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 