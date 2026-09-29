import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminFormLayout from "../../../components/admin/AdminFormLayout";
import ImageUploadField from "../../../components/admin/ImageUploadField";
import TranslationFields from "../../../components/admin/TranslationFields";
import FeaturesFieldList, {
  serializeFeatures,
} from "../../../components/admin/FeaturesFieldList";
import MediaFieldList from "../../../components/admin/MediaFieldList";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";
import { apiService, API_BASE_URL } from "../../../services/api";
import { ICON_MAX } from "../../../lib/schemaLimits";
import { ServiceCreateSchema } from "../../../../../shared/schemas/serviceSchemas.js";

const HOME_SLOT_LIMIT = 4;
const HOME_SLOT_WARNING =
  "You cannot feature more than 4 services on the homepage";

const MONTAGE_BASE_URL = `${API_BASE_URL}/assets/services/montage-base.svg`;
const MONTAGE_PROMPT_URL = `${API_BASE_URL}/assets/services/montage-prompt.txt`;

interface Translation {
  locale: string;
  field: string;
  value: string;
}

interface MediaItem {
  key: string;
  src: string;
  isVideo: boolean;
  sort?: number;
}

export default function ServiceForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [icon, setIcon] = useState("");
  const [sort, setSort] = useState(0);
  const [status, setStatus] = useState(true);
  const [showOnHome, setShowOnHome] = useState(false);
  const [showOnHomeKey, setShowOnHomeKey] = useState(0);
  const [homeSlotsUsed, setHomeSlotsUsed] = useState(0);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    loadHomeSlots();
    if (isEdit) {
      loadService();
    }
  }, [id]);

  const loadHomeSlots = async () => {
    try {
      const res = await apiService.getServices({
        showOnHome: true,
        page: 1,
        limit: HOME_SLOT_LIMIT + 1,
      });
      const data = Array.isArray(res) ? res : res.data;
      const total = Array.isArray(res)
        ? data.length
        : (res.pagination?.total ?? data.length);
      setHomeSlotsUsed(total);
    } catch {
      setHomeSlotsUsed(0);
    }
  };

  const loadService = async () => {
    try {
      setLoading(true);
      const service = await apiService.getServiceById(parseInt(id!));
      setImageSrc(service.imageSrc || "");
      setIcon(service.icon || "");
      setSort(service.sort || 0);
      setStatus(service.status !== undefined ? service.status : true);
      setShowOnHome(service.showOnHome === true);

      if (service.translations) {
        setTranslations(service.translations);
      }
      if (service.medias && Array.isArray(service.medias)) {
        setMedia(
          service.medias.map((m: { key?: string; name?: string; src?: string; isVideo?: boolean; sort?: number }) => ({
            key: m.key ?? m.name ?? '',
            src: m.src ?? '',
            isVideo: Boolean(m.isVideo),
            sort: m.sort ?? 0,
          }))
        );
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to load service");
    } finally {
      setLoading(false);
    }
  };

  const getRequiredNameEn = (): string => {
    return (
      translations.find((t) => t.locale === "en" && t.field === "name")?.value?.trim() ?? ""
    );
  };

  const handleShowOnHomeChange = (checked: boolean) => {
    const othersOnHome = showOnHome ? homeSlotsUsed - 1 : homeSlotsUsed;
    if (checked && othersOnHome >= HOME_SLOT_LIMIT) {
      setError(HOME_SLOT_WARNING);
      setShowOnHomeKey((k) => k + 1);
      return;
    }
    setError("");
    setShowOnHome(checked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanedTranslations = translations
      .map((t) => {
        if (t.field === "features") {
          try {
            const parsed = JSON.parse(t.value);
            const json = serializeFeatures(
              Array.isArray(parsed)
                ? parsed.map((item: { title?: string; text?: string }) => ({
                    title: item?.title ?? "",
                    text: item?.text ?? "",
                  }))
                : []
            );
            if (!json) return null;
            return { ...t, value: json };
          } catch {
            return null;
          }
        }
        const value = t.value?.trim() ?? "";
        if (!value) return null;
        return { ...t, value };
      })
      .filter((t): t is Translation => t != null);

    const cleanedMedia = media
      .map((m) => ({
        key: m.key.trim(),
        src: m.src.trim(),
        isVideo: m.isVideo,
        sort: m.sort ?? 0,
      }))
      .filter((m) => m.src);

    const payload = {
      imageSrc: imageSrc.trim(),
      icon: icon.trim() || null,
      sort: parseInt(sort.toString()) || 0,
      status,
      showOnHome,
      translations: cleanedTranslations,
      media: cleanedMedia,
      nameEn: getRequiredNameEn(),
    };

    const result = ServiceCreateSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid data");
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await apiService.updateService(parseInt(id!), result.data);
      } else {
        await apiService.createService(result.data);
      }

      navigate("/services");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title={isEdit ? "Edit Service" : "New Service" + " | Admin"}
        description={isEdit ? "Edit service" : "Create new service"}
      />
      <AdminFormLayout
        title={isEdit ? "Edit Service" : "New Service"}
        description={
          isEdit
            ? "Update service information"
            : "Create a new service with translations and media"
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        <ImageUploadField
          label="Service montage (SVG only)"
          value={imageSrc}
          onChange={setImageSrc}
          required
          svgOnly
          hint={
            <>
              <p>
                SVG only — same family as the site montages (560×352, dark UI,
                motion classes).
              </p>
              <p>
                <a
                  className="text-brand-600 underline dark:text-brand-400"
                  href={MONTAGE_BASE_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Download base template
                </a>
                {" · "}
                <a
                  className="text-brand-600 underline dark:text-brand-400"
                  href={MONTAGE_PROMPT_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  AI prompt
                </a>
              </p>
            </>
          }
        />

        <div>
          <Label>Icon (optional)</Label>
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value.slice(0, ICON_MAX))}
            placeholder="Icon class name (e.g., agrikon-icon-agriculture)"
            maxLength={ICON_MAX}
          />
        </div>

        <div>
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={sort}
            onChange={(e) => setSort(parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <Switch
            key={`status-${status}`}
            label="Active"
            defaultChecked={status}
            onChange={setStatus}
          />
        </div>

        <div>
          <Switch
            key={`showOnHome-${showOnHome}-${showOnHomeKey}`}
            label="Show on homepage"
            defaultChecked={showOnHome}
            onChange={handleShowOnHomeChange}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Up to {HOME_SLOT_LIMIT} services can appear in the homepage Vision
            section ({homeSlotsUsed}/{HOME_SLOT_LIMIT} used).
          </p>
        </div>

        <TranslationFields
          translations={translations}
          onChange={setTranslations}
          fields={["name", "shortName", "description", "shortDescription"]}
        />

        <FeaturesFieldList
          translations={translations}
          onChange={setTranslations}
        />

        <MediaFieldList
          media={media}
          onChange={setMedia}
          getTranslationValue={(locale, field) =>
            translations.find((t) => t.locale === locale && t.field === field)?.value ?? ""
          }
          updateTranslation={(locale, field, value) => {
            const updated = [...translations];
            const idx = updated.findIndex((t) => t.locale === locale && t.field === field);
            if (idx >= 0) updated[idx].value = value;
            else updated.push({ locale, field, value });
            setTranslations(updated);
          }}
        />
      </AdminFormLayout>
    </>
  );
}
