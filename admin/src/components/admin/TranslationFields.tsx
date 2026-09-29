import { useState } from "react";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import TextArea from "../form/input/TextArea";
import RichTextField from "./RichTextField";
import { supportedLocales } from "../../../../shared/schemas/commonSchemas.js";

/** Parsed list from VITE_AVAILABLE_LOCALES (comma-separated in .env). Falls back to shared supportedLocales. */
function getAvailableLocales(): string[] {
  const raw = import.meta.env.VITE_AVAILABLE_LOCALES;
  if (typeof raw !== "string" || !raw.trim()) return [...supportedLocales];
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length > 0 ? list : [...supportedLocales];
}

interface Translation {
  locale: string;
  field: string;
  value: string;
}

interface TranslationFieldsProps {
  translations: Translation[];
  onChange: (translations: Translation[]) => void;
  fields: string[]; // e.g., ['name', 'description']
  locales?: string[]; // Override env list if provided
  /** Max length for short text fields (DB VarChar). e.g. ProjectCategoryTranslation.value = 500. */
  valueMaxLength?: number;
}

export default function TranslationFields({
  translations,
  onChange,
  fields,
  locales: localesProp,
  valueMaxLength,
}: TranslationFieldsProps) {
  const locales = localesProp ?? getAvailableLocales();
  const [activeTab, setActiveTab] = useState(locales[0]);

  const updateTranslation = (
    locale: string,
    field: string,
    value: string
  ) => {
    const updated = [...translations];
    const index = updated.findIndex(
      (t) => t.locale === locale && t.field === field
    );
    
    if (index >= 0) {
      updated[index].value = value;
    } else {
      updated.push({ locale, field, value });
    }
    
    onChange(updated);
  };

  const getTranslationValue = (locale: string, field: string): string => {
    const translation = translations.find(
      (t) => t.locale === locale && t.field === field
    );
    return translation?.value || '';
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Translations</Label>
        <div className="flex gap-2 mt-2 border-b border-gray-200 dark:border-gray-800">
          {locales.map((locale) => (
            <button
              key={locale}
              type="button"
              onClick={() => setActiveTab(locale)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === locale
                  ? 'border-brand-500 text-brand-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {locale.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field}>
            <Label>
              {field.charAt(0).toUpperCase() + field.slice(1)} ({activeTab.toUpperCase()})
            </Label>
            {field === 'contentHtml' || field === 'content' ? (
              <RichTextField
                value={getTranslationValue(activeTab, field)}
                onChange={(value) =>
                  updateTranslation(activeTab, field, value)
                }
                placeholder={`Enter ${field} in ${activeTab.toUpperCase()}`}
                minHeight={320}
              />
            ) : field === 'description' || field === 'slogan' || field === 'shortDescription' ? (
              <TextArea
                value={getTranslationValue(activeTab, field)}
                onChange={(value) =>
                  updateTranslation(activeTab, field, value)
                }
                placeholder={`Enter ${field} in ${activeTab.toUpperCase()}`}
                rows={4}
                maxLength={valueMaxLength}
              />
            ) : (
              <Input
                value={getTranslationValue(activeTab, field)}
                onChange={(e) =>
                  updateTranslation(activeTab, field, e.target.value)
                }
                placeholder={`Enter ${field} in ${activeTab.toUpperCase()}`}
                maxLength={valueMaxLength ?? undefined}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
