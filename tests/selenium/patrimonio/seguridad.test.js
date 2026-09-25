import { expect } from "chai";
import { Builder, By, until } from "selenium-webdriver";
import { LoginPage } from "../pages/LoginPage.js";
import { SidebarPage } from "../pages/SidebarPage.js";

const BASE = process.env.BASE_URL || "https://lab.vallegrande.edu.pe/sipreb";

// ── Prueba 1: Autenticación requerida ──────────────────────────────────────
// Objetivo: Verificar que no se puede acceder a rutas protegidas
// sin haber iniciado sesión.
//
// Procedimiento:
//   1. Abrir navegador SIN hacer login
//   2. Intentar navegar directamente a /bienes (ruta protegida)
//   3. Verificar que el sistema redirige a /login
//
// Resultado esperado:
//   El sistema redirige automáticamente a la página de inicio de sesión,
//   impidiendo el acceso no autenticado.
//
// Tipo de ataque que previene:
//   Forced Browsing — un atacante que conoce la URL del módulo no puede
//   acceder sin un token de autenticación válido.
//
describe("Patrimonio - Seguridad", function () {
  this.timeout(300000);
  let driver;

  it("1. Autenticación requerida - acceder a /bienes sin login", async function () {
    driver = await new Builder().forBrowser("chrome")
      .setChromeOptions(["--headless=new", "--no-sandbox", "--window-size=1440,900"])
      .build();

    // 1. Ir directamente a /bienes sin iniciar sesión
    await driver.get(`${BASE}/bienes`);
    await driver.sleep(5000);

    // 2. Verificar que la URL actual contiene /login
    //    Si el sistema no tuviera protección de rutas, mostraría
    //    la página de gestión de bienes directamente.
    const currentUrl = await driver.getCurrentUrl();
    const redirigeALogin = currentUrl.includes("/login");

    expect(redirigeALogin,
      "Autenticación requerida: se accedió a /bienes sin login. " +
      "La ruta no está protegida."
    ).to.be.true;

    await driver.quit();
  });

  // ── Prueba 2: Control de acceso por roles (Role Guard) ───────────────────
  // Objetivo: Verificar que el sistema restringe funcionalidades según
  // el rol del usuario.
  //
  // Procedimiento:
  //   1. Iniciar sesión con un usuario que tiene rol PATRIMONIO_GESTOR
  //   2. Navegar a Gestión de Bienes
  //   3. Verificar que el botón "Nuevo Bien" está visible
  //      (el role guard permite la creación solo a roles autorizados)
  //
  // Resultado esperado:
  //   El usuario con rol PATRIMONIO_GESTOR puede ver y acceder
  //   al botón de creación de bienes.
  //
  // Nota:
  //   Este test verifica el escenario positivo (usuario autorizado).
  //   Para probar el escenario negativo (denegar acceso a usuarios
  //   sin rol), se necesitaría una segunda cuenta sin privilegios.
  //   El Role Guard en el frontend usa <RoleGuard allowedRoles={[...]}>
  //   que oculta los elementos si el usuario no tiene el rol requerido.
  //
  it("2. Role Guard - verificar acceso a crear bien con rol autorizado", async function () {
    driver = await new Builder().forBrowser("chrome")
      .setChromeOptions(["--headless=new", "--no-sandbox", "--window-size=1440,900"])
      .build();

    // 1. Login con usuario que tiene rol PATRIMONIO_GESTOR
    await new LoginPage(driver, BASE).navigateTo();
    await new LoginPage(driver, BASE).login("MunicipalidadDeCanete", "Admin@2026");
    await new LoginPage(driver, BASE).waitForDashboard();

    // 2. Navegar a Gestión de Bienes
    await new SidebarPage(driver, BASE).goToBienes();
    await driver.sleep(2000);

    // 3. Verificar que el botón "Nuevo Bien" existe (rol autorizado)
    //    Si el usuario no tuviera el rol PATRIMONIO_GESTOR,
    //    el RoleGuard ocultaría este botón del DOM.
    const nuevoBienBtn = By.xpath("//button[contains(.,'Nuevo Bien')]");
    const btnVisible = await (
      await driver.findElements(nuevoBienBtn)
    ).length > 0;

    expect(btnVisible,
      "Role Guard: el botón 'Nuevo Bien' no está visible. " +
      "El usuario autenticado no tiene el rol PATRIMONIO_GESTOR " +
      "o el Role Guard no está funcionando correctamente."
    ).to.be.true;

    // 4. Click en el botón y verificar que el modal se abre
    await driver.findElement(nuevoBienBtn).click();
    const modalDescription = By.xpath("//input[@name='description']");
    const modalAbierto = await (
      await driver.findElements(modalDescription)
    ).length > 0;

    expect(modalAbierto,
      "Role Guard: no se pudo abrir el modal de creación. " +
      "El rol PATRIMONIO_GESTOR no tiene permisos efectivos."
    ).to.be.true;

    await driver.quit();
  });
});
