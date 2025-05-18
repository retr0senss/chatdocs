"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLastProcessedDocumentId,
  getDocumentById,
} from "./document-storage";
import type { ProcessedDocument } from "./document-utils";

/**
 * Retrieves the last processed document from the database
 * @returns The last processed document, loading state, and error
 */
export function useLastDocument() {
  const [document, setDocument] = useState<ProcessedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLastDocument = useCallback(async () => {
    try {
      setIsLoading(true);
      const lastDocumentId = getLastProcessedDocumentId();

      if (lastDocumentId) {
        const doc = await getDocumentById(lastDocumentId);
        if (doc) {
          setDocument(doc);
        } else {
          setDocument(null);
        }
      } else {
        setDocument(null);
      }

      setError(null);
    } catch (err) {
      console.error("Error loading last document:", err);
      setError("Error loading last document.");
      setDocument(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetDocument = useCallback(() => {
    setDocument(null);
  }, []);

  useEffect(() => {
    loadLastDocument();
  }, [loadLastDocument]);

  return {
    document,
    isLoading,
    error,
    resetDocument,
    reloadDocument: loadLastDocument,
  };
}
