import { useMemo } from "react";
import { html as beautifyHtml } from "js-beautify";
import { API_BASE_URL } from "../services/api";

interface JoditUploadResponse {
  success?: boolean;
  message?: string;
  error?: string;
  file?: {
    path?: string;
    mimetype?: string;
  };
  data?: {
    src?: string;
  };
}

interface JoditProcessedData {
  files: string[];
  path: string;
  baseurl: string;
  error: string;
  msg: string;
}

function isImagePath(path: string): boolean {
  return /\.(jpg|jpeg|png|svg|webp|bmp|ico|avif)(\?.*)?$/i.test(path);
}

function toAbsoluteUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

type EditorLike = {
  selection?: {
    insertImage?: (url: string, alt?: string | null, width?: number) => void;
    insertHTML?: (html: string) => void;
  };
  s?: {
    insertImage?: (url: string, alt?: string | null, width?: number) => void;
    insertHTML?: (html: string) => void;
  };
  insertHTML?: (html: string) => void;
  editor?: {
    insertHTML?: (html: string) => void;
  };
  value?: string;
};

function insertHtml(editor: EditorLike | null, html: string): boolean {
  if (!editor) return false;
  if (editor.selection && typeof editor.selection.insertHTML === "function") {
    editor.selection.insertHTML(html);
    return true;
  }
  if (editor.s && typeof editor.s.insertHTML === "function") {
    editor.s.insertHTML(html);
    return true;
  }
  if (typeof editor.insertHTML === "function") {
    editor.insertHTML(html);
    return true;
  }
  if (editor.editor && typeof editor.editor.insertHTML === "function") {
    editor.editor.insertHTML(html);
    return true;
  }
  if (typeof editor.value === "string") {
    editor.value = `${editor.value}${html}`;
    return true;
  }
  return false;
}

function insertImage(editor: EditorLike | null, url: string, alt?: string | null): boolean {
  const altText = (alt ?? "image").replace(/"/g, "&quot;");
  if (!editor) return false;
  return insertHtml(
    editor,
    `<img src="${url.replace(/"/g, "&quot;")}" alt="${altText}" style="width: 250px; height: auto;" />`
  );
}

export function useJoditConfig(minHeight = 280) {
  return useMemo(
    () => ({
      readonly: false,
      minHeight,
      toolbar: true,
      statusbar: true,
      spellcheck: true,
      placeholder: "",
      enableDragAndDropFileToEditor: true,
      askBeforePasteFromWord: false,
      askBeforePasteHTML: false,
      processPasteHTML: true,
      uploader: {
        url: `${API_BASE_URL}/api/documents/upload`,
        method: "POST",
        format: "json",
        withCredentials: true,
        filesVariableName: () => "file",
        insertImageAsBase64URI: false,
        isSuccess: (resp: JoditUploadResponse) => {
          return Boolean(resp?.success && (resp?.file?.path || resp?.data?.src));
        },
        getMessage: (resp: JoditUploadResponse) => {
          return resp?.message || resp?.error || "";
        },
        process: (resp: JoditUploadResponse): JoditProcessedData => {
          const filePath = resp?.file?.path || resp?.data?.src || "";
          return {
            files: filePath ? [filePath] : [],
            path: "",
            baseurl: "",
            error: resp?.error || "",
            msg: resp?.message || "",
          };
        },
        defaultHandlerSuccess: function (data: JoditProcessedData, resp?: JoditUploadResponse) {
          const context = this as unknown as {
            jodit?: EditorLike;
            j?: EditorLike;
            editor?: EditorLike;
            currentPlace?: EditorLike;
            parent?: EditorLike;
            selection?: EditorLike["selection"];
            s?: EditorLike["s"];
            value?: string;
          };
          const editorCandidates: EditorLike[] = [
            context.jodit,
            context.j,
            context.editor,
            context.currentPlace,
            context.parent,
            context,
          ].filter(Boolean) as EditorLike[];

          if (!data?.files?.length) return;

          const scrollX = window.scrollX;
          const scrollY = window.scrollY;

          data.files.forEach((filePath) => {
            const fileUrl = toAbsoluteUrl(filePath);
            const fileName = decodeURIComponent((filePath.split("/").pop() || "Download file").trim());
            const mimeType = resp?.file?.mimetype || "";
            const isImage = isImagePath(filePath) || mimeType.startsWith("image/");
            const html = `<a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline;">${fileName}</a>`;

            let inserted = false;
            for (const editor of editorCandidates) {
              inserted = isImage ? insertImage(editor, fileUrl, fileName) : insertHtml(editor, html);
              if (inserted) break;
            }
          });

          requestAnimationFrame(() => {
            window.scrollTo(scrollX, scrollY);
          });
        },
        defaultHandlerError: (error: { message?: string }) => {
          window.alert(error?.message || "Failed to upload file");
        },
      },
      image: {
        openOnDblClick: true,
        editSrc: true,
        useImageEditor: true,
      },
      sourceEditor: "area" as const,
      beautifyHTML: true,
      controls: {
        prettify: {
          tooltip: "Prettify HTML",
          icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><path d=\"M16 18l6-6-6-6\"/><path d=\"M8 6l-6 6 6 6\"/></svg>",
          exec: (editor: { value: string }) => {
            try {
              const raw = editor.value ?? "";
              if (!raw.trim()) return;
              const formatted = beautifyHtml(raw, {
                indent_size: 2,
                wrap_line_length: 0,
                preserve_newlines: false,
              });
              if (formatted !== raw) editor.value = formatted;
            } catch {
              // ignore
            }
          },
        },
      },
    }),
    [minHeight]
  );
}
