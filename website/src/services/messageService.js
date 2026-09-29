import prisma from '../config/database.js';
import { trimStrings, validateStringLength, throwValidationError } from '../utils/validation.js';

/** Basic email shape check (server-side; not RFC-strict by design). */
function isLikelyEmail(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length < 5 || v.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export const messageService = {
  /**
   * Create a contact-form message. Public endpoint — strict validation, optional
   * ipAddress/userAgent captured from request for log/audit purposes.
   */
  async create(data, meta = {}) {
    const trimmed = trimStrings(data || {});

    if (!validateStringLength(trimmed.name, 2, 120, true)) throwValidationError('Name must be 2–120 characters');
    if (!isLikelyEmail(trimmed.email)) throwValidationError('A valid email is required');
    if (trimmed.phone != null && trimmed.phone !== '' && !validateStringLength(trimmed.phone, 3, 50, false)) {
      throwValidationError('Phone must be 3–50 characters');
    }
    if (!validateStringLength(trimmed.subject, 2, 254, true)) throwValidationError('Subject must be 2–254 characters');
    if (!validateStringLength(trimmed.message, 5, 5000, true)) throwValidationError('Message must be 5–5000 characters');

    return await prisma.message.create({
      data: {
        name: trimmed.name.trim(),
        email: trimmed.email.trim(),
        phone: trimmed.phone ? trimmed.phone.trim() : null,
        subject: trimmed.subject.trim(),
        message: trimmed.message.trim(),
        ipAddress: meta.ipAddress ? String(meta.ipAddress).slice(0, 45) : null,
        userAgent: meta.userAgent ? String(meta.userAgent).slice(0, 500) : null,
      },
    });
  },

  async findById(id) {
    return await prisma.message.findUnique({ where: { id: parseInt(id, 10) } });
  },

  async listForAdmin(options = {}) {
    const { isRead, search, limit, offset } = options;
    const where = this._buildWhere({ isRead, search });
    return await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      ...(limit !== undefined && { take: limit }),
      ...(offset !== undefined && { skip: offset }),
    });
  },

  async countForAdmin(options = {}) {
    const { isRead, search } = options;
    return await prisma.message.count({ where: this._buildWhere({ isRead, search }) });
  },

  async markRead(id, isRead = true) {
    return await prisma.message.update({
      where: { id: parseInt(id, 10) },
      data: { isRead: !!isRead },
    });
  },

  async delete(id) {
    return await prisma.message.delete({ where: { id: parseInt(id, 10) } });
  },

  _buildWhere({ isRead, search }) {
    const where = {};
    if (isRead !== undefined) where.isRead = !!isRead;
    if (search != null && String(search).trim() !== '') {
      const term = String(search).trim();
      where.OR = [
        { name:    { contains: term } },
        { email:   { contains: term } },
        { phone:   { contains: term } },
        { subject: { contains: term } },
        { message: { contains: term } },
      ];
    }
    return where;
  },
};
