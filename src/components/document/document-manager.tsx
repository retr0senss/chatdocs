import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, Trash2Icon, PlusIcon, BookOpenIcon, RefreshCwIcon, TrashIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ProcessedDocument } from "@/lib/document-processing/document-utils";
import { getAllDocuments, deleteDocument, clearAllDocuments } from "@/lib/document-processing/document-storage";
import { toast } from "sonner";

interface DocumentManagerProps {
  currentDocument: ProcessedDocument | null;
  onSelectDocument: (document: ProcessedDocument) => void;
  onDeleteDocument: (documentId: string) => void;
  onAddNewDocument: () => void;
}

export function DocumentManager({
  currentDocument,
  onSelectDocument,
  onDeleteDocument,
  onAddNewDocument,
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  // Reload function
  const refreshDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const docs = await getAllDocuments();
      setDocuments(docs);
      console.log("Documents refreshed:", docs.length, "documents found");
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Could not load documents.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Manual refresh action
  const handleManualRefresh = () => {
    console.log("Manual refresh initiated");
    setLastRefresh(Date.now());
    toast.info("Refreshing document list...");
  };

  // Load all documents and watch for changes
  useEffect(() => {
    refreshDocuments();

    // Refresh data whenever document manager is viewed
    const refreshInterval = setInterval(() => {
      setLastRefresh(Date.now());
    }, 5000); // Trigger refresh every 5 seconds

    return () => clearInterval(refreshInterval);
  }, [refreshDocuments]);

  // Reload documents when lastRefresh changes
  useEffect(() => {
    refreshDocuments();
  }, [lastRefresh, refreshDocuments]);

  // Document deletion process
  const handleDeleteDocument = async (documentId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      await deleteDocument(documentId);
      await refreshDocuments(); // Reload to update the list
      onDeleteDocument(documentId);
      toast.success("Document deleted.");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Could not delete document.");
    }
  };

  // Clear all documents
  const handleClearAllDocuments = async () => {
    if (documents.length === 0) {
      toast.info("No documents to delete");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete all ${documents.length} documents? This action cannot be undone.`)) {
      return;
    }

    try {
      await clearAllDocuments();
      await refreshDocuments();

      // Notify that current document was also cleared
      if (currentDocument) {
        onDeleteDocument(currentDocument.id);
      }

      toast.success("All documents deleted");
    } catch (error) {
      console.error("Error while deleting documents:", error);
      toast.error("Could not delete documents");
    }
  };

  // Determine color based on file extension
  const getExtensionColor = (extension: string) => {
    switch (extension.toLowerCase()) {
      case "pdf":
        return "text-red-500";
      case "txt":
        return "text-blue-500";
      case "md":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <Card className="h-full">
      <CardContent className="p-3 h-full flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium flex items-center">
            <BookOpenIcon className="mr-2 h-4 w-4" />
            My Documents ({documents.length})
          </h3>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManualRefresh}
              title="Refresh List"
              className="h-7 w-7 p-0"
            >
              <RefreshCwIcon className="h-4 w-4" />
            </Button>
            {documents.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllDocuments}
                title="Clear All Documents"
                className="h-7 w-7 p-0 text-destructive"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onAddNewDocument}>
              <PlusIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">New</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No documents yet</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={onAddNewDocument}>
              <PlusIcon className="h-4 w-4 mr-1" />
              <span className="text-xs">Add Document</span>
            </Button>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`flex items-center p-2 rounded-md cursor-pointer hover:bg-muted transition-colors text-sm
                  ${currentDocument?.id === doc.id ? "bg-muted border border-muted-foreground/20" : ""}`}
                  onClick={() => onSelectDocument(doc)}
                >
                  <FileIcon className={`h-4 w-4 mr-2 ${getExtensionColor(doc.extension)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{doc.name}</p>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {doc.extension.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-50 hover:opacity-100 hover:text-destructive"
                    onClick={(e) => handleDeleteDocument(doc.id, e)}
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
} 