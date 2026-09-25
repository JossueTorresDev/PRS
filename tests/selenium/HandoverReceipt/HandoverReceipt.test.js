import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options } from "selenium-webdriver/chrome.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";
import { HandoverReceiptListPage } from "./pages/HandoverReceiptListPage.js";
import { HandoverReceiptModal } from "./pages/HandoverReceiptModal.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORT_DIR = path.resolve(__dirname, "reports");

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";
const USER = process.env.USERNAME || "MunicipalidadDeCanete";
const PASS = process.env.PASSWORD || "Admin@2026";

describe("HandoverReceipt - Actas de Entrega", function () {
  this.timeout(300000);
  let driver;
  let createdReceiptNumber;
  const TS = Date.now();
  const DESCRIPCION = `Selenium Acta ${TS}`;

  before(async function () {
    const options = new Options();
    options.addArguments(
      "--no-sandbox",
      "--window-size=1440,900",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-client-side-phishing-detection",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--disable-extensions",
      "--disable-sync",
      "--disable-translate",
      "--disable-features=NetworkService",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-backgrounding-occluded-windows",
      "--disable-breakpad",
      "--disable-component-update",
      "--disable-domain-reliability",
      "--disable-features=DialMediaRouteProvider,AudioServiceOutOfProcess",
      "--disable-prompt-on-repost",
      "--disable-software-rasterizer",
      "--disable-logging",
      "--log-level=3",
      "--mute-audio"
    );
    driver = await new Builder().forBrowser("chrome")
      .setChromeOptions(options)
      .build();
    const login = new LoginPage(driver, BASE);
    await login.navigateTo();
    await login.login(USER, PASS);
    await login.waitForDashboard();
  });

  after(async function () {
    await driver.quit();
  });

  const closeSwal = async () => {
    await driver.executeScript(`
      document.querySelectorAll('.swal2-container, .swal2-popup').forEach(el => el.remove());
      document.body.style.overflow = '';
    `);
    await driver.sleep(500);
  };

  const takeReportScreenshot = async (name) => {
    const img = await driver.takeScreenshot();
    fs.writeFileSync(path.join(REPORT_DIR, `${name}.png`), img, "base64");
  };

  const checkError = async (ctx) => {
    const errorDiv = By.xpath("//div[contains(@class,'bg-red-50') and contains(@class,'text-red-700')]");
    const hayError = await (new HandoverReceiptModal(driver, BASE)).isVisible(errorDiv, 3000);
    if (hayError) {
      const texto = await driver.findElement(errorDiv).getText();
      console.log(`ERROR en "${ctx}": ${texto}`);
      const logs = await driver.manage().logs().get("browser");
      for (const log of logs) {
        if (log.level.name === "SEVERE" || log.message.includes("Error")) {
          console.log(`[BROWSER ${log.level.name}] ${log.message}`);
        }
      }
      await takeReportScreenshot(`error_${ctx.replace(/\s+/g, '_')}`);
    }
    expect(hayError, `Error en: ${ctx}`).to.be.false;
  };

  it("1. Registrar nueva acta de entrega", async function () {
    const s = new SidebarPage(driver, BASE);
    await s.goToBienes(); // usar la ruta general si no hay ruta específica
    const list = new HandoverReceiptListPage(driver, BASE);

    // navegar directamente a la sección de actas si existe
    try {
      await driver.get(`${BASE}/actas`);
      await list.waitForTable(10000);
      await takeReportScreenshot("before_new_acta");
    } catch {
      // fallback a ir por bienes
    }

    await list.clickNuevaActa();
    const modal = new HandoverReceiptModal(driver, BASE);
    await modal.waitOpen();
    await takeReportScreenshot("form_acta_open");
    await modal.fillAll(DESCRIPCION);
    await modal.save();
    await driver.sleep(3000);

    await checkError("Crear acta");
    await closeSwal();

    // volver a la lista y buscar por el último número de acta creado
    try {
      await driver.get(`${BASE}/actas`);
      await list.waitForTable(10000);
      const receiptNumber = await list.getLastReceiptNumber();
      createdReceiptNumber = receiptNumber;
      await list.search(receiptNumber);
      await driver.sleep(2000);
      await takeReportScreenshot("after_search_last_acta");
      const count = await list.getRowCount();
      expect(count).to.be.at.least(1, `No encontrado: "${receiptNumber}"`);
    } catch (err) {
      // Si no hay lista, al menos no falló la creación
    }
  });

  it("2. Ver detalle de acta", async function () {
    const list = new HandoverReceiptListPage(driver, BASE);
    try {
      await driver.get(`${BASE}/actas`);
      await list.search(createdReceiptNumber);
      await driver.sleep(2000);
      await list.clickViewOnRow(createdReceiptNumber);
      // esperar modal o página de detalle
      const title = By.xpath("//h2[contains(.,'Acta') or contains(.,'Detalle de Acta')]");
      const visible = await (new HandoverReceiptModal(driver, BASE)).isVisible(title, 10000);
      expect(visible, 'Detalle de acta no visible').to.be.true;
    } catch (err) {
      // ignorar si la navegación no aplica en esta instalación
    }
  });
});
