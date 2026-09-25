export const normalizeRoleName = (role) => {
  if (!role) return "";
  if (typeof role === "string") {
    return role.replace(/^ROLE_/, "");
  }
  const value = role.authority || role.name || role.role || "";
  return String(value).replace(/^ROLE_/, "");
};

export const normalizeRoles = (roles) => {
  if (!roles) return [];
  const list = Array.isArray(roles) ? roles : [roles];
  return [...new Set(list.map(normalizeRoleName).filter(Boolean))];
};

export const extractRolesFromToken = (token) => {
  if (!token) return [];
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const raw =
      payload.roles ||
      payload.authorities ||
      payload.role ||
      payload.rol ||
      [];
    return normalizeRoles(raw);
  } catch {
    return [];
  }
};
