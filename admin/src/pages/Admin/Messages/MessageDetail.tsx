import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import Button from "../../../components/ui/button/Button";
import Badge from "../../../components/ui/badge/Badge";
import { apiService } from "../../../services/api";

const WEBMAIL_URL = import.meta.env.VITE_WEBMAIL_URL || "";

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function MessageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const data = await apiService.getMessageById(parseInt(id, 10));
        setItem(data);
        // Auto-mark as read on first open
        if (data && !data.isRead) {
          apiService.markMessageRead(data.id, true).catch(() => {});
          setItem({ ...data, isRead: true });
        }
      } catch (error: any) {
        alert(error.message || "Failed to load message");
        navigate("/messages");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const handleReply = () => {
    if (!WEBMAIL_URL) {
      alert("Webmail URL is not configured (VITE_WEBMAIL_URL).");
      return;
    }
    window.open(WEBMAIL_URL, "_blank", "noopener,noreferrer");
  };

  const handleToggleRead = async () => {
    if (!item) return;
    try {
      const next = !item.isRead;
      const updated = await apiService.markMessageRead(item.id, next);
      setItem({ ...item, isRead: !!updated.isRead });
    } catch (error: any) {
      alert(error.message || "Failed to update message");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <>
      <PageMeta title={`Message — ${item.subject} | Admin`} description="Message detail" />
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => navigate("/messages")}>
              ← Back
            </Button>
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
              {item.subject}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge size="sm" color={item.isRead ? "success" : "warning"}>
              {item.isRead ? "Read" : "New"}
            </Badge>
            <Button size="sm" variant="outline" onClick={handleToggleRead}>
              Mark as {item.isRead ? "unread" : "read"}
            </Button>
            <Button size="sm" onClick={handleReply}>
              Reply via webmail
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">From</dt>
              <dd className="mt-1 text-gray-800 dark:text-white/90">{item.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Email</dt>
              <dd className="mt-1">
                <a className="text-brand-500 hover:underline" href={`mailto:${item.email}`}>
                  {item.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Phone</dt>
              <dd className="mt-1 text-gray-800 dark:text-white/90">{item.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">Received</dt>
              <dd className="mt-1 text-gray-800 dark:text-white/90">
                {new Date(item.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">IP Address</dt>
              <dd className="mt-1 text-gray-800 dark:text-white/90">{item.ipAddress || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase">User Agent</dt>
              <dd className="mt-1 break-words text-gray-800 dark:text-white/90">
                {item.userAgent || "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-white/[0.05] dark:bg-white/[0.03]">
          <h3 className="mb-3 text-sm font-medium text-gray-500 uppercase">Message</h3>
          <p className="whitespace-pre-wrap text-gray-800 dark:text-white/90">{item.message}</p>
        </div>
      </div>
    </>
  );
}
