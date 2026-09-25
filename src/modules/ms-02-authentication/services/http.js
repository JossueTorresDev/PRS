import { getEnv } from "../../../shared/utils/env";

export const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');

export const getAccessToken = () => sessionStorage.getItem("accessToken");

const getSessionUser = () => {
  try {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAuthHeaders = (headers = {}) => {
  const token = getAccessToken();
  const user = getSessionUser();

  const merged = {
    "Content-Type": "application/json",
    ...(token && !headers.Authorization ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const municipalCode = user?.municipalCode;
  if (municipalCode && !merged["X-Municipal-Code"]) {
    merged["X-Municipal-Code"] = municipalCode;
  }

  return merged;
};

