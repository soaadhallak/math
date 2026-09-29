import { useState, useEffect, useCallback } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

interface ImagePreviewCellProps {
  /** Image URL (relative path or full URL) */
  src: string;
  alt?: string;
  /** ClassName for the thumbnail only */
  thumbClassName?: string;
}

/**
 * Table cell content: clickable thumbnail that opens a lightbox (magnific-popup style) preview.
 * Use in AdminTable columns for any image list.
 */
export default function ImagePreviewCell({
  src,
  alt = "",
  thumbClassName = "w-20 h-12 object-cover rounded cursor-pointer hover:opacity-90",
}: ImagePreviewCellProps) {
  const [open, setOpen] = useState(false);
  const imageUrl =
    src.startsWith("http") || src.startsWith("data:")
      ? src
      : `${API_BASE_URL}${src.startsWith("/") ? src : `/${src}`}`;

  const handleClose = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleClose]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block focus:outline-none focus:ring-2 focus:ring-brand-500/50 rounded"
        title="Click to preview"
      >
        <img
          src={imageUrl}
          alt={alt}
          className={thumbClassName}
          loading="lazy"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <img
            src={imageUrl}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
