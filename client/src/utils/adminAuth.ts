const ADMIN_API = "/admin";

export const ADMIN_SESSION_KEY = "admin_password";

export function getAdminPassword(): string | null {
  return sessionStorage.getItem(ADMIN_SESSION_KEY);
}

export function clearAdminPassword() {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

/** Verifies a password against the server. Returns true if accepted. */
export async function verifyAdminPassword(password: string): Promise<boolean> {
  const res = await fetch(`${ADMIN_API}/games`, {
    headers: { "x-admin-password": password },
  });
  return res.ok;
}

export async function adminFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const password = getAdminPassword();
  return fetch(`${ADMIN_API}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      "x-admin-password": password ?? "",
    },
  });
}
