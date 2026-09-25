# Sistema de Configuración con Caché

Sistema simple de caché para endpoints de configuración del microservicio de patrimonio.

## 🚀 Uso Rápido

```javascript
import useConfigurationData from '../../hooks/useConfigurationData';

function MiComponente() {
  const { categories, areas, loading, error, reload } = useConfigurationData();
  
  useEffect(() => {
    reload(); // Cargar datos cuando sea necesario
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Alert>{error}</Alert>;

  return (
    <SelectSearch
      label="Categoría"
      options={categories}
      valueKey="id"
      labelKey="label"
    />
  );
}
```

## 📦 Características

- ✅ Caché en localStorage (5 minutos)
- ✅ Modo offline automático
- ✅ Normalización de datos para SelectSearch
- ✅ Manejo de errores

## 🔧 Configuración

`.env`:
```env
VITE_CONFIGURATION_API_URL=http://localhost:5003/api
```

## 🛠️ Endpoints

- `/api/areas` - Áreas
- `/api/categories` - Categorías  
- `/api/locations` - Ubicaciones
- `/api/responsible` - Responsables
- `/api/suppliers` - Proveedores

## 📚 Documentación

- [Guía Técnica](./CACHE_DOCS.md) - Detalles completos
- [Implementación Real](./components/assets/AssetModal.jsx) - Ejemplo

## 🐛 Troubleshooting

```javascript
// Limpiar caché manualmente
import { clearCache } from './services/configurationService';
clearCache();
```
