import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import AdminFormLayout from "../../../components/admin/AdminFormLayout";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import Switch from "../../../components/form/switch/Switch";
import Button from "../../../components/ui/button/Button";
import { Modal } from "../../../components/ui/modal";
import { apiService } from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";
import { UserCreateSchema, UserUpdateSchema } from "../../../../../shared/schemas/userSchemas.js";

const USERNAME_MAX = 24;
const NOTE_TO_SELF_MAX = 2000;

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();
  const isEdit = !!id;
  const editId = id ? parseInt(id, 10) : 0;
  const isSelf = isEdit && currentUser && editId === currentUser.id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [noteToSelf, setNoteToSelf] = useState("");
  const [sort, setSort] = useState(0);
  const [status, setStatus] = useState(true);

  const [selfPasswordConfirmModal, setSelfPasswordConfirmModal] = useState<{
    open: boolean;
    noteToSelf: string;
    pendingPayload: Record<string, unknown>;
  }>({ open: false, noteToSelf: "", pendingPayload: {} });

  useEffect(() => {
    if (isEdit) {
      loadUser();
    }
  }, [id]);

  const loadUser = async () => {
    try {
      setLoading(true);
      const user = await apiService.getUserById(editId);
      setUsername(user.username || "");
      setNoteToSelf(user.noteToSelf || "");
      setSort(user.sort ?? 0);
      setStatus(user.status !== undefined ? user.status : true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load user");
    } finally {
      setLoading(false);
    }
  };

  const buildPayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      username: username.trim(),
      sort: Number(sort) || 0,
      status,
      noteToSelf: noteToSelf.trim() || null,
    };
    if (password.trim()) {
      payload.password = password.trim();
    }
    return payload;
  };

  const submitPayload = async (payload: Record<string, unknown>) => {
    if (isEdit) {
      const response = await apiService.updateUser(editId, payload);
      if (response?.requireLogout) {
        await logout();
        return;
      }
      navigate("/users");
    } else {
      await apiService.createUser(payload);
      navigate("/users");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const u = username.trim();
    if (!u) {
      setError("Username is required");
      return;
    }
    if (u.length > USERNAME_MAX) {
      setError(`Username must be at most ${USERNAME_MAX} characters`);
      return;
    }
    if (!isEdit && !password.trim()) {
      setError("Password is required for new users");
      return;
    }
    if (noteToSelf.length > NOTE_TO_SELF_MAX) {
      setError(`Note to self must be at most ${NOTE_TO_SELF_MAX} characters`);
      return;
    }

    const payload = buildPayload();
    const schema = isEdit ? UserUpdateSchema : UserCreateSchema;
    const result = schema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid data");
      return;
    }
    const validatedPayload = result.data as Record<string, unknown>;
    const isChangingOwnPassword = isSelf && !!validatedPayload.password;

    if (isChangingOwnPassword) {
      setSelfPasswordConfirmModal({
        open: true,
        noteToSelf: noteToSelf.trim() || "(No note to self)",
        pendingPayload: validatedPayload,
      });
      return;
    }

    setLoading(true);
    try {
      await submitPayload(validatedPayload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSelfPasswordChange = async () => {
    const { pendingPayload } = selfPasswordConfirmModal;
    setSelfPasswordConfirmModal({ open: false, noteToSelf: "", pendingPayload: {} });
    setLoading(true);
    try {
      await submitPayload(pendingPayload);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title={(isEdit ? "Edit User" : "New User") + " | Admin"}
        description={isEdit ? "Edit user" : "Create new user"}
      />
      <AdminFormLayout
        title={isEdit ? "Edit User" : "New User"}
        description={
          isEdit ? "Update user information" : "Create a new user"
        }
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
      >
        <div>
          <Label>Username</Label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value.slice(0, USERNAME_MAX))}
            placeholder="Username"
            maxLength={USERNAME_MAX}
            autoComplete={isEdit ? "username" : "off"}
          />
        </div>

        <div>
          <Label>{isEdit ? "New password (leave blank to keep)" : "Password"}</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? "Leave blank to keep current" : "Password"}
            autoComplete="new-password"
          />
        </div>

        {isSelf && (
          <div>
            <Label>Note to self</Label>
            <TextArea
              value={noteToSelf}
              onChange={setNoteToSelf}
              placeholder="Optional message shown when you change your own password"
              rows={3}
              maxLength={NOTE_TO_SELF_MAX}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This message will be shown when you change your password, then you will be logged out.
            </p>
          </div>
        )}

        <div>
          <Label>Sort Order</Label>
          <Input
            type="number"
            value={sort}
            onChange={(e) => setSort(parseInt(e.target.value, 10) || 0)}
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

      <Modal
        isOpen={selfPasswordConfirmModal.open}
        onClose={() =>
          setSelfPasswordConfirmModal({
            open: false,
            noteToSelf: "",
            pendingPayload: {},
          })
        }
      >
        <div className="p-6">
          <h3 className="mb-4 text-lg font-semibold">Change your password</h3>
          <p className="mb-2 text-gray-600 dark:text-gray-400">
            You are about to change your own password. You will be logged out after saving.
          </p>
          <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Your note to self:
          </p>
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            {selfPasswordConfirmModal.noteToSelf}
          </div>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
            Confirm to change your password and log out.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              size="sm"
              onClick={() =>
                setSelfPasswordConfirmModal({
                  open: false,
                  noteToSelf: "",
                  pendingPayload: {},
                })
              }
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirmSelfPasswordChange}>
              Confirm and change password
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
