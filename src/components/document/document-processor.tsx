"use client";

import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { extractDocumentContent, type ProcessedDocument } from '@/lib/document-processing/document-utils';
import type { FileWithPreview } from '@/components/document/file-uploader';

interface DocumentProcessorProps {
  file: FileWithPreview;
  onComplete: (document: ProcessedDocument) => void;
  onError: (error: string) => void;
}

export function DocumentProcessor({ file, onComplete, onError }: DocumentProcessorProps) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Processing document...');

  useEffect(() => {
    let isMounted = true;

    const processDocument = async () => {
      // Manual progress animation for visual feedback, independent of actual processing time
      const updateProgressAnimation = () => {
        let currentProgress = 0;
        const interval = setInterval(() => {
          if (!isMounted) {
            clearInterval(interval);
            return;
          }

          currentProgress += 1;
          if (currentProgress <= 95) {
            setProgress(currentProgress);
          } else {
            clearInterval(interval);
          }
        }, 50);

        return () => clearInterval(interval);
      };

      const cleanupAnimation = updateProgressAnimation();

      try {
        // Processing stages
        setProgress(10);
        setStatusText('Detecting document format...');

        setProgress(25);
        setStatusText(`Extracting ${file.extension.toUpperCase()} content...`);

        // Extract document content - actual processing
        const result = await extractDocumentContent(file);

        if (!isMounted) return;

        if (result.success && result.document) {
          setProgress(100);
          setStatusText('Completed!');
          onComplete(result.document);
        } else {
          throw new Error(result.error || 'An unknown error occurred');
        }
      } catch (error) {
        if (!isMounted) return;
        setStatusText('Processing failed!');
        onError(error instanceof Error ? error.message : 'An error occurred while processing the document');
      } finally {
        cleanupAnimation();
      }
    };

    processDocument();

    return () => {
      isMounted = false;
    };
  }, [file, onComplete, onError]);

  return (
    <div className="space-y-2 w-full">
      <div className="flex flex-col space-y-1.5">
        <div className="flex justify-between text-sm">
          <span>{statusText}</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
    </div>
  );
} 