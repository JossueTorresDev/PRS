import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class MantenimientoFormModal extends BasePage {
  async waitOpen() {
    await this.driver.wait(
      until.elementLocated(By.xpath("//h2[contains(.,'Nuevo Mantenimiento') or contains(.,'Editar Mantenimiento')]")),
      15000
    );
  }

  async isVisible(by, timeout = 5000) {
    try {
      await this.driver.wait(until.elementLocated(by), timeout);
      return await (await this.driver.findElement(by)).isDisplayed();
    } catch {
      return false;
    }
  }

  async selectAsset(index = 0) {
    const pickerBtn = await this.driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Seleccionar activo')]")),
      10000
    );
    await this.driver.executeScript("arguments[0].click()", pickerBtn);
    await this.driver.sleep(1000);

    const assetOptions = await this.driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'fixed')]//button[contains(@class,'rounded-2xl') and contains(@class,'border')]")),
      10000
    );
    await this.driver.executeScript("arguments[0].click()", assetOptions);
    await this.driver.sleep(1000);
  }

  async selectMaintenanceType(type) {
    const labels = {
      PREVENTIVE: "Preventivo",
      CORRECTIVE: "Correctivo",
      PREDICTIVE: "Predictivo",
      EMERGENCY: "Emergencia",
    };
    const label = labels[type] || type;
    const btn = await this.driver.wait(
      until.elementLocated(By.xpath(`//button[contains(.,'${label}')]`)),
      10000
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(500);
  }

  async setScheduledDate(day, month, year) {
    const dayInput = await this.driver.wait(
      until.elementLocated(By.xpath("//input[@placeholder='DD']")),
      5000
    );
    await dayInput.clear();
    await dayInput.sendKeys(day);

    const monthInput = await this.driver.findElement(By.xpath("//input[@placeholder='MM']"));
    await monthInput.clear();
    await monthInput.sendKeys(month);

    const yearInput = await this.driver.findElement(By.xpath("//input[@placeholder='YYYY']"));
    await yearInput.clear();
    await yearInput.sendKeys(year);
    await this.driver.sleep(500);
  }

  async setWorkDescription(text) {
    const ta = await this.driver.wait(
      until.elementLocated(By.xpath("//textarea[contains(@placeholder,'tareas se deben')]")),
      5000
    );
    await ta.clear();
    await ta.sendKeys(text);
  }

  async setReportedProblem(text) {
    const ta = await this.driver.wait(
      until.elementLocated(By.xpath("//textarea[contains(@placeholder,'fallo o motivo')]")),
      5000
    );
    await ta.clear();
    await ta.sendKeys(text);
  }

  async selectTechnicalResponsible(index = 1) {
    const select = await this.driver.wait(
      until.elementLocated(By.xpath("//select[../label[contains(.,'Responsable Técnico')]] | //select[preceding-sibling::label[contains(.,'Responsable Técnico')]]")),
      10000
    );
    await this.driver.executeScript(
      `arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
      select,
      index
    );
    const options = await select.findElements(By.xpath("./option"));
    if (options.length > index) {
      const val = await options[index].getAttribute("value");
      await this.driver.executeScript(
        `arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
        select,
        val
      );
    }
    await this.driver.sleep(500);
  }

  async submit() {
    const btn = await this.driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Registrar Mantenimiento') or contains(.,'Guardar Cambios')]")),
      5000
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(3000);
  }

  async closeSwal() {
    await this.driver.executeScript(`
      document.querySelectorAll('.swal2-container, .swal2-popup').forEach(el => el.remove());
      document.body.style.overflow = '';
    `);
    await this.driver.sleep(500);
  }
}
