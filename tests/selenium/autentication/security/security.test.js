import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";
import chromedriver from "chromedriver";
import fs from "fs";
import { LoginPage } from "../../pages/LoginPage.js";
import { SidebarPage } from "../../pages/SidebarPage.js";
import { PersonasListPage } from "../personas/pages/PersonasListPage.js";
import { PersonModal } from "../personas/pages/PersonModal.js";

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";
const USER = process.env.SIPREB_USER || process.env.USERNAME || "MunicipalidadDeCanete";
const PASS = process.env.SIPREB_PASS || process.env.PASSWORD || "Admin@2026";
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

const XSS_PAYLOADS = [
  `<script>alert('XSS')</script>`,
  `<img src=x onerror=alert('XSS')>`,
  `"><script>alert(document.cookie)</script>`,
  `<svg onload=alert('XSS')>`,
  `javascript:alert('XSS')`,
];

const step = (msg) => console.log(`\n>>> ${msg}`);

// ═══════════════════════════════════════════════════════════════════
// SEGURIDAD #1 — XSS en campos de formulario
// ═══════════════════════════════════════════════════════════════════
describe("Seguridad — XSS en formulario de Personas", function () {
  this.timeout(300000);
  let driver;

  before(async function () {
    this.timeout(120000);
    console.log("[1/3] Iniciando Chrome...");
    driver = await buildChromeDriver();
    console.log("[2/3] Login...");
    const login = new LoginPage(driver, BASE);
    await login.navigateTo();
    await login.login(USER, PASS);
    await driver.sleep(3000);

    const body = await driver.findElement(By.tagName("body")).getText();
    if (body.includes("Credenciales incorrectas")) {
      throw new Error(`Login fallido para "${USER}". Credenciales inválidas.`);
    }

    await login.waitForDashboard();
    console.log("[3/3] Login OK");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  const closeSwal = async () => {
    await driver.executeScript(`
      document.querySelectorAll('.swal2-container, .swal2-popup').forEach(el => el.remove());
      document.body.style.overflow = '';
    `);
    await driver.sleep(500);
  };

  for (let i = 0; i < XSS_PAYLOADS.length; i++) {
    const payload = XSS_PAYLOADS[i];

    it(`XSS Payload #${i + 1}: ${payload.substring(0, 40)}...`, async function () {
      const sidebar = new SidebarPage(driver, BASE);
      const list = new PersonasListPage(driver, BASE);
      const modal = new PersonModal(driver, BASE);
      const TS = Date.now();

      step("Navegando a /personas");
      await sidebar.goToPersonas();
      expect(await list.isLoaded()).to.be.true;

      step("Abriendo formulario Nueva Persona");
      await list.clickNuevaPersona();
      await modal.waitOpen();

      step(`Inyectando XSS en campos: ${payload}`);

      // Inyectar payload en campo de Nombres
      const firstNameInput = await driver.wait(
        until.elementLocated(By.xpath("//input[@name='firstName']")),
        10000
      );
      await firstNameInput.clear();
      await firstNameInput.sendKeys(payload);

      // Inyectar payload en campo de Apellidos
      const lastNameInput = await driver.findElement(
        By.xpath("//input[@name='lastName']")
      );
      await lastNameInput.clear();
      await lastNameInput.sendKeys(payload);

      // Inyectar payload en campo de Dirección
      const addressInput = await driver.findElement(
        By.xpath("//textarea[@name='address']")
      );
      await addressInput.clear();
      await addressInput.sendKeys(payload);

      // Inyectar payload en campo de Email
      const emailInput = await driver.findElement(
        By.xpath("//input[@name='personalEmail']")
      );
      await emailInput.clear();
      await emailInput.sendKeys(`test${TS}@example.com`);

      // Completar campos requeridos válidos para que el form sea válido
      await modal.selectDocumentType(1);
      await modal.setDocumentNumber(`76${String(TS).slice(-6)}`.slice(0, 8));
      await modal.setBirthDate("15", "06", "1990");
      await modal.setPersonalPhone(`9${String(TS).slice(-8)}`.slice(0, 9));

      step("Guardando formulario");
      await modal.clickSubmit();
      await driver.sleep(3000);

      // Cerrar SweetAlert si aparece
      await closeSwal();

      step("Verificando que NO se ejecutó ningún script XSS");

      // Verificar 1: No debe haber ningún弹窗 de alert activo
      const alerts = await driver.findElements(
        By.xpath("//div[contains(@class,'swal2')]//h2[contains(.,'alert')]")
      );
      expect(alerts.length, "Se detectó un弹窗 de alert (XSS ejecutado)").to.equal(0);

      // Verificar 2: El body no debe contener el payload renderizado como HTML
      const bodyHtml = await driver.getPageSource();
      const xssInHtml = bodyHtml.includes(payload);
      expect(xssInHtml, "El payload XSS aparece en el HTML (posible XSS reflejado)").to.be.false;

      // Verificar 3: No debe haber scripts no deseados en el DOM
      const scripts = await driver.findElements(
        By.xpath("//script[contains(.,'alert') and contains(.,'XSS')]")
      );
      expect(scripts.length, "Se encontró un script XSS inyectado en el DOM").to.equal(0);

      // Verificar 4: Si la persona se creó, el nombre debe ser texto plano
      const bodyText = await driver.executeScript("return document.body.innerText");
      const xssVisible = bodyText.includes(payload);
      expect(
        xssVisible,
        "El payload XSS se muestra como texto visible (puede ser XSS almacenado)"
      ).to.be.false;

      console.log(`>>> XSS Payload #${i + 1} neutralizado correctamente`);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SEGURIDAD #2 — Acceso sin autenticación a rutas protegidas
// ═══════════════════════════════════════════════════════════════════
describe("Seguridad — Acceso sin autenticación", function () {
  this.timeout(180000);
  let driver;

  before(async function () {
    this.timeout(120000);
    console.log("[1/2] Iniciando Chrome (sin login)...");
    driver = await buildChromeDriver();
    console.log("[2/2] Chrome listo (sin sesión activa)");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  const PROTECTED_ROUTES = [
    { path: "/personas", name: "Personas" },
    { path: "/bienes", name: "Bienes (Patrimonio)" },
    { path: "/movimientos", name: "Movimientos" },
    { path: "/actas", name: "Actas de Entrega" },
    { path: "/proveedores", name: "Proveedores" },
  ];

  for (const route of PROTECTED_ROUTES) {
    it(`Sin sesión: ${route.name} (${route.path}) debe redirigir a login`, async function () {
      step(`Navegando a ${route.path} SIN autenticación`);

      // Navegar directamente a la ruta protegida SIN hacer login
      await driver.get(`${BASE}${route.path}`);
      await driver.sleep(3000);

      const currentUrl = await driver.getCurrentUrl();
      console.log(`>>> URL actual: ${currentUrl}`);

      step("Verificando redirección a /login");

      // Verificar 1: La URL debe contener /login
      expect(
        currentUrl.includes("/login"),
        `Esperaba redirección a /login, pero la URL es: ${currentUrl}`
      ).to.be.true;

      // Verificar 2: No debe estar en la ruta original
      expect(
        currentUrl.includes(route.path),
        `El usuario pudo acceder a ${route.path} sin autenticación`
      ).to.be.false;

      // Verificar 3: Debe mostrar el formulario de login
      const loginForm = await driver.findElements(By.id("username"));
      expect(
        loginForm.length,
        "El formulario de login no está visible después de la redirección"
      ).to.be.greaterThan(0);

      console.log(`>>> ${route.name} bloqueado correctamente — redirige a login`);
    });
  }

  it("Sin sesión: intentar acceder a API directamente (sin token)", async function () {
    step("Haciendo request GET a /persons sin token de autenticación");

    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/persons', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(r => callback({ status: r.status, ok: r.ok }))
      .catch(e => callback({ error: e.message }));
    `);

    console.log(`>>> Response status: ${response.status}`);

    step("Verificando que la API rechaza la petición sin token");

    // La API debe retornar 401 o 403 (no autorizado o prohibido)
    expect(
      response.status === 401 || response.status === 403,
      `Esperaba 401 o 403, pero la API retornó ${response.status}`
    ).to.be.true;

    console.log(`>>> API rechazó petición sin token: HTTP ${response.status}`);
  });

  it("Sin sesión: intentar acceder con token inválido", async function () {
    step("Haciendo request GET a /persons con token falso");

    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/persons', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token_falso_12345'
        }
      })
      .then(r => callback({ status: r.status, ok: r.ok }))
      .catch(e => callback({ error: e.message }));
    `);

    console.log(`>>> Response status: ${response.status}`);

    step("Verificando que la API rechaza el token inválido");

    expect(
      response.status === 401 || response.status === 403,
      `Esperaba 401 o 403 con token falso, pero la API retornó ${response.status}`
    ).to.be.true;

    console.log(`>>> API rechazó token inválido: HTTP ${response.status}`);
  });
});
