export const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();

export const hasGoogleClientId = !!googleClientId;
