import { useRef, useMemo } from "react";
import JoditEditor from "jodit-react";
import "jodit/es2015/jodit.min.css";
import { useJoditConfig } from "../../hooks/useJoditConfig";

interface RichTextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function RichTextField({
  value,
  onChange,
  placeholder: _placeholder,
  minHeight = 280,
}: RichTextFieldProps) {
  const editorRef = useRef(null);
  const baseConfig = useJoditConfig(minHeight);

  const config = useMemo(
    () => ({
      ...baseConfig,
      buttons: [
        "bold",
        "italic",
        "underline",
        "strikethrough",
        "|",
        "ul",
        "ol",
        "|",
        "font",
        "fontsize",
        "brush",
        "|",
        "align",
        "|",
        "link",
        "image",
        "file",
        "table",
        "|",
        "hr",
        "eraser",
        "|",
        "source",
        "prettify",
        "|",
        "undo",
        "redo",
      ],
    }),
    [baseConfig]
  );

  return (
    <div className="rich-text-field rounded-lg border border-gray-300 overflow-hidden dark:border-gray-700">
      <JoditEditor
        ref={editorRef}
        value={value}
        config={config}
        onBlur={(newContent: string) => onChange(newContent)}
        onChange={(newContent: string) => onChange(newContent)}
      />
    </div>
  );
}
