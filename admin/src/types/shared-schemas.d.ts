declare module "../../../shared/schemas/schemaLimits.js" {
  export const USER_USERNAME_MAX: number;
  export const USER_PASSWORD_HASH_MAX: number;
  export const USER_LOG_ENDPOINT_MAX: number;
  export const USER_LOG_HTTP_METHOD_MAX: number;
  export const USER_LOG_IP_ADDRESS_MAX: number;
  export const USER_LOG_USER_AGENT_MAX: number;
  export const SERVICE_SLUG_MAX: number;
  export const SERVICE_IMAGE_SRC_MAX: number;
  export const SERVICE_ICON_MAX: number;
  export const SERVICE_TRANSLATION_LOCALE_LEN: number;
  export const SERVICE_TRANSLATION_FIELD_MAX: number;
  export const SERVICE_MEDIA_KEY_MAX: number;
  export const SERVICE_MEDIA_SRC_MAX: number;
  export const PROJECT_CATEGORY_SLUG_MAX: number;
  export const PROJECT_CATEGORY_IMAGE_SRC_MAX: number;
  export const PROJECT_CATEGORY_ICON_MAX: number;
  export const PROJECT_CATEGORY_TRANSLATION_LOCALE_LEN: number;
  export const PROJECT_CATEGORY_TRANSLATION_FIELD_MAX: number;
  export const PROJECT_CATEGORY_TRANSLATION_VALUE_MAX: number;
  export const PROJECT_SLUG_MAX: number;
  export const PROJECT_IMAGE_SRC_MAX: number;
  export const PROJECT_ICON_MAX: number;
  export const PROJECT_TRANSLATION_LOCALE_LEN: number;
  export const PROJECT_TRANSLATION_FIELD_MAX: number;
  export const PROJECT_MEDIA_KEY_MAX: number;
  export const PROJECT_MEDIA_SRC_MAX: number;
  export const REFERENCE_LOGO_NAME_MAX: number;
  export const REFERENCE_LOGO_URL_MAX: number;
  export const REFERENCE_LOGO_IMAGE_SRC_MAX: number;
  export const REFERENCE_LOGO_ALT_MAX: number;
  export const DOCUMENT_NAME_MAX: number;
  export const DOCUMENT_SRC_MAX: number;
  export const SLUG_SOURCE_MAX: number;
  export const MEDIA_KEY_MAX: number;
  export const MEDIA_SRC_MAX: number;
  export const ICON_MAX: number;
  export const IMAGE_SRC_MAX: number;
}

declare module "../../../../../shared/schemas/projectCategorySchemas.js" {
  export const ProjectCategoryCreateSchema: any;
  export const ProjectCategoryUpdateSchema: any;
}

declare module "../../../../../shared/schemas/projectSchemas.js" {
  export const ProjectCreateSchema: any;
  export const ProjectUpdateSchema: any;
}

declare module "../../../../../shared/schemas/referenceLogoSchemas.js" {
  export const ReferenceLogoCreateSchema: any;
  export const ReferenceLogoUpdateSchema: any;
}

declare module "../../../../../shared/schemas/serviceSchemas.js" {
  export const ServiceCreateSchema: any;
  export const ServiceUpdateSchema: any;
}

declare module "../../../../../shared/schemas/userSchemas.js" {
  export const UserCreateSchema: any;
  export const UserUpdateSchema: any;
}

declare module "../../../../../shared/schemas/documentSchemas.js" {
  export const DocumentCreateSchema: any;
  export const DocumentUpdateSchema: any;
  export const DocumentBulkDeleteSchema: any;
}

declare module "../../../../../shared/schemas/authSchemas.js" {
  export const AuthLoginSchema: any;
}

declare module "../../../../../shared/schemas/commonSchemas.js" {
  export const supportedLocales: readonly string[];
  export const LocaleSchema: any;
  export const MediaItemSchema: any;
}
