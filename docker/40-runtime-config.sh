#!/bin/sh
set -eu

# Establecer defaults si no se proporcionan en tiempo de ejecuciÃ³n
# Esto asegura valores vÃ¡lidos para envsubst
VITE_GATEWAY_API_URL=${VITE_GATEWAY_API_URL:-https://lab.vallegrande.edu.pe/gateway/api/v1}
VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-https://uannlnmvkwrfpyimaaby.supabase.co}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-.}
export VITE_GATEWAY_API_URL VITE_SUPABASE_URL VITE_SUPABASE_ANON_KEY

# Sustituir variables en el template JSON y codificar en base64
CONFIG_B64=$(envsubst < /opt/config.template.js | base64 | tr -d '\n')

# Exportar script inline â€” usamos ENVIRON en awk para evitar problemas de escaping con JWT
export INLINE_SCRIPT="<script>window.__RUNTIME_CONFIG__=JSON.parse(atob('${CONFIG_B64}'));</script>"

# Reemplazar el placeholder en index.html
INDEX=/usr/share/nginx/html/index.html
awk 'BEGIN{s=ENVIRON["INLINE_SCRIPT"]} /<!-- RUNTIME_CONFIG -->/{print s; next} {print}' \
  "$INDEX" > "${INDEX}.tmp" && mv "${INDEX}.tmp" "$INDEX"
