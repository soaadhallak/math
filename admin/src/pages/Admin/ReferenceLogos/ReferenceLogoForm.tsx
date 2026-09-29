import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminFormLayout from "../../../components/admin/AdminFormLayout";
import ImageUploadField from "../../../components/admin/ImageUploadField";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Switch from "../../../components/form/switch/Switch";
import { apiService } from "../../../services/api";
import {
  REFERENCE_LOGO_NAME_MAX,
  REFERENCE_LOGO_URL_MAX,
  REFERENCE_LOGO_ALT_MAX,
} from "../../../lib/schemaLimits";
import { ReferenceLogoCreateSchema } from "../../../../../shared/schemas/referenceLogoSchemas.js";

export default function ReferenceLogoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [imageSrc, setImageSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [sort, setSort] = useState(0);
  const [status, setStatus] = useState(true);

  useEffect(() => {
    if (isEdit) {
      loadLogo();
    }
  }, [id]);

  const loadLogo = async () => {
    try {
      setLoading(true);
      const logo = await apiService.getReferenceLogoById(parseInt(id!));
      setName(logo.name || "");
      setUrl(logo.url || "");
      setImageSrc(logo.imageSrc || "");
      setAlt(logo.alt || "");
      setSort(logo.sort ?? 0);
      setStatus(logo.status !== undefined ? logo.status : true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to load reference logo");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = {
      name: name.trim(),
      url: url.trim() || null,
      imageSrc: imageSrc.trim(),
      alt: alt.trim(),
      sort: parseInt(sort.toString()) || 0,
      status,
    };

    const result = ReferenceLogoCreateSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid data");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await apiService.updateReferenceLogo(parseInt(id!), result.data);
      } else {
        await apiService.createReferenceLogo(result.data);
      }

      navigate("/reference-logos");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Failed to save reference logo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title={
          (isEdit ? "Edit Reference Logo" : "New Reference Logo") +
          " | Admin"
        }
        description={
          isEdit ? "Edit reference logo" : "Create new reference logo"
        }
      />
      <AdminFormLayout
        title={isEdit ? "Edit Reference Logo" : "New Reference Logo"}
        description={
          isEdit
            ? "Update reference logo information"
            : "Add a new reference logo"
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        <div>
          <Label>Name</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, REFERENCE_LOGO_NAME_MAX))}
            placeholder="Company or reference name"
            maxLength={REFERENCE_LOGO_NAME_MAX}
            required
          />
        </div>

        <ImageUploadField
          label="Logo Image"
          value={imageSrc}
          onChange={setImageSrc}
          required
        />

        <div>
          <Label>Alt Text</Label>
          <Input
            type="text"
            value={alt}
            onChange={(e) => setAlt(e.target.value.slice(0, REFERENCE_LOGO_ALT_MAX))}
            placeholder="Alternative text for the image"
            maxLength={REFERENCE_LOGO_ALT_MAX}
            required
          />
        </div>

        <div>
          <Label>Link URL (optional)</Label>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value.slice(0, REFERENCE_LOGO_URL_MAX))}
            placeholder="https://..."
            maxLength={REFERENCE_LOGO_URL_MAX}
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
      </AdminFormLayout>
    </>
  );
}
