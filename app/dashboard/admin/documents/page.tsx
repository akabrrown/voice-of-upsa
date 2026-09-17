"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen, Plus, Trash2, FileText, Download, Loader2, X, UploadCloud } from "lucide-react";
import { toast } from "react-hot-toast";
import { TableShadowLoader } from "@/components/ui/shadow-loaders";

interface DocumentItem {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size_bytes: number;
  created_at: string;
}

export default function DocumentsAdminPage() {
  const supabase = createClient();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("official_documents")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load documents: " + error.message);
      console.error("fetchDocuments error:", error);
    } else {
      setDocuments(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      toast.error("Please provide a title and select a file.");
      return;
    }

    const MAX_FILE_SIZE_MB = 100;
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    setIsUploading(true);
    const loadingToastId = toast.loading("Uploading document to storage...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title);
      if (description) formData.append("description", description);

      const uploadRes = await fetch("/api/upload/document", {
        method: "POST",
        body: formData,
      });

      const responseData = await uploadRes.json().catch(() => ({}));

      if (!uploadRes.ok) {
        throw new Error(responseData.error || "Failed to upload document.");
      }

      toast.dismiss(loadingToastId);
      toast.success("Document uploaded successfully!");
      setIsUploadModalOpen(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      toast.dismiss(loadingToastId);
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    const deleteToastId = toast.loading("Deleting document...");
    const { error } = await supabase.from("official_documents").delete().eq("id", id);
    toast.dismiss(deleteToastId);

    if (error) {
      toast.error("Failed to delete document: " + error.message);
    } else {
      toast.success("Document deleted successfully");
      setDocuments(docs => docs.filter(d => d.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-upsa-navy flex items-center">
            <FolderOpen className="mr-3 h-8 w-8 text-upsa-gold" />
            Documents & Reports
          </h1>
          <p className="text-gray-500 mt-1">
            Manage official documents, annual reports, and resources available to the public.
          </p>
        </div>
        <Button 
          onClick={() => setIsUploadModalOpen(true)}
          className="bg-upsa-navy hover:bg-upsa-navy/90 text-white font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <TableShadowLoader rows={5} hasSearch={false} />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
          <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-upsa-navy mb-2">No documents found</h3>
          <p className="text-gray-500 mb-6">Upload your first official document or report to display it on the website.</p>
          <Button onClick={() => setIsUploadModalOpen(true)} variant="outline">
            Upload Now
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider">Type & Size</th>
                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-50 rounded-lg mr-4">
                        <FileText className="h-5 w-5 text-upsa-gold" />
                      </div>
                      <div className="font-bold text-upsa-navy max-w-xs truncate">
                        {doc.title}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell max-w-xs truncate">
                    {doc.description || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">
                        {doc.file_type}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">
                        {(doc.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <a 
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-upsa-navy hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-black text-upsa-navy flex items-center gap-2">
                  <UploadCloud className="h-6 w-6 text-upsa-gold" />
                  Upload Document
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Upload an official publication, annual report, or resource (PDF, DOCX, XLSX up to 100MB).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-upsa-navy">
                  Document Title <span className="text-red-500">*</span>
                </label>
                <Input 
                  required 
                  placeholder="e.g., Annual Financial Report 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-gray-200 focus:border-upsa-navy"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-upsa-navy">Description (Optional)</label>
                <Textarea 
                  placeholder="Brief description of the document or publication..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="border-gray-200 focus:border-upsa-navy"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-upsa-navy">
                  Select File <span className="text-red-500">*</span>
                </label>
                <Input 
                  required 
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  className="cursor-pointer border-gray-200"
                />
                {file && (
                  <div className="space-y-1 mt-1">
                    <p className="text-xs text-green-600 font-semibold">
                      Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                    {file.size > 50 * 1024 * 1024 && (
                      <p className="text-xs text-amber-600 font-medium">
                        ⚠️ File exceeds 50MB. If your Supabase storage is on the Free tier (50MB cap), please compress this document before uploading.
                      </p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400">
                  Supported formats: PDF, DOC, DOCX, XLS, XLSX, CSV (Max 100MB).
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsUploadModalOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isUploading}
                  className="bg-upsa-navy hover:bg-upsa-navy/90 text-white font-bold"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    "Upload Document"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
