import { useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { PlusIcon, TrashBinIcon } from "../../icons";
import { supportedLocales } from "../../../../shared/schemas/commonSchemas.js";

function getAvailableLocales(): string[] {
  const raw = import.meta.env.VITE_AVAILABLE_LOCALES;
  if (typeof raw !== "string" || !raw.trim()) return [...supportedLocales];
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [...supportedLocales];
}

export interface AttributeItem {
  key: string;
  value: string;
}

interface Translation {
  locale: string;
  field: string;
  value: string;
}

interface AttributesTranslationFieldProps {
  translations: Translation[];
  onChange: (translations: Translation[]) => void;
  locales?: string[];
}

function parseAttributesValue(raw: string | undefined): AttributeItem[] {
  if (!raw || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: unknown) => ({
      key: typeof item === "object" && item !== null && "key" in item ? String((item as { key: unknown }).key) : "",
      value: typeof item === "object" && item !== null && "value" in item ? String((item as { value: unknown }).value) : "",
    }));
  } catch {
    return [];
  }
}

export default function AttributesTranslationField({
  translations,
  onChange,
  locales: localesProp,
}: AttributesTranslationFieldProps) {
  const locales = localesProp ?? getAvailableLocales();
  const [activeTab, setActiveTab] = useState(locales[0]);

  const rawValue = translations.find(
    (t) => t.locale === activeTab && t.field === "attributes"
  )?.value;
  const items = parseAttributesValue(rawValue);

  const updateItems = (newItems: AttributeItem[]) => {
    const value = JSON.stringify(newItems);
    const updated = [...translations];
    const index = updated.findIndex(
      (t) => t.locale === activeTab && t.field === "attributes"
    );
    if (index >= 0) {
      updated[index].value = value;
    } else {
      updated.push({ locale: activeTab, field: "attributes", value });
    }
    onChange(updated);
  };

  const setItem = (index: number, part: "key" | "value", value: string) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, [part]: value } : item
    );
    updateItems(next);
  };

  const addRow = () => {
    updateItems([...items, { key: "", value: "" }]);
  };

  const removeRow = (index: number) => {
    updateItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Attributes (key-value per locale)</Label>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Project specs shown on the detail page (e.g. Category, Origin, Grades). One row per attribute.
        </p>
        <div className="mt-2 flex gap-2 border-b border-gray-200 dark:border-gray-800">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveTab(locale)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === locale
                  ? "border-brand-500 text-brand-500"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="mb-0">
            Attributes ({activeTab.toUpperCase()})
          </Label>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-theme-xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-gray-800"
          >
            <PlusIcon className="size-4" />
            Add row
          </button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400">
            No attributes. Click &quot;Add row&quot; to add key-value pairs.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-900"
              >
                <Input
                  value={item.key}
                  onChange={(e) => setItem(index, "key", e.target.value)}
                  placeholder="Key (e.g. Category)"
                  className="min-w-[120px] flex-1"
                />
                <span className="text-gray-400 dark:text-gray-500">:</span>
                <Input
                  value={item.value}
                  onChange={(e) => setItem(index, "value", e.target.value)}
                  placeholder="Value (e.g. Vegetable Oils)"
                  className="min-w-[140px] flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeRow(index)}
                  className="rounded p-1.5 text-gray-500 transition-colors hover:bg-error-500/10 hover:text-error-600 dark:hover:bg-error-500/20"
                  title="Remove row"
                >
                  <TrashBinIcon className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
