import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";
import chromedriver from "chromedriver";
import fs from "fs";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";
import { AssetListPage } from "../patrimonio/pages/AssetListPage.js";
import { MovementsListPage } from "./pages/MovementsListPage.js";
import { MovementFormModal } from "./pages/MovementFormModal.js";
import { MovementDetailsModal } from "./pages/MovementDetailsModal.js";
import { HandoverReceiptListPage } from "./pages/HandoverReceiptListPage.js";

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
        "Si cambió la versión de Chrome: npm install chromedriver@<major>.0.0"
      ));
    }, timeoutMs);
  });

  try {
    return await Promise.race([building, limit]);
  } finally {
    clearTimeout(timer);
  }
}

describe("Movimientos - ms-05-movements", function () {
  this.timeout(300000);
  let driver;
  const REASON = "Prueba automatizada con Selenium.";

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
        `  $env:SIPREB_USER="tu_usuario"; $env:SIPREB_PASS="tu_clave"; npm run test:movements`
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

  const checkError = async (ctx) => {
    const errorDiv = By.xpath("//div[contains(@class,'bg-red-50') and (contains(@class,'text-red-700') or contains(@class,'text-red-800'))]");
    const hayError = await (new MovementFormModal(driver, BASE)).isVisible(errorDiv, 3000);
    if (hayError) {
      const texto = await driver.findElement(errorDiv).getText();
      console.log(`ERROR en "${ctx}": ${texto}`);
      const img = await driver.takeScreenshot();
      fs.writeFileSync(`reports/error_${ctx.replace(/\s+/g, "_")}.png`, img, "base64");
    }
    expect(hayError, `Error en: ${ctx}`).to.be.false;
  };

  const filterBienesDisponibles = async () => {
    const select = await driver.findElement(
      By.xpath("//label[contains(.,'Estado')]/following::select[1]")
    );
    await driver.executeScript(
      "arguments[0].value = 'AVAILABLE'; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
      select
    );
    await driver.sleep(1500);
  };

  const getDisponibleAssetCodes = async (limit = 10) => {
    const cells = await driver.findElements(
      By.xpath("//tbody/tr//div[contains(@class,'font-semibold') and contains(@class,'text-slate-900')]")
    );
    const codes = [];
    for (let i = 0; i < Math.min(cells.length, limit); i += 1) {
      codes.push((await cells[i].getText()).trim());
    }
    return codes;
  };

  const step = (msg) => console.log(`\n>>> ${msg}`);

  it("1. Flujo completo: crear movimiento, avanzar estados, verificar acta y estado del bien", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const assets = new AssetListPage(driver, BASE);
    const list = new MovementsListPage(driver, BASE);
    const form = new MovementFormModal(driver, BASE);
    const details = new MovementDetailsModal(driver, BASE);
    const actas = new HandoverReceiptListPage(driver, BASE);

    // Paso 1: bien disponible en patrimonio (puede tener historial)
    step("Paso 1/8: Buscar bien disponible en patrimonio (/bienes)");
    await sidebar.goToBienes();
    await filterBienesDisponibles();
    await assets.waitForTable(20000);

    if (await assets.getRowCount() === 0) {
      console.log(">>> SKIP: No hay bienes disponibles");
      this.skip();
      return;
    }

    const assetCodes = await getDisponibleAssetCodes();
    const sampleCode = assetCodes[0];
    const initialStatus = await assets.getStatusOnRow(sampleCode);
    console.log(`>>> Bienes disponibles encontrados: ${assetCodes.length}. Ejemplo: ${sampleCode} (${initialStatus})`);
    expect(initialStatus).to.equal("Disponible");

    // Paso 2: crear solicitud de movimiento
    step("Paso 2/8: Crear movimiento con bien disponible (/movimientos)");
    await sidebar.goToMovimientos();
    expect(await list.isLoaded()).to.be.true;

    if (!(await list.hasNuevoMovimientoButton())) {
      console.log(">>> SKIP: Sin permiso para crear movimientos");
      this.skip();
      return;
    }

    await list.clickNuevoMovimiento();
    await form.waitOpen();
    console.log(`>>> Completando formulario (motivo: ${REASON})...`);
    const { assetLabel, assetCode: usedAssetCode, movementType } = await form.fillCreateForm(REASON, assetCodes);
    console.log(`>>> Bien agregado: ${assetLabel}`);
    console.log(`>>> Tipo movimiento: ${movementType}`);

    const movementNumber = await form.getCreatedMovementNumber();
    console.log(`>>> Número de movimiento creado: ${movementNumber}`);
    expect(movementNumber.length).to.be.greaterThan(0);

    await checkError("Crear movimiento");
    await closeSwal();
    console.log(">>> Movimiento registrado");

    // Paso 3: buscar por número y verificar Solicitado
    step(`Paso 3/8: Buscar movimiento ${movementNumber} y verificar Solicitado`);
    await sidebar.goToMovimientos();
    await list.waitForTable();
    const statusSolicitado = await list.getStatusByMovementNumber(movementNumber);
    console.log(`>>> Estado en listado: ${statusSolicitado}`);
    expect(statusSolicitado).to.equal("Solicitado");

    // Paso 4: abrir detalle y aprobar (Solicitado → Aprobado)
    step(`Paso 4/8: Abrir detalle de ${movementNumber} y aprobar`);
    await list.openMovementByNumber(movementNumber);
    await details.waitOpen(movementNumber);
    expect(await details.getStatusLabel()).to.equal("Solicitado");

    await details.approve();
    console.log(">>> Estado: Aprobado");
    expect(await details.getStatusLabel()).to.equal("Aprobado");

    // Paso 5: marcar en proceso (Aprobado → En Proceso)
    step(`Paso 5/8: Marcar ${movementNumber} en proceso`);
    await details.markInProcess();
    console.log(">>> Estado: En Proceso");
    expect(await details.getStatusLabel()).to.equal("En Proceso");

    // Paso 6: completar (En Proceso → Completado + acta automática)
    step(`Paso 6/8: Completar ${movementNumber} y verificar acta automática`);
    await details.complete();
    console.log(">>> Estado: Completado (acta generada automáticamente)");
    expect(await details.getStatusLabel()).to.equal("Completado");
    await details.close();

    expect(await list.getStatusByMovementNumber(movementNumber)).to.equal("Completado");

    // Paso 7: verificar acta de entrega en /actas
    step(`Paso 7/8: Verificar acta de entrega para ${movementNumber} (/actas)`);
    await sidebar.goToActas();
    expect(await actas.isLoaded()).to.be.true;
    await actas.filterByStatusLabel("Generado");

    const actaFound = await actas.findActaForMovement(movementNumber);
    console.log(`>>> Acta encontrada: ${actaFound ? "Sí" : "No"}`);
    expect(actaFound, `No se encontró acta para ${movementNumber}`).to.be.true;

    // Paso 8: verificar bien Disponible → En Uso
    step(`Paso 8/8: Verificar bien ${usedAssetCode} cambió de Disponible a En Uso (/bienes)`);
    await sidebar.goToBienes();
    await assets.search(usedAssetCode);
    await driver.sleep(2000);

    const finalStatus = await assets.getStatusOnRow(usedAssetCode);
    console.log(`>>> Estado final del bien: ${finalStatus}`);
    expect(finalStatus).to.equal("En Uso");

    console.log("\n>>> FLUJO COMPLETO OK");
  });
});
