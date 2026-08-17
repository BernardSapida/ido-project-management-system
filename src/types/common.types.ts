import type { USER_ROLES } from "@/utils/config";

export type Role = keyof typeof USER_ROLES;

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; message?: string };
