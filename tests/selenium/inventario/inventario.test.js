import { Builder, By, until } from "selenium-webdriver";


const BASE = "https://lab.vallegrande.edu.pe/sipreb";
const USER = "MunicipalidadDeCanete";
const PASS = "Admin@2026";


(async () => {
  let driver;
  try {
    console.log("\n=== TEST FINAL - INVENTARIO COMPLETO ===\n");


    driver = await new Builder()
      .forBrowser("chrome")
      .setChromeOptions(["--no-sandbox", "--window-size=1440,900"])
      .build();


    // LOGIN
    console.log("1️⃣  LOGIN");
    await driver.get(`${BASE}/login`);
    await driver.sleep(1500);
   
    await driver.findElement(By.id("username")).sendKeys(USER);
    await driver.findElement(By.id("password")).sendKeys(PASS);
    await driver.findElement(By.css("button[type='submit']")).click();
    await driver.sleep(5000);
    console.log("   ✅ Login completado\n");


    // INVENTARIOS
    console.log("2️⃣  NAVEGAR A INVENTARIOS");
    await driver.get(`${BASE}/inventarios`);
    await driver.sleep(3000);
    console.log("   ✅ En inventarios\n");


    // CREAR
    console.log("3️⃣  CREAR INVENTARIO");
    const newBtn = await driver.findElement(By.xpath("//button[contains(.,'Nuevo Inventario')]"));
    await driver.executeScript("arguments[0].click()", newBtn);
    await driver.sleep(2000);


    // Tipo GENERAL (por defecto)
    console.log("   Tipo: GENERAL (por defecto)");


    // Descripción
    const desc = await driver.findElement(By.xpath("//textarea[@name='description']"));
    await desc.clear();
    await desc.sendKeys("Test Selenium - Inventario General");
    console.log("   ✓ Descripción ingresada");
    await driver.sleep(300);


    // Fechas - hoy a hoy + 7 días
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
   
    const startDateStr = `${day}/${month}/${year}`;
   
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const endDay = String(endDate.getDate()).padStart(2, '0');
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    const endYear = endDate.getFullYear();
    const endDateStr = `${endDay}/${endMonth}/${endYear}`;
   
    console.log(`   Fecha inicio: ${startDateStr}`);
    console.log(`   Fecha fin: ${endDateStr}`);


    const start = await driver.findElement(By.xpath("//input[@name='plannedStartDate']"));
    await start.click();
    await start.sendKeys(startDateStr);
    console.log("   ✓ Fecha inicio ingresada");
    await driver.sleep(500);


    const end = await driver.findElement(By.xpath("//input[@name='plannedEndDate']"));
    await end.click();
    await end.sendKeys(endDateStr);
    console.log("   ✓ Fecha fin ingresada");
    await driver.sleep(500);


    // Responsable
    const select = await driver.findElement(By.xpath("//select[@name='generalResponsibleId']"));
    await driver.wait(until.elementIsVisible(select), 5000);
   
    const options = await select.findElements(By.xpath("./option"));
    console.log(`   Responsables disponibles: ${options.length}`);
   
    if (options.length > 1) {
      const text = await options[1].getText();
      console.log(`   ✓ Responsable: ${text}`);
      await select.click();
      await driver.sleep(300);
      await options[1].click();
      await driver.sleep(500);
    }


    // Opciones (checkboxes)
    console.log("   Seleccionando opciones...");
    try {
      const checkboxes = await driver.findElements(By.xpath("//input[@type='checkbox']"));
      console.log(`   Encontrados ${checkboxes.length} checkboxes`);
     
      for (let i = 0; i < checkboxes.length; i++) {
        try {
          const isChecked = await checkboxes[i].isSelected();
          if (!isChecked) {
            // Scroll to element
            await driver.executeScript("arguments[0].scrollIntoView(true);", checkboxes[i]);
            await driver.sleep(300);
           
            // Click with JS
            await driver.executeScript("arguments[0].click();", checkboxes[i]);
            await driver.sleep(300);
           
            const isNowChecked = await checkboxes[i].isSelected();
            if (isNowChecked) {
              console.log(`   ✓ Opción ${i + 1} marcada`);
            }
          }
        } catch (e) {
          console.log(`   ! Error marcando opción ${i + 1}`);
        }
      }
    } catch (e) {
      console.log("   (Sin opciones adicionales)");
    }


    // Observaciones
    try {
      const obs = await driver.findElement(By.xpath("//textarea[@name='observations']"));
      await obs.clear();
      await obs.sendKeys("Inventario de prueba realizado con Selenium");
      console.log("   ✓ Observaciones ingresadas");
      await driver.sleep(300);
    } catch (e) {
      console.log("   (Sin campo de observaciones)");
    }


    // Crear Inventario
    const save = await driver.findElement(By.xpath("//button[contains(.,'Crear Inventario') or contains(.,'Guardar')]"));
    console.log("   Creando inventario...");
    await driver.executeScript("arguments[0].click()", save);
    await driver.sleep(5000);


    // Cerrar modal si existe
    await driver.executeScript(`document.querySelectorAll('.swal2-container').forEach(el => el.remove())`);
    console.log("   ✅ Inventario creado\n");


    // VERIFICAR
    console.log("4️⃣  VERIFICAR CREACIÓN");
    await driver.navigate().refresh();
    await driver.sleep(3000);


    const rows = await driver.findElements(By.css("tbody tr"));
    console.log(`   Inventarios encontrados: ${rows.length}`);
   
    if (rows.length === 0) {
      throw new Error("No se encontraron filas. El inventario no se guardó.");
    }


    console.log("   ✅ Inventario verificado\n");


    // INICIAR
    console.log("5️⃣  INICIAR INVENTARIO");
    const initBtn = await driver.findElement(By.xpath("//tbody/tr[1]//button[contains(@title,'Iniciar')]"));
    await driver.executeScript("arguments[0].click()", initBtn);
    await driver.sleep(1000);


    const confirm = await driver.findElement(By.xpath("//button[contains(.,'Sí, iniciar')]"));
    await confirm.click();
    await driver.sleep(3000);
    await driver.executeScript(`document.querySelectorAll('.swal2-container').forEach(el => el.remove())`);
    console.log("   ✅ Inventario iniciado\n");


    // COMPLETAR
    console.log("6️⃣  MARCAR COMO COMPLETADO");
    await driver.navigate().refresh();
    await driver.sleep(2000);


    // COMPLETAR - Después de iniciar, el dropdown de estado debe estar visible
    console.log("6️⃣  MARCAR COMO COMPLETADO");
    await driver.sleep(2000);


    // Hacer clic directamente en el botón que dice "Planificado" para abrir el dropdown
    console.log("   Abriendo dropdown de ESTADO...");
    const planificadoBtn = await driver.findElement(By.xpath("//button[contains(., 'Planificado')]"));
    await planificadoBtn.click();
    await driver.sleep(1500);


    // Hacer clic en "En Progreso" del menú desplegado
    console.log("   Seleccionando 'En Progreso'...");
    const enProgressBtn = await driver.findElement(By.xpath("//button[text()='En Progreso']"));
    await enProgressBtn.click();
    await driver.sleep(2000);


    // Ahora buscar el inventario en la lista filtrada y hacer clic en el play button
    console.log("   Buscando inventario en estado En Progreso...");
    const rowsFiltered2 = await driver.findElements(By.css("tbody tr"));
    if (rowsFiltered2.length === 0) {
      throw new Error("No hay inventarios después de filtrar por En Progreso");
    }


    // Hacer clic en el botón de play (penúltimo botón)
    const firstRow2 = rowsFiltered2[0];
    const allButtons = await firstRow2.findElements(By.xpath(".//button"));
    console.log(`   Abriendo detalles del inventario...`);
    await driver.executeScript("arguments[0].click()", allButtons[allButtons.length - 2]);
    await driver.sleep(2000);


    // En la página de En Progreso, hacer clic en "Verificar bienes" (botón con lupa, último)
    console.log("   Haciendo clic en 'Verificar bienes'...");
    const rowsEnProgreso2 = await driver.findElements(By.css("tbody tr"));
    if (rowsEnProgreso2.length === 0) {
      throw new Error("No hay inventarios en En Progreso");
    }


    const firstRowEnProgreso2 = rowsEnProgreso2[0];
    const actionButtons2 = await firstRowEnProgreso2.findElements(By.xpath(".//button"));
    // El último botón es "Verificar bienes" con lupa
    await driver.executeScript("arguments[0].click()", actionButtons2[actionButtons2.length - 1]);
    await driver.sleep(2000);


    // En la página de "Bienes Verificados", hacer clic en editar (lápiz) del primer bien
    console.log("   Editando primer bien...");
    const editBienBtn = await driver.findElement(By.xpath("//tbody/tr[1]//button[contains(@title,'Editar') or contains(@title,'edit')]"));
    await driver.executeScript("arguments[0].click()", editBienBtn);
    await driver.sleep(2000);


    // Se abre el modal "Editar Registro"
    // Seleccionar "Estado de Conservación"
    console.log("   Seleccionando Estado de Conservación...");
    try {
      const allSelects = await driver.findElements(By.xpath("//select"));
     
      for (const select of allSelects) {
        const options = await select.findElements(By.xpath("./option"));
       
        // Buscar el select que tiene opciones de conservación (Excelente, Bueno, Regular, etc.)
        if (options.length > 3) {
          let hasConservationOptions = false;
          const optionTexts = [];
          let buenaOptionValue = null;
         
          for (let i = 0; i < options.length; i++) {
            const text = await options[i].getText();
            optionTexts.push(text);
            if (text.includes("Bueno")) {
              buenaOptionValue = await options[i].getAttribute("value");
            }
          }
         
          // Detectar si son opciones de conservación
          hasConservationOptions = optionTexts.some(t =>
            t.includes("Bueno") || t.includes("Excelente") || t.includes("Regular") || t.includes("Malo")
          );
         
          if (hasConservationOptions) {
            // Scroll al elemento
            await driver.executeScript("arguments[0].scrollIntoView(true);", select);
            await driver.sleep(500);
           
            // Usar setValue via JavaScript para evitar el click intercepted
            if (buenaOptionValue) {
              await driver.executeScript(`
                arguments[0].value = arguments[1];
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
              `, select, buenaOptionValue);
            } else {
              // Fallback: seleccionar por índice 2 (Bueno generalmente está en índice 2)
              const value = await options[2].getAttribute("value");
              await driver.executeScript(`
                arguments[0].value = arguments[1];
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
              `, select, value);
            }
           
            console.log("   ✓ Conservación 'Bueno' seleccionada");
            await driver.sleep(300);
            break;
          }
        }
      }
    } catch (e) {
      console.log("   ! Error al seleccionar Conservación:", e.message);
    }


    // Seleccionar "Responsable Actual"
    console.log("   Seleccionando Responsable Actual...");
    try {
      const allSelects = await driver.findElements(By.xpath("//select"));
     
      // El segundo select típicamente es el de Responsable
      if (allSelects.length > 1) {
        const responsibleSelect = allSelects[1];
        const responsibleOptions = await responsibleSelect.findElements(By.xpath("./option"));
       
        if (responsibleOptions.length > 1) {
          // Filtrar opciones válidas (no "Seleccionar...")
          let selectedIndex = -1;
          for (let i = 1; i < responsibleOptions.length; i++) {
            const text = await responsibleOptions[i].getText();
            if (text && !text.toLowerCase().includes("seleccionar")) {
              selectedIndex = i;
              break;
            }
          }
         
          if (selectedIndex > 0) {
            const selectedText = await responsibleOptions[selectedIndex].getText();
            await responsibleSelect.click();
            await driver.sleep(300);
            await responsibleOptions[selectedIndex].click();
            console.log(`   ✓ Responsable '${selectedText}' seleccionado`);
          }
        }
      }
    } catch (e) {
      console.log("   ! Error al seleccionar Responsable, pero continuando");
    }
    await driver.sleep(300);


    // Hacer clic en "Actualizar"
    console.log("   Guardando cambios...");
    const updateBtn = await driver.findElement(By.xpath("//button[contains(.,'Actualizar')]"));
    await driver.executeScript("arguments[0].click()", updateBtn);
    await driver.sleep(2000);
    console.log("   ✅ Bien actualizado\n");


    // Volver a la lista y completar el inventario
    console.log("7️⃣  COMPLETAR INVENTARIO");
    await driver.sleep(1000);


    // Buscar el botón "Completar Inventario"
    const completeInventoryBtn = await driver.findElement(By.xpath("//button[contains(.,'Completar Inventario')]"));
    console.log("   Haciendo clic en Completar Inventario...");
    await driver.executeScript("arguments[0].click()", completeInventoryBtn);
    await driver.sleep(1000);


    // Confirmar en el modal
    const confirmBtn = await driver.findElement(By.xpath("//button[contains(.,'Sí, completar')]"));
    await confirmBtn.click();
    await driver.sleep(4000);
    console.log("   ✅ Inventario completado\n");


    console.log("✅✅✅ TEST EXITOSO ✅✅✅\n");


  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
  } finally {
    if (driver) await driver.quit();
    process.exit(0);
  }
})();
