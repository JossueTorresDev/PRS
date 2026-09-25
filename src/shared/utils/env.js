const runtimeConfig = typeof window !== 'undefined' ? window.__RUNTIME_CONFIG__ ?? {} : {};
const buildConfig = import.meta.env ?? {};

export function getEnv(key, fallback = '') {
  const runtimeValue = runtimeConfig[key];
  if (runtimeValue !== undefined && runtimeValue !== null && runtimeValue !== '') {
    return runtimeValue;
  }

  const buildValue = buildConfig[key];
  if (buildValue !== undefined && buildValue !== null && buildValue !== '') {
    return buildValue;
  }

  return fallback;
}
