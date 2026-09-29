import { useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import Button from "../ui/button/Button";
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

export interface FeatureItem {
  title: string;
  text: string;
}

interface Translation {
  locale: string;
  field: string;
  value: string;
}

interface FeaturesFieldListProps {
  translations: Translation[];
  onChange: (translations: Translation[]) => void;
  locales?: string[];
}

function parseFeatures(raw: string | undefined): FeatureItem[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      title: typeof item?.title === "string" ? item.title : "",
      text: typeof item?.text === "string" ? item.text : "",
    }));
  } catch {
    return [];
  }
}

/** Drop blank rows; keep JSON only when at least one complete feature exists. */
export function serializeFeatures(items: FeatureItem[]): string | null {
  const cleaned = items
    .map((f) => ({
      title: f.title.trim(),
      text: f.text.trim(),
    }))
    .filter((f) => f.title && f.text);
  return cleaned.length ? JSON.stringify(cleaned) : null;
}

export default function FeaturesFieldList({
  translations,
  onChange,
  locales: localesProp,
}: FeaturesFieldListProps) {
  const locales = localesProp ?? getAvailableLocales();
  const [activeLocale, setActiveLocale] = useState(locales[0]);

  const features = parseFeatures(
    translations.find((t) => t.locale === activeLocale && t.field === "features")
      ?.value
  );

  const writeFeatures = (locale: string, items: FeatureItem[]) => {
    const updated = translations.filter(
      (t) => !(t.locale === locale && t.field === "features")
    );
    // Persist draft rows (even empty) so "Add feature" shows immediately.
    // Submit cleans incomplete rows via serializeFeatures.
    if (items.length > 0) {
      updated.push({
        locale,
        field: "features",
        value: JSON.stringify(
          items.map((f) => ({
            title: f.title,
            text: f.text,
          }))
        ),
      });
    }
    onChange(updated);
  };

  const addFeature = () => {
    writeFeatures(activeLocale, [...features, { title: "", text: "" }]);
  };

  const removeFeature = (index: number) => {
    writeFeatures(
      activeLocale,
      features.filter((_, i) => i !== index)
    );
  };

  const updateFeature = (
    index: number,
    field: keyof FeatureItem,
    value: string
  ) => {
    const next = features.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    writeFeatures(activeLocale, next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label>Features (accordion)</Label>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Each item becomes one accordion row on the services page. Translate
            per language.
          </p>
        </div>
        <Button type="button" size="sm" onClick={addFeature}>
          Add feature
        </Button>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        {locales.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActiveLocale(locale)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeLocale === locale
                ? "border-brand-500 text-brand-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {locale.toUpperCase()}
          </button>
        ))}
      </div>

      {features.map((item, index) => (
        <div
          key={`${activeLocale}-${index}`}
          className="space-y-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Feature #{index + 1}
            </span>
            <button
              type="button"
              onClick={() => removeFeature(index)}
              className="text-sm text-error-500 hover:text-error-600"
            >
              Remove
            </button>
          </div>

          <div>
            <Label>Title ({activeLocale.toUpperCase()})</Label>
            <Input
              value={item.title}
              onChange={(e) => updateFeature(index, "title", e.target.value)}
              placeholder="e.g. Custom design"
            />
          </div>

          <div>
            <Label>Text ({activeLocale.toUpperCase()})</Label>
            <TextArea
              value={item.text}
              onChange={(value) => updateFeature(index, "text", value)}
              placeholder="Short explanation for this feature"
              rows={3}
            />
          </div>
        </div>
      ))}

      {features.length === 0 && (
        <p className="text-sm text-gray-500">
          No features yet. Click &quot;Add feature&quot; to create accordion
          items for {activeLocale.toUpperCase()}.
        </p>
      )}
    </div>
  );
}
