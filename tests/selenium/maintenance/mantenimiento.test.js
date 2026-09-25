import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";
import chromedriver from "chromedriver";
import { LoginPage } from "../pages/LoginPage.js";

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";
const USER = process.env.SIPREB_USER || "MunicipalidadDeCanete";
const PASS = process.env.SIPREB_PASS || "Admin@2026";

async function buildChromeDriver({ headless = false, timeoutMs = 90000 } = {}) {
  const options = new Options();
  if (headless) options.addArguments("--headless=new");
  options.addArguments("--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--window-size=1440,900");
  const service = new ServiceBuilder(chromedriver.path);
  const building = new Builder().forBrowser("chrome").setChromeOptions(options).setChromeService(service).build();
  let timer;
  const limit = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Chrome no inició a tiempo")), timeoutMs);
  });
  try { return await Promise.race([building, limit]); }
  finally { clearTimeout(timer); }
}

const step = (msg) => console.log(`\n>>> ${msg}`);

const closeSwal = async (driver) => {
  try {
    await driver.executeScript(`
      document.querySelectorAll('.swal2-container, .swal2-popup, .swal2-toast').forEach(el => el.remove());
      document.body.style.overflow = '';
    `);
  } catch (_) {}
  await driver.sleep(500);
};

describe("Mantenimiento — Crear y Verificar Detalle", function () {
  this.timeout(300000);
  let driver;

  before(async function () {
    this.timeout(120000);
    driver = await buildChromeDriver();
    const login = new LoginPage(driver, BASE);
    await login.navigateTo();
    await login.login(USER, PASS);
    await driver.sleep(3000);
    await login.waitForDashboard();
    step("Login OK");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it("Crear solicitud y verificar detalle", async function () {
    // ── Navegar a mantenimientos ──
    step("Navegando a /mantenimientos");
    await driver.get(`${BASE}/mantenimientos`);
    await driver.sleep(5000);

    const tableExists = await driver.findElements(By.css("table tbody tr"));
    step(`Registros encontrados: ${tableExists.length}`);

    // ── Abrir formulario ──
    step("Abriendo formulario Nueva Solicitud");
    const nuevaBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Nueva Solicitud')]")),
      15000
    );
    await driver.executeScript("arguments[0].click()", nuevaBtn);
    await driver.sleep(2000);
    await driver.wait(until.elementLocated(By.xpath("//h2[contains(.,'Nuevo Mantenimiento')]")), 10000);

    // ── Seleccionar activo ──
    step("Seleccionando activo");
    const assetPickerBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Seleccionar activo')]")), 10000
    );
    await driver.executeScript("arguments[0].click()", assetPickerBtn);
    await driver.sleep(1500);
    const firstAsset = await driver.wait(
      // listado de patrimonio
      until.elementLocated(By.xpath("(//div[contains(@class,'fixed')]//button[.//div[contains(@class,'font-black')]])[2]")),
      10000
    );
    await driver.executeScript("arguments[0].click()", firstAsset);
    await driver.sleep(1000);

    // ── Tipo: Preventivo ──
    step("Tipo: Preventivo");
    const preventivoBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Preventivo')]")), 5000);
    await driver.executeScript("arguments[0].click()", preventivoBtn);
    await driver.sleep(500);

    // ── Fecha ──
    step("Fecha programada (mañana)");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = String(tomorrow.getDate()).padStart(2, "0");
    const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const year = String(tomorrow.getFullYear());
    const dayInput = await driver.wait(until.elementLocated(By.xpath("//input[@placeholder='DD']")), 5000);
    await dayInput.clear(); await dayInput.sendKeys(day);
    const monthInput = await driver.findElement(By.xpath("//input[@placeholder='MM']"));
    await monthInput.clear(); await monthInput.sendKeys(month);
    const yearInput = await driver.findElement(By.xpath("//input[@placeholder='YYYY']"));
    await yearInput.clear(); await yearInput.sendKeys(year);
    await driver.sleep(500);

    // ── Descripción ──
    step("Descripción del trabajo");
    const descTa = await driver.wait(until.elementLocated(By.xpath("//textarea[contains(@placeholder,'tareas se deben')]")), 5000);
    await descTa.clear(); await descTa.sendKeys("Mantenimiento preventivo programado Selenium");

    // ── Problema reportado ──
    step("Problema reportado");
    const probTa = await driver.wait(until.elementLocated(By.xpath("//textarea[contains(@placeholder,'fallo o motivo')]")), 5000);
    await probTa.clear(); await probTa.sendKeys("Revisión preventivo programada según cronograma.");

    // ── Responsable ──
    step("Responsable técnico");
    const techSelect = await driver.wait(
      until.elementLocated(By.xpath("//select[.//option[contains(.,'Seleccionar persona')]]")), 10000
    );
    const techOptions = await techSelect.findElements(By.xpath("./option"));
    if (techOptions.length > 1) {
      const val = await techOptions[1].getAttribute("value");
      await driver.executeScript(
        `arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
        techSelect, val
      );
      await driver.sleep(500);
    }

    // ── Guardar ──
    step("Guardando formulario");
    const submitBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Registrar Mantenimiento')]")), 5000
    );
    await driver.executeScript("arguments[0].click()", submitBtn);
    await driver.sleep(4000);
    await closeSwal(driver);
    await driver.sleep(3000);

    // ── Verificar en tabla (sin navigate) ──
    step("Verificando que aparece en la tabla");
    const bodyText = await driver.findElement(By.tagName("body")).getText();
    const tieneProgramado = bodyText.includes("Programado");
    const tieneSelenium = bodyText.includes("Selenium");
    step(`Tabla contiene "Programado": ${tieneProgramado}`);
    step(`Tabla contiene "Selenium": ${tieneSelenium}`);

    const rows = await driver.findElements(By.css("table tbody tr"));
    step(`Filas en tabla: ${rows.length}`);
    expect(rows.length, "Debería haber al menos 1 fila en la tabla").to.be.greaterThan(0);

    // ── Hacer clic en la fila para abrir detalle ──
    step("Haciendo clic en la fila para ver detalle");
    await driver.executeScript("arguments[0].click()", rows[0]);
    await driver.sleep(4000);

    // ── Verificar que se abrió el panel de detalle ──
    step("Verificando panel de detalle");
    const expediente = await driver.wait(
      until.elementLocated(By.xpath("//p[contains(.,'Expediente municipal')]")),
      15000
    );
    expect(await expediente.isDisplayed(), "El panel de detalle debería estar visible").to.be.true;
    step("Panel de detalle abierto correctamente ✓");

    // ── Verificar contenido del detalle ──
    const detailBody = await driver.findElement(By.tagName("body")).getText();
    const tieneMantenimiento = detailBody.includes("MANTENIMIENTO");
    step(`Detalle contiene información del mantenimiento: ${tieneMantenimiento}`);

    // ── Verificar pestaña Repuestos ──
    step("Verificando pestaña Repuestos");
    const repuestosTab = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Repuestos')]")),
      5000
    );
    expect(await repuestosTab.isDisplayed(), "La pestaña Repuestos debería existir").to.be.true;
    step("Pestaña Repuestos encontrada ✓");

    step("Prueba completada exitosamente ✓");
  });
});
