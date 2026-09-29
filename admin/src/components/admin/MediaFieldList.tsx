import { useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Checkbox from "../form/input/Checkbox";
import Button from "../ui/button/Button";
import { apiService, MAX_IMAGE_UPLOAD_BYTES, isAllowedImageFile } from "../../services/api";
import { MEDIA_KEY_MAX, MEDIA_SRC_MAX } from "../../lib/schemaLimits";
import { normalizeMediaKey } from "../../lib/slug";
import ImagePreviewCell from "./ImagePreviewCell";
import { supportedLocales } from "../../../../shared/schemas/commonSchemas.js";

function getAvailableLocales(): string[] {
  const raw = import.meta.env.VITE_AVAILABLE_LOCALES;
  if (typeof raw !== "string" || !raw.trim()) return [...supportedLocales];
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [...supportedLocales];
}

/** Same as backend: key used in project_translations for media captions (field = this). */
function effectiveMediaKey(key: string, index: number): string {
  const raw = normalizeMediaKey(key, MEDIA_KEY_MAX);
  return raw || `media-${index + 1}`;
}

interface MediaItem {
  key: string;
  src: string;
  isVideo: boolean;
  sort?: number;
}

interface MediaFieldListProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  /** Get caption for a locale; field = effective media key (used in project_translations). */
  getTranslationValue?: (locale: string, field: string) => string;
  /** Update caption for a locale; field = effective media key. */
  updateTranslation?: (locale: string, field: string, value: string) => void;
  locales?: string[];
}

export default function MediaFieldList({
  media,
  onChange,
  getTranslationValue,
  updateTranslation,
  locales: localesProp,
}: MediaFieldListProps) {
  const [uploading, setUploading] = useState<number | null>(null);
  const locales = localesProp ?? getAvailableLocales();
  const [activeLocale, setActiveLocale] = useState(locales[0]);
  const hasI18n = Boolean(getTranslationValue && updateTranslation);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  
  const getMediaUrl = (src: string) => {
    if (src.startsWith('http')) return src;
    return `${API_BASE_URL}${src.startsWith('/') ? src : `/${src}`}`;
  };

  /** Convert YouTube (and similar) URLs to embed-friendly URLs so iframe preview works. */
  const getVideoEmbedUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    const fullUrl = trimmed.startsWith('http') ? trimmed : getMediaUrl(trimmed);
    // YouTube: watch?v=, /v/, youtu.be/, or already /embed/
    const ytWatch = fullUrl.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    const ytV = fullUrl.match(/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/);
    const ytShort = fullUrl.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const ytEmbed = fullUrl.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    const id = ytWatch?.[1] ?? ytV?.[1] ?? ytShort?.[1] ?? ytEmbed?.[1];
    if (id) return `https://www.youtube.com/embed/${id}`;
    return fullUrl;
  };

  const handleFileUpload = async (
    file: File,
    index: number
  ) => {
    setUploading(index);
    try {
      const result = await apiService.uploadFile(file);
      const path = result.file?.path || result.path || result;
      const updated = [...media];
      updated[index].src = path;
      onChange(updated);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const addMedia = () => {
    onChange([...media, { key: '', src: '', isVideo: false, sort: 0 }]);
  };

  const removeMedia = (index: number) => {
    const updated = media.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateMedia = (index: number, field: keyof MediaItem, value: string | number | boolean) => {
    const updated = [...media];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Media</Label>
        <Button type="button" size="sm" onClick={addMedia}>
          Add Media
        </Button>
      </div>

      {media.map((item, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg dark:border-gray-800 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Media #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeMedia(index)}
              className="text-error-500 hover:text-error-600 text-sm"
            >
              Remove
            </button>
          </div>

          <div>
            <Label>Key</Label>
            <Input
              value={item.key}
              onChange={(e) =>
                updateMedia(index, "key", normalizeMediaKey(e.target.value, MEDIA_KEY_MAX))
              }
              placeholder="Media key"
              maxLength={MEDIA_KEY_MAX}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={item.isVideo}
              onChange={(checked) => updateMedia(index, 'isVideo', checked)}
            />
            <Label className="!mb-0">Is Video</Label>
          </div>

          <div>
            <Label>{item.isVideo ? "Video URL (e.g. YouTube)" : "File"}</Label>
            {item.isVideo ? (
              <Input
                value={item.src}
                onChange={(e) => updateMedia(index, 'src', e.target.value.slice(0, MEDIA_SRC_MAX))}
                placeholder="https://www.youtube.com/watch?v=*********"
                maxLength={MEDIA_SRC_MAX}
              />
            ) : (
              <>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg,.webp,.bmp,.ico,.avif,image/jpeg,image/png,image/svg+xml,image/webp,image/bmp,image/x-icon,image/avif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
                      alert(`Image size must not exceed 2 MB. This file is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`);
                      e.target.value = '';
                      return;
                    }
                    if (!isAllowedImageFile(file)) {
                      alert('Invalid file type. Allowed: JPG, JPEG, PNG, SVG, WEBP, BMP, ICO, AVIF.');
                      e.target.value = '';
                      return;
                    }
                    handleFileUpload(file, index);
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-900/20 dark:file:text-brand-400"
                  disabled={uploading === index}
                />
                {uploading === index && (
                  <p className="mt-1 text-sm text-gray-500">Uploading...</p>
                )}
              </>
            )}
            {item.src && (
              <div className="mt-2">
                {item.isVideo ? (
                  <div className="max-w-xs rounded overflow-hidden bg-black">
                    <iframe
                      src={getVideoEmbedUrl(item.src)}
                      title="Video preview"
                      className="w-full aspect-video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <ImagePreviewCell
                    src={item.src}
                    alt={item.key}
                    thumbClassName="max-w-xs rounded cursor-pointer hover:opacity-90"
                  />
                )}
              </div>
            )}
          </div>

          {hasI18n && (
            <div>
              <Label>Caption (per language)</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-2">
                Key &quot;{effectiveMediaKey(item.key, index)}&quot; is used in project_translations for this media.
              </p>
              <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 mb-2">
                {locales.map((locale) => (
                  <button
                    key={locale}
                    type="button"
                    onClick={() => setActiveLocale(locale)}
                    className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                      activeLocale === locale
                        ? 'border-brand-500 text-brand-500'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {locale.toUpperCase()}
                  </button>
                ))}
              </div>
              <Input
                value={getTranslationValue!(activeLocale, effectiveMediaKey(item.key, index))}
                onChange={(e) =>
                  updateTranslation!(activeLocale, effectiveMediaKey(item.key, index), e.target.value)
                }
                placeholder={`Caption in ${activeLocale.toUpperCase()}`}
              />
            </div>
          )}

          <div>
            <Label>Sort Order</Label>
            <Input
              type="number"
              value={item.sort || 0}
              onChange={(e) =>
                updateMedia(index, 'sort', parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>
      ))}

      {media.length === 0 && (
        <p className="text-sm text-gray-500">No media added. Click "Add Media" to add files.</p>
      )}
    </div>
  );
}
