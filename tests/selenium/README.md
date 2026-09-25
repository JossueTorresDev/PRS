# SIPREB — Pruebas Automatizadas con Selenium

Suite E2E con Mocha + Chai + selenium-webdriver. Cada módulo del SIPREB tiene su propia carpeta con page objects y tests.

## Stack

- **Mocha** — test runner
- **Chai** — aserciones (`expect`)
- **selenium-webdriver** — automatización de Chrome
- **Page Object Model** — cada pantalla/interacción es una clase que hereda de `BasePage`
- **Localizadores**: usar `By.xpath` siempre

## Estructura

```
tests/selenium/
  pages/                       ← Page objects COMPARTIDOS (todo módulo los usa)
    BasePage.js                ← navegación, jsClick, sendKeys, isVisible
    LoginPage.js               ← login(username, password), waitForDashboard()
    SidebarPage.js             ← goToBienes(), … (agregar según módulo)
  modulo/                      ← reemplazar "modulo" por patrimonio, inventario, mantenimiento, …
    pages/                     ← page objects específicos del módulo
      FooListPage.js
      FooModal.js
    modulo.test.js             ← tests
  reports/                     ← capturas de pantalla al fallar
  package.json
```

## Requisitos

- Node.js 18+
- Chrome

## Ejecutar

```bash
cd tests/selenium && npm test            # solo este módulo
npm run test:selenium                    # desde la raíz del proyecto
```

Para ver el navegador: cambiar `--headless=new` por `--headless=false` en `before()`.

## Ciclo de vida de un test

```
1. before() → abrir Chrome, login, esperar dashboard
2. it()     → navegar al módulo, hacer acciones, verificar
3. after()  → driver.quit()
```

## Crear tests para otro módulo

### 1. Carpeta

```
tests/selenium/inventario/
  pages/        ← acá van los page objects
  inventario.test.js
```

### 2. Page Object (opcional pero recomendado)

Heredar de `BasePage`. Cada selector es una propiedad de clase con `By.xpath`:

```js
import { By } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class InventarioPage extends BasePage {
  TITLE = By.xpath("//h1[contains(.,'Inventarios')]");
  NUEVO = By.xpath("//button[contains(.,'Nuevo Inventario')]");
}
```

Disponible en `BasePage`: `navigateTo()`, `jsClick(by)`, `sendKeys(by, text)`, `getText(by)`, `isVisible(by, timeout)`.

### 3. Test

```js
import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";
import { InventarioPage } from "./pages/InventarioPage.js";

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";

describe("Inventario", function () {
  this.timeout(300000);
  let driver;

  before(async function () {
    driver = await new Builder().forBrowser("chrome")
      .setChromeOptions(["--headless=new", "--no-sandbox", "--window-size=1440,900"])
      .build();
    await new LoginPage(driver, BASE).navigateTo();
    await new LoginPage(driver, BASE).login("MunicipalidadDeCanete", "Admin@2026");
    await new LoginPage(driver, BASE).waitForDashboard();
  });

  after(async () => driver.quit());

  it("1. Crear inventario", async function () {
    await new SidebarPage(driver, BASE).goToBienes();
    // ...
  });
});
```

### 4. package.json

```json
"scripts": { "test": "mocha '*/**.test.js' --timeout 60000" }
```

## Page Objects compartidos

| Clase | Métodos clave |
|-------|---------------|
| `BasePage` | `navigateTo(path)`, `jsClick(by)`, `sendKeys(by, text)`, `getText(by)`, `isVisible(by, timeout)` |
| `LoginPage` | `navigateTo()`, `login(user, pass)`, `waitForDashboard()` |
| `SidebarPage` | `goToBienes()`, (agregar según módulo) |

## Ejemplo real: módulo patrimonio

Referencia concreta para copiar el patrón:

| Archivo | Qué contiene |
|---------|-------------|
| `patrimonio/patrimonio.test.js` | 3 tests: crear bien, cambiar estado, ver depreciación |
| `patrimonio/pages/AssetListPage.js` | actions sobre la tabla: search, clickNuevoBien, _findRowByText, clickEditOnRow, clickDepreciationOnRow, getStatusOnRow |
| `patrimonio/pages/AssetModal.js` | formulario de 5 tabs con _pickCombobox para SelectSearch, fillAll con SBN, datos técnicos, financieros, ubicación y documentación |

### Patrones usados en patrimonio

- **SelectSearch (combobox)**: no son `<select>` nativos, usar `_pickCombobox(label)` que hace click → espera opciones → click en primera opción
- **Select nativo**: `new Select(await driver.findElement(locator)).selectByValue(...)`
- **Campos readonly**: modificar con `executeScript` para forzar el set del value
- **Campos de fecha**: enviar formato `DDMMYYYY` (ej: `01012025`)
- **Tabs**: click en el tab antes de interactuar con sus campos
- **Validación de error**: buscar un div con clase `bg-red-50 text-red-700`
- **Console errors**: errores 404/401 de `/notifications` y `/ws/notifications` son ruido del backend, no afectan los tests
- **closeSwal**: remueve modales de SweetAlert2 del DOM si bloquean la interacción

## Reglas

- Todo selector es `By.xpath` (no CSS, no id, a menos que sea un `<select>` nativo)
- Los page objects compartidos se importan desde `../pages/`
- Los page objects del módulo se importan desde `./pages/`
- Cada módulo es autocontenido en su carpeta: puede tener sus propios page objects sin afectar a otros módulos
- Usar `driver.executeScript("arguments[0].click()", el)` para clicks que fallen por elementos solapados
- Los tests deben ser independientes entre sí (no dependen de estado compartido)
- El timestamp `Date.now()` es el mecanismo estándar para generar datos únicos y evitar colisiones
