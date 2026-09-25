import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";
import chromedriver from "chromedriver";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";
import { InventoryListPage } from "./pages/InventoryListPage.js";
import { InventoryFormModal } from "./pages/InventoryFormModal.js";

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";
const USER = process.env.SIPREB_USER || "MunicipalidadDeCanete";
const PASS = process.env.SIPREB_PASS || "Admin@2026";
const API_BASE = "https://lab.vallegrande.edu.pe/gateway/api/v1";

async function buildChromeDriver({ headless = false, timeoutMs = 90000 } = {}) {
  const options = new Options();
  if (headless) options.addArguments("--headless=new");
  options.addArguments(
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1440,900"
  );

  const service = new ServiceBuilder(chromedriver.path);
  const building = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    .build();

  let timer;
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(
        "Chrome no inició a tiempo. Prueba:\n" +
        "  Stop-Process -Name chrome,chromedriver -Force -ErrorAction SilentlyContinue\n" +
        "  npm install"
      ));
    }, timeoutMs);
  });

  try {
    return await Promise.race([building, limit]);
  } finally {
    clearTimeout(timer);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRUEBA DE SEGURIDAD #1 — Acceso sin autenticación a rutas de Inventario
// ═══════════════════════════════════════════════════════════════════════════════

describe("Inventario - Seguridad #1: Acceso sin autenticación", function () {
  this.timeout(180000);
  let driver;

  before(async function () {
    this.timeout(120000);
    console.log("\n  [SEGURIDAD #1] Iniciando Chrome sin sesión activa...");
    driver = await buildChromeDriver();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("1.1 Sin sesión: /inventarios debe redirigir a /login", async function () {
    console.log("    Paso 1: Navegando a /inventarios sin haber iniciado sesión");
    await driver.get(`${BASE}/inventarios`);
    await driver.sleep(5000);

    const currentUrl = await driver.getCurrentUrl();
    console.log(`    Paso 2: URL obtenida → ${currentUrl}`);
    console.log("    Paso 3: Verificando redirección a /login");

    expect(currentUrl.includes("/login"),
      `FALLO: se pudo acceder a /inventarios sin login. URL: ${currentUrl}`
    ).to.be.true;

    expect(currentUrl.includes("/inventarios"),
      `FALLO: el usuario permaneció en /inventarios sin autenticación`
    ).to.be.false;

    const loginForm = await driver.findElements(By.id("username"));
    expect(loginForm.length,
      "FALLO: formulario de login no visible tras redirección"
    ).to.be.greaterThan(0);

    console.log("    Resultado: /inventarios redirigió a /login correctamente ✓");
  });

  it("1.2 Sin sesión: API de inventario rechaza petición sin token", async function () {
    console.log(`    Paso 1: Enviando GET ${API_BASE}/inventory sin token`);

    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/inventory', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(r => callback({ status: r.status, ok: r.ok }))
      .catch(e => callback({ error: e.message }));
    `);

    console.log(`    Paso 2: Respuesta del servidor → HTTP ${response.status}`);
    console.log("    Paso 3: Verificando que retorna 401 o 403");

    expect(response.status === 401 || response.status === 403,
      `FALLO: la API retornó HTTP ${response.status} en lugar de 401/403`
    ).to.be.true;

    console.log(`    Resultado: API rechazó petición sin token (HTTP ${response.status}) ✓`);
  });

  it("1.3 Sin sesión: API de inventario rechaza token inválido/manipulado", async function () {
    const fakeToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrZXIiLCJyb2xlIjoiQURNSU4ifQ.fake_signature";
    console.log("    Paso 1: Creando JWT falso (sub=hacker, role=ADMIN)");
    console.log(`    Paso 2: Enviando GET /inventory con token fabricado`);

    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/inventory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${fakeToken}'
        }
      })
      .then(r => callback({ status: r.status, ok: r.ok }))
      .catch(e => callback({ error: e.message }));
    `);

    console.log(`    Paso 3: Respuesta del servidor → HTTP ${response.status}`);
    console.log("    Paso 4: Verificando que rechaza el token manipulado");

    expect(response.status === 401 || response.status === 403,
      `FALLO: la API aceptó un token falso (HTTP ${response.status})`
    ).to.be.true;

    console.log(`    Resultado: API rechazó token manipulado (HTTP ${response.status}) ✓`);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRUEBA DE SEGURIDAD #2 — Aislamiento Multi-Tenant en Inventario
// ═══════════════════════════════════════════════════════════════════════════════

const TENANT_A = { user: "MunicipalidadDeCanete", pass: "Admin@2026", name: "Cañete" };
const TENANT_B = { user: "SanLuis", pass: "Admin@2026", name: "San Luis" };

describe("Inventario - Seguridad #2: Aislamiento Multi-Tenant", function () {
  this.timeout(300000);
  let driver;

  let tokenA, municipalCodeA, inventoryA, uiDataA;
  let tokenB, municipalCodeB, inventoryB, uiDataB;

  async function loginAndGetSession(login, username, password) {
    await login.navigateTo();
    await login.login(username, password);
    await driver.sleep(3000);

    const body = await driver.findElement(By.tagName("body")).getText();
    if (body.includes("Credenciales incorrectas")) {
      throw new Error(`Login fallido para "${username}". Credenciales inválidas.`);
    }

    await login.waitForDashboard();

    const token = await driver.executeScript("return sessionStorage.getItem('accessToken')");
    const municipalCode = await driver.executeScript("return sessionStorage.getItem('municipalCode')");
    return { token, municipalCode };
  }

  async function logout() {
    await driver.executeScript(`
      sessionStorage.clear();
      localStorage.clear();
    `);
    await driver.get(`${BASE}/login`);
    await driver.sleep(2000);
  }

  async function fetchInventory(token) {
    return driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/inventory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + arguments[0]
        }
      })
      .then(async r => {
        let body = null;
        try { body = await r.json(); } catch(e) { body = await r.text(); }
        callback({ status: r.status, body: body });
      })
      .catch(e => callback({ error: e.message }));
    `, token);
  }

  async function navigateToInventoryAndCapture(sidebar) {
    await sidebar.goToInventarios();
    await driver.sleep(3000);

    const rowCount = await driver.findElements(By.xpath("//tbody/tr"));
    const tableText = await driver.executeScript(`
      const rows = document.querySelectorAll('tbody tr');
      const data = [];
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length > 0) {
          data.push({
            code: cells[0]?.innerText?.trim() || '',
            description: cells[1]?.innerText?.trim() || '',
            status: cells[2]?.innerText?.trim() || ''
          });
        }
      });
      return JSON.stringify(data);
    `);

    const municipalCode = await driver.executeScript("return sessionStorage.getItem('municipalCode')");

    return {
      rowCount: rowCount.length,
      tableData: JSON.parse(tableText || "[]"),
      municipalCode
    };
  }

  before(async function () {
    this.timeout(180000);
    console.log("\n  [SEGURIDAD #2] Iniciando Chrome...");
    driver = await buildChromeDriver();
    const login = new LoginPage(driver, BASE);
    const sidebar = new SidebarPage(driver, BASE);

    console.log("  [SEGURIDAD #2] Login con MunicipalidadDeCanete...");
    const sessionA = await loginAndGetSession(login, TENANT_A.user, TENANT_A.pass);
    tokenA = sessionA.token;
    municipalCodeA = sessionA.municipalCode;
    console.log(`  [SEGURIDAD #2] Navegando a /inventarios (Cañete)...`);
    uiDataA = await navigateToInventoryAndCapture(sidebar);

    const respA = await fetchInventory(tokenA);
    inventoryA = respA.status === 200
      ? (Array.isArray(respA.body) ? respA.body : (respA.body?.content || respA.body?.data || []))
      : [];

    console.log("  [SEGURIDAD #2] Cerrando sesión...");
    await logout();

    console.log("  [SEGURIDAD #2] Login con SanLuis...");
    const sessionB = await loginAndGetSession(login, TENANT_B.user, TENANT_B.pass);
    tokenB = sessionB.token;
    municipalCodeB = sessionB.municipalCode;
    console.log(`  [SEGURIDAD #2] Navegando a /inventarios (San Luis)...`);
    uiDataB = await navigateToInventoryAndCapture(sidebar);

    const respB = await fetchInventory(tokenB);
    inventoryB = respB.status === 200
      ? (Array.isArray(respB.body) ? respB.body : (respB.body?.content || respB.body?.data || []))
      : [];
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("2.1 Los dos tenants tienen municipalCode distintos (son organizaciones separadas)", async function () {
    console.log(`    Paso 1: MunicipalidadDeCanete → municipalCode: ${municipalCodeA}`);
    console.log(`    Paso 2: SanLuis → municipalCode: ${municipalCodeB}`);
    console.log("    Paso 3: Comparando que sean diferentes");

    expect(municipalCodeA, "MunicipalidadDeCanete no tiene municipalCode").to.not.be.null;
    expect(municipalCodeB, "SanLuis no tiene municipalCode").to.not.be.null;
    expect(municipalCodeA,
      `FALLO: ambos tenants tienen el mismo municipalCode "${municipalCodeA}"`
    ).to.not.equal(municipalCodeB);

    console.log("    Resultado: Los municipalCodes son distintos — tenants separados ✓");
  });

  it("2.2 Frontend /inventarios muestra datos distintos para cada tenant", async function () {
    console.log(`    Paso 1: Cañete navegó a /inventarios → ${uiDataA.rowCount} registros en tabla`);
    if (uiDataA.tableData.length > 0) {
      uiDataA.tableData.forEach((row, i) => {
        console.log(`             [${i + 1}] ${row.code} | ${row.description} | ${row.status}`);
      });
    }
    console.log(`    Paso 2: San Luis navegó a /inventarios → ${uiDataB.rowCount} registros en tabla`);
    if (uiDataB.tableData.length > 0) {
      uiDataB.tableData.forEach((row, i) => {
        console.log(`             [${i + 1}] ${row.code} | ${row.description} | ${row.status}`);
      });
    }
    console.log("    Paso 3: Verificando que no comparten registros");

    expect(uiDataA.municipalCode, "Cañete no tiene municipalCode en sesión").to.not.be.null;
    expect(uiDataB.municipalCode, "San Luis no tiene municipalCode en sesión").to.not.be.null;
    expect(uiDataA.municipalCode,
      "FALLO: ambos tenants ven la misma sesión"
    ).to.not.equal(uiDataB.municipalCode);

    if (uiDataA.rowCount > 0 && uiDataB.rowCount > 0) {
      const codesA = uiDataA.tableData.map(r => r.code).filter(Boolean);
      const codesB = uiDataB.tableData.map(r => r.code).filter(Boolean);
      const shared = codesA.filter(c => codesB.includes(c));

      expect(shared.length,
        `FALLO: ${shared.length} inventarios compartidos: [${shared.join(", ")}]`
      ).to.equal(0);
    }

    console.log("    Resultado: Cada tenant ve solo su propio inventario en la UI ✓");
  });

  it("2.3 Inventarios obtenidos por API pertenecen SOLO a su tenant", async function () {
    console.log(`    Paso 1: API con token de Cañete retornó ${inventoryA.length} inventarios`);
    console.log(`    Paso 2: API con token de San Luis retornó ${inventoryB.length} inventarios`);
    console.log("    Paso 3: Verificando que no hay datos cruzados entre tenants");

    if (inventoryA.length > 0) {
      const leak = inventoryA.some(i => {
        const mid = i.municipalityId || i.municipalCode || "";
        return mid && String(mid) === String(municipalCodeB);
      });
      expect(leak, `FALLO: API de Cañete retornó datos de San Luis`).to.be.false;
    }

    if (inventoryB.length > 0) {
      const leak = inventoryB.some(i => {
        const mid = i.municipalityId || i.municipalCode || "";
        return mid && String(mid) === String(municipalCodeA);
      });
      expect(leak, `FALLO: API de San Luis retornó datos de Cañete`).to.be.false;
    }

    console.log("    Resultado: API retorna solo datos del tenant autenticado ✓");
  });

  it("2.4 Token de San Luis NO puede acceder a inventario de Cañete via X-Municipal-Code", async function () {
    console.log("    Paso 1: Usando token de San Luis con X-Municipal-Code de Cañete");
    console.log(`    Paso 2: Enviando GET /inventory con header manipulado`);

    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/inventory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + arguments[0],
          'X-Municipal-Code': arguments[1]
        }
      })
      .then(async r => {
        let body = null;
        try { body = await r.json(); } catch(e) { body = await r.text(); }
        callback({ status: r.status, body: body });
      })
      .catch(e => callback({ error: e.message }));
    `, tokenB, municipalCodeA);

    console.log(`    Paso 3: Respuesta del servidor → HTTP ${response.status}`);
    console.log("    Paso 4: Verificando que no se filtraron datos de Cañete");

    if (response.status === 403 || response.status === 401) {
      expect(true).to.be.true;
    } else if (response.status === 200) {
      const inventory = Array.isArray(response.body) ? response.body :
        (response.body?.content || response.body?.data || []);
      const gotCaneteData = inventory.some(i => {
        const mid = i.municipalityId || i.municipalCode || "";
        return mid && String(mid) === String(municipalCodeA);
      });
      expect(gotCaneteData,
        `FALLO: token de San Luis accedió a datos de Cañete manipulando X-Municipal-Code`
      ).to.be.false;
    }

    console.log(`    Resultado: San Luis NO pudo acceder a datos de Cañete (HTTP ${response.status}) ✓`);
  });

  it("2.5 Token de Cañete NO puede acceder a inventario de San Luis via X-Municipal-Code", async function () {
    console.log("    Paso 1: Usando token de Cañete con X-Municipal-Code de San Luis");
    console.log(`    Paso 2: Enviando GET /inventory con header manipulado`);

    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/inventory', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + arguments[0],
          'X-Municipal-Code': arguments[1]
        }
      })
      .then(async r => {
        let body = null;
        try { body = await r.json(); } catch(e) { body = await r.text(); }
        callback({ status: r.status, body: body });
      })
      .catch(e => callback({ error: e.message }));
    `, tokenA, municipalCodeB);

    console.log(`    Paso 3: Respuesta del servidor → HTTP ${response.status}`);
    console.log("    Paso 4: Verificando que no se filtraron datos de San Luis");

    if (response.status === 403 || response.status === 401) {
      expect(true).to.be.true;
    } else if (response.status === 200) {
      const inventory = Array.isArray(response.body) ? response.body :
        (response.body?.content || response.body?.data || []);
      const gotSanLuisData = inventory.some(i => {
        const mid = i.municipalityId || i.municipalCode || "";
        return mid && String(mid) === String(municipalCodeB);
      });
      expect(gotSanLuisData,
        `FALLO: token de Cañete accedió a datos de San Luis manipulando X-Municipal-Code`
      ).to.be.false;
    }

    console.log(`    Resultado: Cañete NO pudo acceder a datos de San Luis (HTTP ${response.status}) ✓`);
  });
});
