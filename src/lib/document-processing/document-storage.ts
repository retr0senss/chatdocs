import { openDB, DBSchema } from "idb";
import type { ProcessedDocument } from "./document-utils";

interface DocumentsDB extends DBSchema {
  documents: {
    key: string;
    value: ProcessedDocument;
    indexes: { "by-date": Date };
  };
}

const DB_NAME = "chat-with-docs-db";
const DB_VERSION = 1;
const DOCUMENTS_STORE = "documents";

async function createDatabase() {
  return openDB<DocumentsDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const documentStore = db.createObjectStore(DOCUMENTS_STORE, {
        keyPath: "id",
      });
      documentStore.createIndex("by-date", "createdAt");
    },
  });
}

export async function saveDocument(document: ProcessedDocument): Promise<void> {
  try {
    const db = await createDatabase();

    const existingDocById = await db.get(DOCUMENTS_STORE, document.id);

    if (existingDocById) {
      console.log("Document with same ID is being updated:", document.id);
      await db.put(DOCUMENTS_STORE, document);
      return;
    }

    const allDocs = await getAllDocuments();
    const existingDocByName = allDocs.find(
      (doc) => doc.name === document.name && doc.id !== document.id
    );

    if (existingDocByName) {
      const timestamp = new Date().toLocaleTimeString().replace(/:/g, "-");
      document.name = `${document.name} (${timestamp})`;
      console.log("Document name changed, new name:", document.name);
    }

    await db.put(DOCUMENTS_STORE, document);
    console.log("Document saved successfully:", document.id);
  } catch (error) {
    console.error("Document could not be saved:", error);
    throw new Error("Document could not be saved to the database");
  }
}

export async function getDocumentById(
  id: string
): Promise<ProcessedDocument | undefined> {
  try {
    const db = await createDatabase();
    return db.get(DOCUMENTS_STORE, id);
  } catch (error) {
    console.error("Document could not be retrieved:", error);
    return undefined;
  }
}

export async function getAllDocuments(): Promise<ProcessedDocument[]> {
  try {
    const db = await createDatabase();
    const allDocs = await db.getAllFromIndex(DOCUMENTS_STORE, "by-date");

    const uniqueDocMap = new Map<string, ProcessedDocument>();

    allDocs.forEach((doc) => {
      uniqueDocMap.set(doc.id, doc);
    });

    return Array.from(uniqueDocMap.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Documents could not be retrieved:", error);
    return [];
  }
}

export function saveLastProcessedDocumentId(documentId: string): void {
  try {
    localStorage.setItem("lastProcessedDocumentId", documentId);
  } catch (error) {
    console.error("Last processed document ID could not be saved:", error);
  }
}

export function getLastProcessedDocumentId(): string | null {
  try {
    return localStorage.getItem("lastProcessedDocumentId");
  } catch (error) {
    console.error("Last processed document ID could not be retrieved:", error);
    return null;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const db = await createDatabase();

    const existingDoc = await db.get(DOCUMENTS_STORE, id);
    if (!existingDoc) {
      console.warn("Document to be deleted not found:", id);
      return;
    }

    console.log("Document being deleted:", id, existingDoc.name);

    await db.delete(DOCUMENTS_STORE, id);
    console.log("Document deleted successfully:", id);

    const lastProcessedId = getLastProcessedDocumentId();
    if (lastProcessedId === id) {
      localStorage.removeItem("lastProcessedDocumentId");
      console.log("Last processed document ID record deleted");
    }

    const remainingDocs = await getAllDocuments();
    console.log("Remaining documents:", remainingDocs.length);
  } catch (error) {
    console.error("Document could not be deleted:", error);
    throw new Error("Document could not be deleted from the database");
  }
}

export async function clearAllDocuments(): Promise<void> {
  try {
    const db = await createDatabase();
    await db.clear(DOCUMENTS_STORE);
    localStorage.removeItem("lastProcessedDocumentId");
  } catch (error) {
    console.error("Documents could not be cleared:", error);
    throw new Error("Documents could not be cleared from the database");
  }
}
