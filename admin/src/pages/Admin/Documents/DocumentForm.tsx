import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminFormLayout from "../../../components/admin/AdminFormLayout";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { apiService, API_BASE_URL, MAX_DOCUMENT_UPLOAD_BYTES, isAllowedDocumentUploadFile } from "../../../services/api";
import { DOCUMENT_NAME_MAX } from "../../../lib/schemaLimits";
import { DocumentCreateSchema, DocumentUpdateSchema } from "../../../../../shared/schemas/documentSchemas.js";

export default function DocumentForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [src, setSrc] = useState("");
  const [sort, setSort] = useState(0);
  const [uploading, setUploading] = useState(false);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    return error instanceof Error ? error.message : fallback;
  };

  const loadDocument = useCallback(async () => {
    try {
      setLoading(true);
      const doc = await apiService.getDocumentById(parseInt(id!));
      setName(doc.name || "");
      setSrc(doc.src || "");
      setSort(doc.sort ?? 0);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to load document"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEdit) {
      loadDocument();
    }
  }, [isEdit, loadDocument]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
      alert(
        `File size must not exceed 10 MB. This file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      );
      e.target.value = "";
      return;
    }

    if (!isAllowedDocumentUploadFile(file)) {
      alert(
        "Invalid file type. Allowed images: JPG, JPEG, PNG, SVG, WEBP, BMP, ICO, AVIF. Allowed documents: PDF, DOC, DOCX, TXT, PPT, PPTX, XLS, XLSX, CSV, ODT, RTF, MD."
      );
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const result = await apiService.uploadDocumentAsset(file);
      const path =
        typeof result === "string"
          ? result
          : (result as { file?: { path?: string }; path?: string }).file?.path ||
            (result as { path?: string }).path ||
            "";
      setSrc(path || "");
      const normalized = file.name.trim().replace(/\s+/g, " ").slice(0, DOCUMENT_NAME_MAX);
      setName(normalized);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      name: name.trim(),
      src: src.trim(),
      sort: parseInt(sort.toString()) || 0,
    };

    const schema = isEdit ? DocumentUpdateSchema : DocumentCreateSchema;
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ?? "Invalid document data");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await apiService.updateDocument(parseInt(id!), parsed.data);
      } else {
        await apiService.createDocument(parsed.data);
      }

      navigate("/documents");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to save document"));
    } finally {
      setLoading(false);
    }
  };

  const buildUrl = (value: string): string => {
    if (!value) return "";
    const normalizedSrc = value.startsWith("/") ? value : `/${value}`;
    return `${API_BASE_URL}${normalizedSrc}`;
  };

  const effectiveUrl = buildUrl(src);

  return (
    <>
      <PageMeta
        title={(isEdit ? "Edit Document" : "New Document") + " | Admin"}
        description={isEdit ? "Edit document" : "Create new document"}
      />
      <AdminFormLayout
        title={isEdit ? "Edit Document" : "New Document"}
        description={
          isEdit
            ? "Update document information"
            : "Upload a new document and configure its metadata."
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        <div>
          <Label>File</Label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.svg,.webp,.bmp,.ico,.avif,.pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv,.odt,.rtf,.md,image/jpeg,image/png,image/svg+xml,image/webp,image/bmp,image/x-icon,image/avif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,application/vnd.oasis.opendocument.text,application/rtf,text/markdown,text/x-markdown"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
            disabled={uploading}
          />
          {uploading && (
            <p className="mt-1 text-sm text-gray-500">Uploading...</p>
          )}
          {src && (
            <p className="mt-2 text-xs text-gray-500 break-all">
              Stored path: <span className="font-mono">{src}</span>
            </p>
          )}
        </div>

        <div>
          <Label>Name</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, DOCUMENT_NAME_MAX))}
            placeholder="Document name"
            maxLength={DOCUMENT_NAME_MAX}
            required
          />
        </div>

        {effectiveUrl && (
          <div>
            <Label>URL</Label>
            <Input
              type="text"
              value={effectiveUrl}
              disabled
            />
          </div>
        )}

        <div>
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={sort}
            onChange={(e) => setSort(parseInt(e.target.value) || 0)}
          />
        </div>
      </AdminFormLayout>
    </>
  );
}

