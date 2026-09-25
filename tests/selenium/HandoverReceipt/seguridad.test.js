import { expect } from "chai";
import { Builder, By } from "selenium-webdriver";
import { LoginPage } from "../pages/LoginPage.js";

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";

async function buildChromeDriver() {
  return new Builder().forBrowser("chrome")
    .setChromeOptions(["--headless=new", "--no-sandbox", "--window-size=1440,900"])
    .build();
}

describe("HandoverReceipt - Seguridad", function () {
  this.timeout(300000);

  it("1. Autenticación requerida - acceder a /actas sin login", async function () {
    const driver = await buildChromeDriver();
    try {
      await driver.get(`${BASE}/actas`);
      await driver.sleep(5000);

      const currentUrl = await driver.getCurrentUrl();
      const loginForm = await driver.findElements(By.id("username"));

      expect(currentUrl.includes("/login"),
        `Autenticación requerida: se esperaba redirección a /login, pero la URL es ${currentUrl}`
      ).to.be.true;

      expect(currentUrl.includes("/actas"),
        `Autenticación requerida: el usuario permaneció en /actas sin login (${currentUrl})`
      ).to.be.false;

      expect(loginForm.length,
        "Autenticación requerida: el formulario de login no quedó visible tras la redirección"
      ).to.be.greaterThan(0);
    } finally {
      await driver.quit();
    }
  });

  it("2. Role Guard - acceso permitido a /actas para un usuario autorizado", async function () {
    const driver = await buildChromeDriver();
    try {
      const login = new LoginPage(driver, BASE);
      await login.navigateTo();
      await login.login("MunicipalidadDeCanete", "Admin@2026");
      await login.waitForDashboard();

      await driver.get(`${BASE}/actas`);
      await driver.sleep(5000);

      const body = await driver.findElement(By.tagName("body")).getText();
      expect(body).to.include("Actas de Entrega-Recepción");
      expect(body).to.not.include("Acceso Restringido");
    } finally {
      await driver.quit();
    }
  });
});