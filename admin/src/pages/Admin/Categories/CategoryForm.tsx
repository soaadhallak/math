import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminFormLayout from "../../../components/admin/AdminFormLayout";
import ImageUploadField from "../../../components/admin/ImageUploadField";
import TranslationFields from "../../../components/admin/TranslationFields";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";
import { apiService } from "../../../services/api";
import { ICON_MAX, PROJECT_CATEGORY_TRANSLATION_VALUE_MAX } from "../../../lib/schemaLimits";
import { ProjectCategoryCreateSchema } from "../../../../../shared/schemas/projectCategorySchemas.js";

interface Translation {
  locale: string;
  field: string;
  value: string;
}

export default function CategoryForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [icon, setIcon] = useState("");
  const [sort, setSort] = useState(0);
  const [status, setStatus] = useState(true);
  const [translations, setTranslations] = useState<Translation[]>([]);

  useEffect(() => {
    if (isEdit) {
      loadCategory();
    }
  }, [id]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const category = await apiService.getProjectCategoryById(parseInt(id!));
      setImageSrc(category.imageSrc || "");
      setIcon(category.icon || "");
      setSort(category.sort || 0);
      setStatus(category.status !== undefined ? category.status : true);

      if (category.translations) {
        setTranslations(category.translations);
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to load category");
    } finally {
      setLoading(false);
    }
  };

  const getNameEn = (): string => {
    return (
      translations.find((t) => t.locale === "en" && t.field === "name")?.value?.trim() ?? ""
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      imageSrc: imageSrc?.trim() || null,
      icon: icon.trim() || null,
      sort: parseInt(sort.toString()) || 0,
      status,
      translations,
      nameEn: getNameEn(),
    };

    const result = ProjectCategoryCreateSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid data");
      return;
    }

    setLoading(true);

    try {
      if (isEdit) {
        await apiService.updateProjectCategory(parseInt(id!), result.data);
      } else {
        await apiService.createProjectCategory(result.data);
      }

      navigate("/categories");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to save category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title={
          (isEdit ? "Edit Category" : "New Category") + " | Admin"
        }
        description={isEdit ? "Edit category" : "Create new category"}
      />
      <AdminFormLayout
        title={isEdit ? "Edit Category" : "New Category"}
        description={
          isEdit
            ? "Update category information"
            : "Create a new project category"
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        <ImageUploadField
          label="Image (optional)"
          value={imageSrc}
          onChange={setImageSrc}
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
          fields={["name", "description"]}
          valueMaxLength={PROJECT_CATEGORY_TRANSLATION_VALUE_MAX}
        />
      </AdminFormLayout>
    </>
  );
}
