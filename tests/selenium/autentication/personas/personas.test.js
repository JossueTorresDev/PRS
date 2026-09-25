import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { Options, ServiceBuilder } from "selenium-webdriver/chrome.js";
import chromedriver from "chromedriver";
import fs from "fs";
import { LoginPage } from "../../pages/LoginPage.js";
import { SidebarPage } from "../../pages/SidebarPage.js";
import { PersonasListPage } from "./pages/PersonasListPage.js";
import { PersonModal } from "./pages/PersonModal.js";
import { PersonDetailModal } from "./pages/PersonDetailModal.js";

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

function buildPersonData(docTypeId, docLabel) {
  const TS = Date.now();
  const suffix = String(TS).slice(-6);
  const docs = {
    DNI: { id: 1, number: `76${suffix}`.slice(0, 8) },
    CE: { id: 3, number: `${TS}`.padStart(12, '0').slice(0, 12) },
    PAS: { id: 4, number: `${TS}`.padEnd(12, '0').slice(0, 12) },
  };
  const doc = docs[docLabel] || docs.DNI;
  return {
    documentTypeId: docTypeId,
    documentNumber: doc.number,
    firstName: `Persona ${docLabel}`,
    lastName: `Test Apellido`,
    personalPhone: `9${suffix}${String(TS).slice(-2)}`.slice(0, 9),
    email: `selenium.${docLabel.toLowerCase()}.${TS}@lab.test`,
    address: `Av. Test ${TS}, Lima 01`,
    birthDay: "15",
    birthMonth: "06",
    birthYear: "1990",
  };
}

describe("Personas - ms-02-authentication", function () {
  this.timeout(300000);
  let driver;
  const createdPersons = [];

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
        `  $env:SIPREB_USER="tu_usuario"; $env:SIPREB_PASS="tu_clave"; npm run test:personas`
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
    const errorDiv = By.xpath(
      "//div[contains(@class,'bg-red-50') and (contains(@class,'text-red-700') or contains(@class,'text-red-800'))]"
    );
    const hayError = await (new PersonModal(driver, BASE)).isVisible(errorDiv, 3000);
    if (hayError) {
      const texto = await driver.findElement(errorDiv).getText();
      console.log(`ERROR en "${ctx}": ${texto}`);
      const img = await driver.takeScreenshot();
      fs.mkdirSync("reports", { recursive: true });
      fs.writeFileSync(`reports/error_${ctx.replace(/\s+/g, "_")}.png`, img, "base64");
    }
    expect(hayError, `Error en: ${ctx}`).to.be.false;
  };

  const confirmSwal = async () => {
    await driver.sleep(1000);
    const confirmBtn = By.xpath(
      "//div[contains(@class,'swal2-popup')]//button[contains(@class,'swal2-confirm')]"
    );
    const visible = await (async () => {
      try {
        await driver.wait(until.elementLocated(confirmBtn), 5000);
        return true;
      } catch { return false; }
    })();
    if (visible) {
      await driver.executeScript("arguments[0].click()", await driver.findElement(confirmBtn));
      await driver.sleep(3000);
    }
  };

  const step = (msg) => console.log(`\n>>> ${msg}`);

  // ── Test 1: Crear persona con DNI ─────────────────────────────────
  it("1. Crear persona natural con DNI", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new PersonasListPage(driver, BASE);
    const modal = new PersonModal(driver, BASE);
    const TS = Date.now();
    const person = buildPersonData(1, "DNI");

    step("Navegando a /personas");
    await sidebar.goToPersonas();
    expect(await list.isLoaded()).to.be.true;

    step("Abriendo formulario Nueva Persona");
    await list.clickNuevaPersona();
    await modal.waitOpen();

    step("Completando formulario con DNI");
    await modal.save(person);
    await driver.sleep(3000);

    await checkError("Crear persona DNI");
    await closeSwal();

    step("Verificando en listado");
    await sidebar.goToPersonas();
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    const count = await list.getRowCount();
    expect(count).to.be.at.least(1, `Persona DNI ${person.documentNumber} no encontrada`);
    createdPersons.push({ ...person, docLabel: "DNI" });
    console.log(`>>> Persona DNI creada: ${person.documentNumber}`);
  });

  // ── Test 2: Crear persona con CE ──────────────────────────────────
  it("2. Crear persona natural con Carné de Extranjería", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new PersonasListPage(driver, BASE);
    const modal = new PersonModal(driver, BASE);
    const person = buildPersonData(3, "CE");

    step("Navegando a /personas");
    await sidebar.goToPersonas();
    expect(await list.isLoaded()).to.be.true;

    step("Abriendo formulario Nueva Persona");
    await list.clickNuevaPersona();
    await modal.waitOpen();

    step("Completando formulario con CE");
    await modal.save(person);
    await driver.sleep(3000);

    await checkError("Crear persona CE");
    await closeSwal();

    step("Verificando en listado");
    await sidebar.goToPersonas();
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    const count = await list.getRowCount();
    expect(count).to.be.at.least(1, `Persona CE ${person.documentNumber} no encontrada`);
    createdPersons.push({ ...person, docLabel: "CE" });
    console.log(`>>> Persona CE creada: ${person.documentNumber}`);
  });

  // ── Test 3: Crear persona con PAS ─────────────────────────────────
  it("3. Crear persona natural con Pasaporte", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new PersonasListPage(driver, BASE);
    const modal = new PersonModal(driver, BASE);
    const person = buildPersonData(4, "PAS");

    step("Navegando a /personas");
    await sidebar.goToPersonas();
    expect(await list.isLoaded()).to.be.true;

    step("Abriendo formulario Nueva Persona");
    await list.clickNuevaPersona();
    await modal.waitOpen();

    step("Completando formulario con Pasaporte");
    await modal.save(person);
    await driver.sleep(3000);

    await checkError("Crear persona PAS");
    await closeSwal();

    step("Verificando en listado");
    await sidebar.goToPersonas();
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    const count = await list.getRowCount();
    expect(count).to.be.at.least(1, `Persona PAS ${person.documentNumber} no encontrada`);
    createdPersons.push({ ...person, docLabel: "PAS" });
    console.log(`>>> Persona PAS creada: ${person.documentNumber}`);
  });

  // ── Test 4: Ver detalle de persona ─────────────────────────────────
  it("4. Ver detalle de persona", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new PersonasListPage(driver, BASE);
    const detail = new PersonDetailModal(driver, BASE);
    const person = createdPersons[0];

    step(`Navegando a /personas y buscando ${person.documentNumber}`);
    await sidebar.goToPersonas();
    expect(await list.isLoaded()).to.be.true;
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    step("Abriendo detalle");
    await list.clickViewOnRow(person.firstName);
    await detail.waitOpen();

    const headerName = await detail.getHeaderName();
    expect(headerName).to.include(person.firstName);

    const modalText = await detail.getModalText();
    expect(modalText).to.include(person.documentNumber);
    expect(modalText).to.include(person.personalPhone);

    step("Cerrando detalle");
    await detail.close();
    console.log(`>>> Detalle verificado para ${person.firstName}`);
  });

  // ── Test 5: Editar persona ─────────────────────────────────────────
  it("5. Editar persona (cambiar teléfono y dirección)", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new PersonasListPage(driver, BASE);
    const modal = new PersonModal(driver, BASE);
    const person = createdPersons[0];
    const newPhone = `988${String(Date.now()).slice(-6)}`.slice(0, 9);
    const newAddress = `Av. Editada ${Date.now()}, San Isidro`;

    step(`Buscando persona ${person.documentNumber}`);
    await sidebar.goToPersonas();
    expect(await list.isLoaded()).to.be.true;
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    step("Abriendo formulario de edición");
    await list.clickEditOnRow(person.firstName);
    await modal.waitOpen();

    step("Cambiando teléfono y dirección");
    await modal.setPersonalPhone(newPhone);
    await modal.setAddress(newAddress);

    step("Guardando cambios");
    await modal.clickSubmit();
    await driver.sleep(3000);

    await checkError("Editar persona");
    await closeSwal();

    step("Verificando cambios en listado");
    await sidebar.goToPersonas();
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    const count = await list.getRowCount();
    expect(count).to.be.at.least(1, "Persona no encontrada después de editar");
    console.log(`>>> Persona editada: teléfono=${newPhone}, dirección=${newAddress}`);
  });

  // ── Test 6: Eliminar persona ───────────────────────────────────────
  it("6. Eliminar persona", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new PersonasListPage(driver, BASE);
    const person = createdPersons[1];

    step(`Buscando persona ${person.documentNumber}`);
    await sidebar.goToPersonas();
    expect(await list.isLoaded()).to.be.true;
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    step("Eliminando persona");
    await list.clickDeleteOnRow(person.firstName);
    await confirmSwal();
    await closeSwal();

    step("Verificando que aparece como inactiva");
    await sidebar.goToPersonas();
    await list.setStatusFilter("ALL");
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    const status = await list.getStatusOnRow(person.firstName);
    expect(status).to.equal("INACTIVE", "La persona debería estar inactiva después de eliminar");
    console.log(`>>> Persona ${person.documentNumber} eliminada correctamente`);
  });

  // ── Test 7: Restaurar persona ──────────────────────────────────────
  it("7. Restaurar persona eliminada", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new PersonasListPage(driver, BASE);
    const person = createdPersons[1];

    step(`Buscando persona inactiva ${person.documentNumber}`);
    await sidebar.goToPersonas();
    expect(await list.isLoaded()).to.be.true;
    await list.setStatusFilter("ALL");
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    step("Restaurando persona");
    await list.clickRestoreOnRow(person.firstName);
    await confirmSwal();
    await closeSwal();

    step("Verificando que vuelve a estar activa");
    await sidebar.goToPersonas();
    await list.setStatusFilter("ACTIVE");
    await list.search(person.documentNumber);
    await driver.sleep(2000);

    const count = await list.getRowCount();
    expect(count).to.be.at.least(1, "Persona restaurada no encontrada en activos");
    console.log(`>>> Persona ${person.documentNumber} restaurada correctamente`);
  });

  // ── Test 8: Filtros y búsqueda ─────────────────────────────────────
  it("8. Filtros de género y búsqueda por nombre", async function () {
    const sidebar = new SidebarPage(driver, BASE);
    const list = new PersonasListPage(driver, BASE);
    const person = createdPersons[0];

    step("Navegando a /personas");
    await sidebar.goToPersonas();
    expect(await list.isLoaded()).to.be.true;

    step("Filtrar por género Masculino");
    await list.setGenderFilter("M");
    await driver.sleep(1000);
    const rowsM = await list.getRowCount();
    console.log(`>>> Filtrado Masculino: ${rowsM} filas`);

    step("Filtrar por género Femenino");
    await list.setGenderFilter("F");
    await driver.sleep(1000);
    const rowsF = await list.getRowCount();
    console.log(`>>> Filtrado Femenino: ${rowsF} filas`);

    step("Volver a Todos");
    await list.setGenderFilter("ALL");
    await driver.sleep(1000);

    step(`Buscar por nombre: ${person.firstName}`);
    await list.search(person.firstName);
    await driver.sleep(2000);

    const searchCount = await list.getRowCount();
    expect(searchCount).to.be.at.least(1, `Búsqueda por nombre "${person.firstName}" no retornó resultados`);
    console.log(`>>> Búsqueda por nombre retornó ${searchCount} resultado(s)`);
  });
});
