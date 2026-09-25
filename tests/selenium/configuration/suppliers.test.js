import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";
import chromedriver from "chromedriver";
import fs from "fs";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";
import { SuppliersListPage } from "./pages/SuppliersListPage.js";
import { SupplierFormModal } from "./pages/SupplierFormModal.js";
import { SupplierDetailModal } from "./pages/SupplierDetailModal.js";

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";
const USER = process.env.SIPREB_USER || process.env.USERNAME || "MunicipalidadDeCanete";
const PASS = process.env.SIPREB_PASS || process.env.PASSWORD || "Admin@2026";

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
        "  npm install\n" +
        "  npm install chromedriver@<major>.0.0"
      ));
    }, timeoutMs);
  });

  try {
    return await Promise.race([building, limit]);
  } finally {
    clearTimeout(timer);
  }
}

function buildSupplierData() {
  const suffix = String(Date.now()).slice(-6);
  const dni = `76${suffix}`.slice(0, 8);
  return {
    documentTypesId: 1,
    numeroDocumento: dni,
    legalName: `Proveedor Selenium ${suffix}`,
    tradeName: `Selenium Corp ${suffix}`,
    address: `Av. Selenium ${suffix}, Lima 01`,
    phone: `9${suffix}${String(Date.now()).slice(-2)}`.slice(0, 9),
    email: `selenium.proveedor.${suffix}@lab.test`,
    website: "https://selenium-lab.test",
    mainContact: "Juan Selenium",
    classification: "PEQUEÑA EMPRESA",
  };
}

describe("Proveedores - ms-03-configuration", function () {
  this.timeout(180000);
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
      throw new Error(
        `Login fallido para "${USER}". Usa credenciales válidas:\n` +
        `  $env:SIPREB_USER="tu_usuario"; $env:SIPREB_PASS="tu_clave"; npm run test:suppliers`
      );
    }

    await login.waitForDashboard();
    console.log("[3/3] Login OK");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  const log = (msg) => console.log(`>>> ${msg}`);
  const step = (n, total, msg) => console.log(`\n>>> Paso ${n}/${total}: ${msg}`);

  const checkFormError = async (ctx) => {
    const errorDiv = By.xpath(
      "//div[contains(@class,'bg-red-50') and contains(@class,'text-red-700')]"
    );
    const hayError = await (new SupplierFormModal(driver, BASE)).isVisible(errorDiv, 3000);
    if (hayError) {
      const texto = await driver.findElement(errorDiv).getText();
      console.log(`ERROR en "${ctx}": ${texto}`);
      const img = await driver.takeScreenshot();
      fs.mkdirSync("reports", { recursive: true });
      fs.writeFileSync(`reports/error_${ctx.replace(/\s+/g, "_")}.png`, img, "base64");
    }
    expect(hayError, `Error en: ${ctx}`).to.be.false;
  };

  it("1. Flujo completo: crear proveedor, buscar en listado y verificar detalle", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new SuppliersListPage(driver, BASE);
    const form = new SupplierFormModal(driver, BASE);
    const detail = new SupplierDetailModal(driver, BASE);
    const supplier = buildSupplierData();

    step(1, 5, "Ir a Gestión de Proveedores (/proveedores)");
    log("Navegando a /proveedores...");
    await sidebar.goToProveedores();
    expect(await list.isLoaded()).to.be.true;
    log("Esperando tabla de proveedores...");
    await list.waitForTable();
    log(`Proveedores en listado: ${await list.getRowCount()}`);

    step(2, 5, "Abrir formulario Nuevo Proveedor");
    if (!(await list.hasNuevoProveedorButton())) {
      log("SKIP: Sin permiso para crear proveedores");
      this.skip();
      return;
    }
    log("Clic en botón Nuevo Proveedor...");
    await list.clickNuevoProveedor();
    log("Esperando modal del formulario...");
    await form.waitOpen();
    log("Modal abierto");

    step(3, 5, "Completar y guardar proveedor");
    log(`Datos de prueba — DNI: ${supplier.numeroDocumento} | Razón social: ${supplier.legalName}`);
    await form.saveNewSupplier(supplier, log);
    await checkFormError("Crear proveedor");
    log("Proveedor guardado correctamente");

    step(4, 5, `Buscar proveedor ${supplier.numeroDocumento} en listado`);
    log("Escribiendo DNI en el buscador...");
    await list.search(supplier.numeroDocumento);
    log("Esperando fila en la tabla...");
    await list.waitForRowByText(supplier.numeroDocumento);

    const status = await list.getStatusOnRow(supplier.numeroDocumento);
    const legalName = await list.getLegalNameOnRow(supplier.numeroDocumento);
    const classification = await list.getClassificationOnRow(supplier.numeroDocumento);
    log(`Estado: ${status} | Razón social: ${legalName} | Clasificación: ${classification}`);

    expect(status).to.equal("Activo");
    expect(legalName).to.equal(supplier.legalName);
    expect(classification).to.equal("Pequeña Empresa");

    step(5, 5, "Abrir detalle y verificar datos");
    log("Clic en Ver detalles...");
    await list.clickViewOnRow(supplier.numeroDocumento);
    log("Esperando modal de detalle...");
    await detail.waitOpen(supplier.legalName);

    const headerName = await detail.getHeaderLegalName();
    const detailText = await detail.getModalText();
    log(`Detalle — Razón social: ${headerName}`);
    log("Verificando DNI, email y contacto principal en el detalle...");

    expect(headerName).to.equal(supplier.legalName);
    expect(detailText).to.include(supplier.numeroDocumento);
    expect(detailText).to.include(supplier.email);
    expect(detailText).to.include(supplier.mainContact);

    await detail.close();
    log("Modal de detalle cerrado");
    console.log("\n>>> FLUJO COMPLETO OK");
  });
});
