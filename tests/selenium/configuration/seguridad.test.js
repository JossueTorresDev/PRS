import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/edge.js";
import { download as getEdgeDriverPath } from "edgedriver";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";
import { CategoryListPage } from "./pages/CategoryListPage.js";
import { CategoryFormModal } from "./pages/CategoryFormModal.js";

const { BASE_URL, SIPREB_USER, SIPREB_PASS, API_BASE } = process.env;
if (!BASE_URL) throw new Error("Falta variable de entorno: BASE_URL");
if (!SIPREB_USER) throw new Error("Falta variable de entorno: SIPREB_USER");
if (!SIPREB_PASS) throw new Error("Falta variable de entorno: SIPREB_PASS");
if (!API_BASE) throw new Error("Falta variable de entorno: API_BASE");
const BASE = BASE_URL;
const USER = SIPREB_USER;
const PASS = SIPREB_PASS;

async function buildEdgeDriver({ headless = false, timeoutMs = 90000 } = {}) {
  const options = new Options();
  if (headless) options.addArguments("--headless=new");
  options.addArguments(
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1440,900"
  );
  const edgedriverPath = await getEdgeDriverPath();
  const service = new ServiceBuilder(edgedriverPath);
  const building = new Builder()
    .forBrowser("MicrosoftEdge")
    .setEdgeOptions(options)
    .setEdgeService(service)
    .build();
  let timer;
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(
        "Edge no inici\u00F3 a tiempo. Prueba:\n" +
        "  Stop-Process -Name msedge,msedgedriver -Force -ErrorAction SilentlyContinue\n" +
        "  npm install"
      ));
    }, timeoutMs);
  });
  try { return await Promise.race([building, limit]); }
  finally { clearTimeout(timer); }
}

const XSS_PAYLOADS = [
  { payload: `<script>alert('XSS')</script>`, isUrlScheme: false },
  { payload: `<img src=x onerror=alert('XSS')>`, isUrlScheme: false },
  { payload: `"><script>alert(document.cookie)</script>`, isUrlScheme: false },
  { payload: `<svg onload=alert('XSS')>`, isUrlScheme: false },
  { payload: `javascript:alert('XSS')`, isUrlScheme: true },
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
// SEGURIDAD #1 — XSS en campo de descripción del formulario de Categorías
// ═══════════════════════════════════════════════════════════════════
describe("Categor\u00EDas - Seguridad: XSS en formulario de edici\u00F3n", function () {
  this.timeout(300000);
  let driver;

  before(async function () {
    this.timeout(120000);
    step("Iniciando Edge...");
    driver = await buildEdgeDriver();
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

  for (let i = 0; i < XSS_PAYLOADS.length; i++) {
    const { payload, isUrlScheme } = XSS_PAYLOADS[i];

    it(`XSS Payload #${i + 1}: ${payload.substring(0, 40)}...`, async function () {
      const sidebar = new SidebarPage(driver, BASE);
      const list = new CategoryListPage(driver, BASE);
      const form = new CategoryFormModal(driver, BASE);

      step("Navegando a /categorias");
      await sidebar.goToCategorias();
      expect(await list.isLoaded()).to.be.true;
      await list.setFilter("todos");
      await driver.sleep(1000);
      await list.waitForTable();

      const totalRows = await list.getRowCount();
      if (totalRows === 0) {
        console.log(">>> SKIP: No hay categor\u00EDas para editar");
        this.skip();
        return;
      }

      const codigo = await list.getFirstRowCode();
      step(`Editando categor\u00EDa: ${codigo}`);

      await list.clickEditOnFirstRow();
      await driver.sleep(1000);

      step(`Inyectando XSS en campo de descripci\u00F3n: ${payload}`);
      await form.setDescription(payload);
      await driver.sleep(500);

      step("Verificando que NO se ejecut\u00F3 el payload XSS");

      const bodyHtml = await driver.getPageSource();
      const scripts = await driver.findElements(
        By.xpath("//script[contains(.,'alert') and contains(.,'XSS')]")
      );
      expect(scripts.length, "Se encontr\u00F3 un script XSS inyectado en el DOM").to.equal(0);

      if (isUrlScheme) {
        const hrefXss = bodyHtml.includes(`href="${payload}"`) || bodyHtml.includes(`src="${payload}"`);
        expect(hrefXss, "El payload javascript: aparece en un atributo href/src ejecutable").to.be.false;
      } else {
        const xssInHtml = bodyHtml.includes(payload);
        expect(xssInHtml, "El payload XSS aparece sin escapar en el HTML (posible XSS reflejado)").to.be.false;

        const bodyText = await driver.executeScript("return document.body.innerText");
        const xssVisible = bodyText.includes(payload);
        expect(
          xssVisible,
          "El payload XSS se muestra como texto visible (puede ser XSS almacenado)"
        ).to.be.false;
      }

      step(`XSS Payload #${i + 1} neutralizado correctamente`);

      const closeBtn = await driver.findElements(
        By.xpath("//h2[text()='Editar Categor\u00EDa']/ancestor::div[contains(@class,'rounded-3xl')]//button[contains(@class,'hover:bg-slate-100')]")
      );
      if (closeBtn.length > 0) {
        await driver.executeScript("arguments[0].click()", closeBtn[0]);
        await driver.sleep(500);
      }
      await closeSwal(driver);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════
// SEGURIDAD #2 — Acceso no autorizado a rutas y API de Categorías
// ═══════════════════════════════════════════════════════════════════
describe("Categor\u00EDas - Seguridad: Acceso sin autenticaci\u00F3n", function () {
  this.timeout(180000);
  let driver;

  before(async function () {
    this.timeout(120000);
    step("Iniciando Edge (sin login)...");
    driver = await buildEdgeDriver();
    step("Edge listo (sin sesi\u00F3n activa)");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("Sin sesi\u00F3n: /categorias debe redirigir a login", async function () {
    step("Navegando a /categorias SIN autenticaci\u00F3n");
    await driver.get(`${BASE}/categorias`);
    await driver.sleep(3000);

    const currentUrl = await driver.getCurrentUrl();
    console.log(`>>> URL actual: ${currentUrl}`);

    step("Verificando redirecci\u00F3n a /login");
    expect(
      currentUrl.includes("/login"),
      `Esperaba redirecci\u00F3n a /login, pero la URL es: ${currentUrl}`
    ).to.be.true;

    expect(
      currentUrl.includes("/categorias"),
      "El usuario pudo acceder a /categorias sin autenticaci\u00F3n"
    ).to.be.false;

    const loginForm = await driver.findElements(By.id("username"));
    expect(
      loginForm.length,
      "El formulario de login no est\u00E1 visible despu\u00E9s de la redirecci\u00F3n"
    ).to.be.greaterThan(0);

    step("/categorias bloqueado correctamente — redirige a login");
  });

  it("Sin sesi\u00F3n: API de categor\u00EDas rechaza petici\u00F3n sin token", async function () {
    step("Haciendo request GET a /categories-assets sin token");
    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/categories-assets', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(r => callback({ status: r.status, ok: r.ok }))
      .catch(e => callback({ error: e.message }));
    `);

    console.log(`>>> Response status: ${response.status}`);
    step("Verificando que la API rechaza la petici\u00F3n sin token");
    expect(
      response.status === 401 || response.status === 403,
      `Esperaba 401 o 403, pero la API retorn\u00F3 ${response.status}`
    ).to.be.true;
    step("API rechaz\u00F3 petici\u00F3n sin token: HTTP ${response.status}");
  });

  it("Sin sesi\u00F3n: API de categor\u00EDas rechaza petici\u00F3n con token inv\u00E1lido", async function () {
    step("Haciendo request GET a /categories-assets con token falso");
    const response = await driver.executeAsyncScript(`
      var callback = arguments[arguments.length - 1];
      fetch('${API_BASE}/categories-assets', {
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
    step("Verificando que la API rechaza el token inv\u00E1lido");
    expect(
      response.status === 401 || response.status === 403,
      `Esperaba 401 o 403 con token falso, pero la API retorn\u00F3 ${response.status}`
    ).to.be.true;
    step("API rechaz\u00F3 token inv\u00E1lido: HTTP ${response.status}");
  });
});
