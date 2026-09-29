// Shared schema limits derived from Prisma column definitions.
// Mirrors the existing admin/src/lib/schemaLimits.ts so both frontend and backend
// can import a single source of truth.

// User
export const USER_USERNAME_MAX = 24;
export const USER_PASSWORD_HASH_MAX = 254;
export const USER_NOTE_TO_SELF_MAX = 2000;

// UserLog
export const USER_LOG_ENDPOINT_MAX = 500;
export const USER_LOG_HTTP_METHOD_MAX = 10;
export const USER_LOG_IP_ADDRESS_MAX = 45;
export const USER_LOG_USER_AGENT_MAX = 500;

// Service
export const SERVICE_SLUG_MAX = 100;
export const SERVICE_IMAGE_SRC_MAX = 254;
export const SERVICE_ICON_MAX = 50;

// ServiceTranslation
export const SERVICE_TRANSLATION_LOCALE_LEN = 2;
export const SERVICE_TRANSLATION_FIELD_MAX = 80;
// value: Text - no practical limit

// ServiceMedia
export const SERVICE_MEDIA_KEY_MAX = 50;
export const SERVICE_MEDIA_SRC_MAX = 254;

// ProjectCategory
export const PROJECT_CATEGORY_SLUG_MAX = 100;
export const PROJECT_CATEGORY_IMAGE_SRC_MAX = 254;
export const PROJECT_CATEGORY_ICON_MAX = 50;

// ProjectCategoryTranslation
export const PROJECT_CATEGORY_TRANSLATION_LOCALE_LEN = 2;
export const PROJECT_CATEGORY_TRANSLATION_FIELD_MAX = 25;
export const PROJECT_CATEGORY_TRANSLATION_VALUE_MAX = 500;

// Project / ProjectCategory
export const PROJECT_SLUG_MAX = 100;
export const PROJECT_IMAGE_SRC_MAX = 254;
export const PROJECT_ICON_MAX = 50;

// ProjectTranslation
export const PROJECT_TRANSLATION_LOCALE_LEN = 2;
export const PROJECT_TRANSLATION_FIELD_MAX = 80;
// value: Text - no practical limit

// ProjectMedia
export const PROJECT_MEDIA_KEY_MAX = 50;
export const PROJECT_MEDIA_SRC_MAX = 254;

// ReferenceLogo
export const REFERENCE_LOGO_NAME_MAX = 50;
export const REFERENCE_LOGO_URL_MAX = 254;
export const REFERENCE_LOGO_IMAGE_SRC_MAX = 254;
export const REFERENCE_LOGO_ALT_MAX = 50;

// Document
export const DOCUMENT_NAME_MAX = 50;
export const DOCUMENT_SRC_MAX = 254;

// Shared schema rules (business-level validation, not DB column limits)
export const LOCALE_CODE_LEN = 2;

// Shared convenience aliases matching admin's schemaLimits semantics
export const SLUG_SOURCE_MAX = SERVICE_SLUG_MAX;
export const MEDIA_KEY_MAX = SERVICE_MEDIA_KEY_MAX;
export const MEDIA_SRC_MAX = SERVICE_MEDIA_SRC_MAX;
export const ICON_MAX = SERVICE_ICON_MAX;
export const IMAGE_SRC_MAX = SERVICE_IMAGE_SRC_MAX;

