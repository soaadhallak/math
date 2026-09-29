import { useState, type ReactNode } from "react";
import Label from "../form/Label";
import {
  apiService,
  MAX_IMAGE_UPLOAD_BYTES,
  isAllowedImageFile,
  isAllowedSvgFile,
} from "../../services/api";
import ImagePreviewCell from "./ImagePreviewCell";

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (path: string) => void;
  required?: boolean;
  hint?: ReactNode;
  /** Restrict uploads to SVG only (service montages). */
  svgOnly?: boolean;
}

export default function ImageUploadField({
  label,
  value,
  onChange,
  required = false,
  hint,
  svgOnly = false,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      alert(`Image size must not exceed 2 MB. This file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
      e.target.value = "";
      return;
    }
    if (svgOnly) {
      if (!isAllowedSvgFile(file)) {
        alert("Service visuals must be SVG only (.svg).");
        e.target.value = "";
        return;
      }
    } else if (!isAllowedImageFile(file)) {
      alert("Invalid file type. Allowed: JPG, JPEG, PNG, SVG, WEBP, BMP, ICO, AVIF.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const result = await apiService.uploadFile(file);
      const path = result.file?.path || result.path || result;
      onChange(path);
    } catch (error: any) {
      alert(error.message || "Upload failed");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const imageUrl =
    preview ||
    (value
      ? value.startsWith("http") || value.startsWith("data:")
        ? value
        : `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`
      : null);

  return (
    <div>
      <Label>
        {label} {required && <span className="text-error-500">*</span>}
      </Label>
      <input
        type="file"
        accept={
          svgOnly
            ? ".svg,image/svg+xml"
            : ".jpg,.jpeg,.png,.svg,.webp,.bmp,.ico,.avif,image/jpeg,image/png,image/svg+xml,image/webp,image/bmp,image/x-icon,image/avif"
        }
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
        disabled={uploading}
      />
      {hint && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 space-y-1">{hint}</div>
      )}
      {uploading && (
        <p className="mt-1 text-sm text-gray-500">Uploading...</p>
      )}
      {imageUrl && (
        <div className="mt-3">
          <ImagePreviewCell
            src={imageUrl}
            alt="Preview"
            thumbClassName="max-w-xs rounded border border-gray-200 dark:border-gray-800 cursor-pointer hover:opacity-90"
          />
        </div>
      )}
    </div>
  );
}
