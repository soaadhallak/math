import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminFormLayout from "../../../components/admin/AdminFormLayout";
import ImageUploadField from "../../../components/admin/ImageUploadField";
import TranslationFields from "../../../components/admin/TranslationFields";
import AttributesTranslationField from "../../../components/admin/AttributesTranslationField";
import MediaFieldList from "../../../components/admin/MediaFieldList";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";
import { apiService } from "../../../services/api";
import { ICON_MAX } from "../../../lib/schemaLimits";
import { ProjectCreateSchema } from "../../../../../shared/schemas/projectSchemas.js";

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

interface CategoryTranslation {
  locale: string;
  field: string;
  value: string;
}

interface CategoryItem {
  id: number;
  translations?: CategoryTranslation[];
}

export default function ProjectForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [projectCategoryId, setProjectCategoryId] = useState<number | "">("");
  const [imageSrc, setImageSrc] = useState("");
  const [icon, setIcon] = useState("");
  const [sort, setSort] = useState(0);
  const [status, setStatus] = useState(true);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);

  const getErrorMessage = (error: unknown, fallback: string): string => {
    return error instanceof Error ? error.message : fallback;
  };

  useEffect(() => {
    loadCategories();
    if (isEdit) {
      loadProject();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const response = await apiService.getProjectCategories();
      const data = Array.isArray(response) ? response : response.data;
      setCategories(data);
    } catch (error: unknown) {
      console.error("Failed to load categories", error);
    }
  };

  const loadProject = async () => {
    try {
      setLoading(true);
      const project = await apiService.getProjectById(parseInt(id!));
      setProjectCategoryId(project.projectCategoryId);
      setImageSrc(project.imageSrc || "");
      setIcon(project.icon || "");
      setSort(project.sort || 0);
      setStatus(project.status !== undefined ? project.status : true);

      if (project.translations) {
        setTranslations(project.translations);
      }
      if (project.medias && Array.isArray(project.medias)) {
        setMedia(
          project.medias.map((m: { key?: string; name?: string; src?: string; isVideo?: boolean; sort?: number }) => ({
            key: m.key ?? m.name ?? '',
            src: m.src ?? '',
            isVideo: Boolean(m.isVideo),
            sort: m.sort ?? 0,
          }))
        );
      }
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to load project"));
    } finally {
      setLoading(false);
    }
  };

  const getRequiredNameEn = (): string => {
    return (
      translations.find((t) => t.locale === "en" && t.field === "name")?.value?.trim() ?? ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      projectCategoryId: projectCategoryId ? Number(projectCategoryId) : undefined,
      imageSrc: imageSrc.trim(),
      icon: icon.trim() || null,
      sort: parseInt(sort.toString()) || 0,
      status,
      translations,
      media: media.map((m) => ({
        key: m.key,
        src: m.src,
        isVideo: m.isVideo,
        sort: m.sort ?? 0,
      })),
      nameEn: getRequiredNameEn(),
    };

    const result = ProjectCreateSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid data");
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await apiService.updateProject(parseInt(id!), result.data);
      } else {
        await apiService.createProject(result.data);
      }

      navigate("/projects");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to save project"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title={(isEdit ? "Edit Project" : "New Project") + " | Admin"}
        description={isEdit ? "Edit project" : "Create new project"}
      />
      <AdminFormLayout
        title={isEdit ? "Edit Project" : "New Project"}
        description={
          isEdit
            ? "Update project information"
            : "Create a new project with translations and media"
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        <div>
          <Label>
            Category <span className="text-error-500">*</span>
          </Label>
          <select
            value={projectCategoryId}
            onChange={(e) =>
              setProjectCategoryId(
                e.target.value ? parseInt(e.target.value) : ""
              )
            }
            required
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => {
              const name =
                cat.translations?.find(
                  (t) => t.locale === "en" && t.field === "name"
                )?.value || "Untitled";
              return (
                <option key={cat.id} value={cat.id}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>

        <ImageUploadField
          label="Image"
          value={imageSrc}
          onChange={setImageSrc}
          required
        />

        <div>
          <Label>Icon (optional)</Label>
          <Input
            value={icon}
            onChange={(e) => setIcon(e.target.value.slice(0, ICON_MAX))}
            placeholder="Icon class name"
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

        <TranslationFields
          translations={translations}
          onChange={setTranslations}
          fields={["name", "description", "contentHtml"]}
        />

        <AttributesTranslationField
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
