import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/edge.js";
import { download as getEdgeDriverPath } from "edgedriver";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";
import { CategoryListPage } from "./pages/CategoryListPage.js";
import { CategoryFormModal } from "./pages/CategoryFormModal.js";

const { BASE_URL, SIPREB_USER, SIPREB_PASS } = process.env;
if (!BASE_URL) throw new Error("Falta variable de entorno: BASE_URL");
if (!SIPREB_USER) throw new Error("Falta variable de entorno: SIPREB_USER");
if (!SIPREB_PASS) throw new Error("Falta variable de entorno: SIPREB_PASS");
const BASE = BASE_URL;
const USER = SIPREB_USER;
const PASS = SIPREB_PASS;
const SLOW = 1000;

async function buildEdgeDriver({ headless = false, timeoutMs = 90000 } = {}) {
  const options = new Options();
  if (headless) options.addArguments("--headless=new");
  options.addArguments(
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1440,900",
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
      reject(
        new Error(
          "Edge no inici\u00F3 a tiempo. Prueba:\n" +
            "  Stop-Process -Name msedge,msedgedriver -Force -ErrorAction SilentlyContinue\n" +
            "  npm install",
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([building, limit]);
  } finally {
    clearTimeout(timer);
  }
}

describe("Categor\u00EDas de Bienes - ms-03-configuration", function () {
  this.timeout(600000);
  let driver;

  before(async function () {
    this.timeout(120000);
    console.log("[1/3] Iniciando Edge...");
    driver = await buildEdgeDriver();
    console.log("[2/3] Login...");
    const login = new LoginPage(driver, BASE);
    await login.navigateTo();
    await login.login(USER, PASS);
    await driver.sleep(3000);

    const body = await driver.findElement(By.tagName("body")).getText();
    if (body.includes("Credenciales incorrectas")) {
      throw new Error(
        `Login fallido para "${USER}". Usa credenciales v\u00E1lidas:\n` +
          `  $env:SIPREB_USER="tu_usuario"; $env:SIPREB_PASS="tu_clave"; npm run test:categorias`,
      );
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

  const confirmSwal = async () => {
    await driver.sleep(1000);
    const confirmBtn = By.xpath(
      "//div[contains(@class,'swal2-popup')]//button[contains(@class,'swal2-confirm')]",
    );
    const visible = await (async () => {
      try {
        await driver.wait(until.elementLocated(confirmBtn), 10000);
        return true;
      } catch {
        return false;
      }
    })();
    if (visible) {
      await driver.executeScript(
        "arguments[0].click()",
        await driver.findElement(confirmBtn),
      );
      await driver.sleep(3000);
    }
  };

  const step = (msg) => console.log(`\n>>> ${msg}`);

  it("1. Inactivar primera categor\u00EDa activa", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new CategoryListPage(driver, BASE);

    step("Navegando a /categorias y filtrando por activas");
    await sidebar.goToCategorias();
    await driver.sleep(SLOW);
    expect(await list.isLoaded()).to.be.true;
    await list.setFilter("activos");
    await driver.sleep(SLOW);
    await list.waitForTable();
    const totalActivas = await list.getRowCount();
    console.log(`>>> Categor\u00EDas activas encontradas: ${totalActivas}`);
    expect(totalActivas).to.be.at.least(
      1,
      "No hay categor\u00EDas activas para inactivar",
    );

    const codigo = await list.getFirstRowCode();
    step(`Inactivando categor\u00EDa: ${codigo}`);
    await list.clickDeleteOnFirstRow();
    await driver.sleep(SLOW);
    await confirmSwal();
    await closeSwal();

    step("Verificando que ahora aparece como inactiva");
    await sidebar.goToCategorias();
    await driver.sleep(SLOW);
    await list.setFilter("inactivos");
    await driver.sleep(SLOW);
    await list.waitForTable();
    const status = await list.getFirstRowStatus();
    expect(status).to.equal("INACTIVE");
    console.log(`>>> Categor\u00EDa ${codigo} inactivada correctamente`);
  });

  it("2. Restaurar primera categor\u00EDa inactiva", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new CategoryListPage(driver, BASE);

    step("Navegando a /categorias y filtrando por inactivas");
    await sidebar.goToCategorias();
    await driver.sleep(SLOW);
    expect(await list.isLoaded()).to.be.true;
    await list.setFilter("inactivos");
    await driver.sleep(SLOW);
    await list.waitForTable();
    const totalInactivas = await list.getRowCount();
    console.log(`>>> Categor\u00EDas inactivas encontradas: ${totalInactivas}`);
    expect(totalInactivas).to.be.at.least(
      1,
      "No hay categor\u00EDas inactivas para restaurar",
    );

    const codigo = await list.getFirstRowCode();
    step(`Restaurando categor\u00EDa: ${codigo}`);
    await list.clickRestoreOnFirstRow();
    await driver.sleep(SLOW);
    await confirmSwal();
    await closeSwal();

    step("Verificando que ahora aparece como activa");
    await sidebar.goToCategorias();
    await driver.sleep(SLOW);
    await list.setFilter("activos");
    await driver.sleep(SLOW);
    await list.waitForTable();
    const status = await list.getFirstRowStatus();
    expect(status).to.equal("ACTIVE");
    console.log(`>>> Categor\u00EDa ${codigo} restaurada correctamente`);
  });

  it("3. Editar descripci\u00F3n del primer registro", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new CategoryListPage(driver, BASE);
    const form = new CategoryFormModal(driver, BASE);

    step("Navegando a /categorias");
    await sidebar.goToCategorias();
    await driver.sleep(SLOW);
    expect(await list.isLoaded()).to.be.true;
    await list.setFilter("todos");
    await driver.sleep(SLOW);
    await list.waitForTable();

    const codigo = await list.getFirstRowCode();
    step(`Editando descripci\u00F3n de: ${codigo}`);
    await list.clickEditOnFirstRow();
    await driver.sleep(SLOW);

    const NUEVA_DESC = "Descripcion Realizada con Selenium";
    await form.editDescription(NUEVA_DESC);

    step("Confirmando guardado de cambios");
    await confirmSwal();
    await driver.sleep(2000);
    await confirmSwal();
    await driver.sleep(SLOW);
    await form.waitClosed();
    console.log(
      `>>> Descripci\u00F3n actualizada a "${NUEVA_DESC}" para categor\u00EDa ${codigo}`,
    );
  });
});
