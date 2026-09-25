import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";
import chromedriver from "chromedriver";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";

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
  try { return await Promise.race([building, limit]); }
  finally { clearTimeout(timer); }
}

const SQL_PAYLOADS = [
  "'; DROP TABLE maintenances; --",
  "1' OR '1'='1",
  "admin'--",
  "1; UPDATE maintenances SET maintenanceStatus='CONFIRMED' WHERE 1=1; --",
  "' UNION SELECT username, password FROM users --",
  "1' AND SLEEP(5) --",
];

const step = (msg) => console.log(`\n>>> ${msg}`);

const closeSwal = async (driver) => {
  await driver.executeScript(`
    document.querySelectorAll('.swal2-container, .swal2-popup').forEach(el => el.remove());
    document.body.style.overflow = '';
  `);
  await driver.sleep(500);
};

// ═══════════════════════════════════════════════════════════════════
// SEGURIDAD #1 — SQL Injection en campos de formulario de Mantenimiento escribe cosas raras para probar si se puede inyectar algo
// ═══════════════════════════════════════════════════════════════════
describe("Mantenimiento - Seguridad: SQL Injection en formulario", function () {
  this.timeout(300000);
  let driver;

  before(async function () {
    this.timeout(120000);
    step("Iniciando Chrome...");
    driver = await buildChromeDriver();
    step("Login...");
    const login = new LoginPage(driver, BASE);
    await login.navigateTo();
    await login.login(USER, PASS);
    await driver.sleep(3000);
    const body = await driver.findElement(By.tagName("body")).getText();
    if (body.includes("Credenciales incorrectas")) {
      throw new Error(`Login fallido para "${USER}".`);
    }
    await login.waitForDashboard();
    step("Login OK");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  for (let i = 0; i < SQL_PAYLOADS.length; i++) {
    const payload = SQL_PAYLOADS[i];

    it(`SQL Payload #${i + 1}: ${payload.substring(0, 50)}...`, async function () {
      step(`Navegando a /mantenimientos`);
      await driver.get(`${BASE}/mantenimientos`);
      await driver.sleep(3000);

      step("Abriendo formulario Nueva Solicitud");
      const nuevaBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(.,'Nueva Solicitud')]")),
        15000
      );
      await driver.executeScript("arguments[0].click()", nuevaBtn);
      await driver.sleep(2000);

      step(`Inyectando SQL en campo de descripción: ${payload}`);
      const descTa = await driver.wait(
        until.elementLocated(By.xpath("//textarea[contains(@placeholder,'tareas se deben')]")),
        5000
      );
      await descTa.clear();
      await descTa.sendKeys(payload);

      step(`Inyectando SQL en campo de problema reportado`);
      const probTa = await driver.wait(
        until.elementLocated(By.xpath("//textarea[contains(@placeholder,'fallo o motivo')]")),
        5000
      );
      await probTa.clear();
      await probTa.sendKeys(payload);

      step("Verificando que la aplicación NO crasheó");
      const pageSource = await driver.getPageSource();

      // Verificar 1: No debe haber error 500 visible
      const has500 = pageSource.includes("HTTP Status 500") ||
        pageSource.includes("Internal Server Error") ||
        pageSource.includes("org.springframework") ||
        pageSource.includes("java.sql.");
      expect(has500, "Se detectó error 500/SQL exception en la página (posible SQL Injection)").to.be.false;

      // Verificar 2: No debe haber stack trace de base de datos
      const hasDbError = pageSource.includes("PSQLException") ||
        pageSource.includes("SQLException") ||
        pageSource.includes("Table.*doesn't exist") ||
        pageSource.includes("syntax error") ||
        pageSource.includes("WARNING");
      expect(hasDbError, "Se detectó error de base de datos en la respuesta").to.be.false;

      // Verificar 3: El formulario debe seguir funcionando
      const formStillVisible = await driver.findElements(
        By.xpath("//h2[contains(.,'Nuevo Mantenimiento')]")
      );
      expect(formStillVisible.length, "El formulario desapareció tras inyectar SQL").to.be.greaterThan(0);

      step(`SQL Payload #${i + 1} no afectó la aplicación`);
      await closeSwal(driver);

      // Cerrar el formulario
      const closeBtn = await driver.findElements(
        By.xpath("//h2[contains(.,'Nuevo Mantenimiento')]/ancestor::div[contains(@class,'fixed')]//button[contains(@class,'hover:bg-slate-100')]")
      );
      if (closeBtn.length > 0) {
        await driver.executeScript("arguments[0].click()", closeBtn[0]);
        await driver.sleep(500);
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SEGURIDAD #2 — IDOR: Manipulación de IDs en acciones de estado, Forzar cambios para ver si se se puede manipular
// ═══════════════════════════════════════════════════════════════════
describe("Mantenimiento - Seguridad: IDOR en acciones de estado", function () {
  this.timeout(300000);
  let driver;
  let validToken;

  before(async function () {
    this.timeout(120000);
    step("Iniciando Chrome...");
    driver = await buildChromeDriver();
    step("Login...");
    const login = new LoginPage(driver, BASE);
    await login.navigateTo();
    await login.login(USER, PASS);
    await driver.sleep(3000);
    const body = await driver.findElement(By.tagName("body")).getText();
    if (body.includes("Credenciales incorrectas")) {
      throw new Error(`Login fallido para "${USER}".`);
    }
    await login.waitForDashboard();
    step("Login OK");

    // Obtener token válido de la sesión
    validToken = await driver.executeScript(
      "return sessionStorage.getItem('accessToken')"
    );
    step(`Token obtenido: ${validToken ? "Sí (" + validToken.substring(0, 20) + "...)" : "No"}`);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("Intentar iniciar mantenimiento con ID inexistente", async function () {
    const fakeId = "00000000-0000-0000-0000-000000000000";

    step(`Intentando POST /maintenances/${fakeId}/start con token válido`);
    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/maintenances/${fakeId}/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${validToken}'
        },
        body: JSON.stringify({ observations: 'IDOR test' })
      })
      .then(r => callback({ status: r.status, ok: r.ok }))
      .catch(e => callback({ error: e.message }));
    `);

    console.log(`>>> Response status: ${response.status}`);

    step("Verificando que la API rechaza la acción");
    expect(
      response.status === 404 || response.status === 403 || response.status === 400,
      `Esperaba 404/403/400 con ID inexistente, pero la API retornó ${response.status}`
    ).to.be.true;

    step("IDOR bloqueado para ID inexistente");
  });

  it("Intentar completar mantenimiento con ID falso", async function () {
    const fakeId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

    step(`Intentando POST /maintenances/${fakeId}/complete`);
    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/maintenances/${fakeId}/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${validToken}'
        },
        body: JSON.stringify({
          workOrder: 'OT-IDOR-TEST',
          appliedSolution: 'Test de seguridad IDOR',
          observations: 'Intento de manipulación'
        })
      })
      .then(r => callback({ status: r.status, ok: r.ok }))
      .catch(e => callback({ error: e.message }));
    `);

    console.log(`>>> Response status: ${response.status}`);

    step("Verificando que la API rechaza la completación");
    expect(
      response.status === 404 || response.status === 403 || response.status === 400,
      `Esperaba 404/403/400 con ID falso, pero la API retornó ${response.status}`
    ).to.be.true;

    step("IDOR bloqueado para completar con ID falso");
  });

  it("Intentar transición de estado inválida (CONFIRMED → IN_PROCESS)", async function () {
    step("Obteniendo primer mantenimiento de la lista");
    const maintenances = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/maintenances?page=0&size=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${validToken}'
        }
      })
      .then(r => r.json())
      .then(data => callback(data))
      .catch(e => callback({ error: e.message }));
    `);

    const items = maintenances?.content || maintenances?.data || maintenances || [];
    if (!Array.isArray(items) || items.length === 0) {
      console.log(">>> SKIP: No hay mantenimientos para probar transición inválida");
      this.skip();
      return;
    }

    const maintenance = items[0];
    const mId = maintenance.id;
    const currentStatus = maintenance.maintenanceStatus;
    step(`Mantenimiento encontrado: ${maintenance.maintenanceCode} (estado: ${currentStatus})`);

    // Intentar iniciar un mantenimiento que no está en SCHEDULED
    if (currentStatus !== "SCHEDULED") {
      step(`Intentando iniciar mantenimiento en estado ${currentStatus} (transición inválida)`);
      const response = await driver.executeAsyncScript(`
        var callback = arguments[arguments.length - 1];
        var mId = arguments[0];
        var token = arguments[1];
        fetch('${API_BASE}/maintenances/' + mId + '/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({ observations: 'Transicion invalida test' })
        })
        .then(function(r) { callback({ status: r.status, ok: r.ok }); })
        .catch(function(e) { callback({ error: e.message }); });
      `, mId, validToken);

      console.log(`>>> Response status: ${response.status}`);

      step("Verificando que la API rechaza la transición inválida");
      expect(
        response.status === 400 || response.status === 403 || response.status === 409,
        `Esperaba 400/403/409 para transición inválida, pero la API retornó ${response.status}`
      ).to.be.true;

      step("Transición inválida bloqueada correctamente");
    } else {
      step("Mantenimiento en SCHEDULED — probando transición inválida: CONFIRMED → IN_PROCESS");
      const response = await driver.executeAsyncScript(`
        var callback = arguments[arguments.length - 1];
        var mId = arguments[0];
        var token = arguments[1];
        fetch('${API_BASE}/maintenances/' + mId + '/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            conformityNumber: 'CONF-IDOR-TEST',
            workQuality: 'EXCELLENT',
            assetConditionAfter: 'OPERATIONAL',
            supplierRepresentativeName: 'Test',
            supplierRepresentativeDni: '12345678',
            userAreaResponsibleName: 'Test',
            userAreaResponsiblePosition: 'Tester',
            userAreaResponsibleDni: '12345678',
            patrimonialControllerName: 'Test',
            patrimonialControllerDni: '12345678'
          })
        })
        .then(function(r) { callback({ status: r.status, ok: r.ok }); })
        .catch(function(e) { callback({ error: e.message }); });
      `, mId, validToken);

      console.log(`>>> Response status: ${response.status}`);

      expect(
        response.status === 400 || response.status === 403 || response.status === 409,
        `Esperaba 400/403/409 para transición inválida, pero la API retornó ${response.status}`
      ).to.be.true;

      step("Transición inválida bloqueada correctamente");
    }
  });
});
