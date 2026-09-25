import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import fs from "fs";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";
import { AssetListPage } from "./pages/AssetListPage.js";
import { AssetModal } from "./pages/AssetModal.js";

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";
const USER = process.env.USERNAME || "MunicipalidadDeCanete";
const PASS = process.env.PASSWORD || "Admin@2026";

describe("Patrimonio - Asset", function () {
  this.timeout(300000);
  let driver;
  const TS = Date.now();
  const DESCRIPCION = `Selenium Test Bien ${TS}`;
  const SERIAL = `SN-${TS.toString(36).toUpperCase()}`;

  before(async function () {
    driver = await new Builder().forBrowser("chrome")
      .setChromeOptions(["--headless=new", "--no-sandbox", "--window-size=1440,900"])
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

  const checkError = async (ctx) => {
    const errorDiv = By.xpath("//div[contains(@class,'bg-red-50') and contains(@class,'text-red-700')]");
    const hayError = await (new AssetModal(driver, BASE)).isVisible(errorDiv, 3000);
    if (hayError) {
      const texto = await driver.findElement(errorDiv).getText();
      console.log(`ERROR en "${ctx}": ${texto}`);
      const logs = await driver.manage().logs().get("browser");
      for (const log of logs) {
        if (log.level.name === "SEVERE" || log.message.includes("Error")) {
          console.log(`[BROWSER ${log.level.name}] ${log.message}`);
        }
      }
      const img = await driver.takeScreenshot();
      fs.writeFileSync(`reports/error_${ctx.replace(/\s+/g, '_')}.png`, img, "base64");
    }
    expect(hayError, `Error en: ${ctx}`).to.be.false;
  };

  // ── Test 1: Crear bien ──────────────────────────────────────────────
  it("1. Registrar nuevo bien patrimonial", async function () {
    const s = new SidebarPage(driver, BASE);
    await s.goToBienes();
    const list = new AssetListPage(driver, BASE);

    await list.clickNuevoBien();
    const modal = new AssetModal(driver, BASE);
    await modal.waitOpen();
    await modal.fillAll(DESCRIPCION, SERIAL);
    await modal.save();
    await driver.sleep(5000);

    await checkError("Crear bien");
    await closeSwal();

    await s.goToBienes();
    await list.search(DESCRIPCION);
    await driver.sleep(2000);

    const count = await list.getRowCount();
    expect(count).to.be.at.least(1, `No encontrado: "${DESCRIPCION}"`);
  });

  // ── Test 2: Cambiar estado (AVAILABLE → IN_USE) ─────────────────────
  it("2. Cambiar estado del bien", async function () {
    const s = new SidebarPage(driver, BASE);
    await s.goToBienes();
    const list = new AssetListPage(driver, BASE);

    await list.search(DESCRIPCION);
    await driver.sleep(2000);

    await list.clickEditOnRow(DESCRIPCION);
    const modal = new AssetModal(driver, BASE);
    await modal.waitOpen();
    await driver.sleep(1000);

    await modal.changeStatus("IN_USE");
    await modal.save();
    await driver.sleep(5000);

    await checkError("Cambiar estado");
    await closeSwal();

    await s.goToBienes();
    await list.search(DESCRIPCION);
    await driver.sleep(2000);

    const status = await list.getStatusOnRow(DESCRIPCION);
    expect(status).to.equal("En Uso");
  });

  // ── Test 3: Ver historial de depreciación ────────────────────────────
  it("3. Visualizar historial de depreciación", async function () {
    const s = new SidebarPage(driver, BASE);
    await s.goToBienes();
    const list = new AssetListPage(driver, BASE);

    await list.search(DESCRIPCION);
    await driver.sleep(2000);

    await list.clickDepreciationOnRow(DESCRIPCION);

    // Esperar modal de resumen de depreciación
    const modalTitle = By.xpath("//h2[contains(.,'Depreciación')]");
    const visible = await (new AssetModal(driver, BASE)).isVisible(modalTitle, 10000);
    expect(visible, "Modal de depreciación no visible").to.be.true;

    // Verificar datos de resumen en el modal
    await driver.wait(until.elementLocated(By.xpath("//*[contains(text(),'Valor inicial')]")), 15000);
    const body = await driver.findElement(By.tagName("body")).getText();
    expect(body).to.include("S/");

    // Click "Ver historial completo" para navegar a la página completa
    const verCompletoBtn = By.xpath("//button[contains(.,'Ver historial completo')]");
    await driver.wait(until.elementLocated(verCompletoBtn), 5000);
    await driver.sleep(500);
    await driver.findElement(verCompletoBtn).click();

    // Esperar que cargue la página completa de historial
    const fullPageTitle = By.xpath("//h1[contains(.,'Historial de Depreciación')]");
    await driver.wait(until.elementLocated(fullPageTitle), 15000);

    // Verificar que se muestra la tabla con datos de depreciación
    await driver.wait(until.elementLocated(By.xpath("//th[contains(.,'Dep. Mensual')]")), 10000);
    const fullBody = await driver.findElement(By.tagName("body")).getText();
    expect(fullBody).to.include("S/");

    // Volver a lista de bienes
    const backBtn = By.xpath("//button[contains(.,'Volver')]");
    const backVisible = await (new AssetModal(driver, BASE)).isVisible(backBtn, 3000);
    if (backVisible) {
      await driver.findElement(backBtn).click();
      await driver.sleep(2000);
    }
  });
});
