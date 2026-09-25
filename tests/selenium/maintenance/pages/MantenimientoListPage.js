import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class MantenimientoListPage extends BasePage {
  async isLoaded() {
    try {
      await this.driver.wait(
        until.elementLocated(By.xpath("//h1[contains(.,'Mantenimientos')]")),
        20000
      );
      return true;
    } catch {
      return false;
    }
  }

  async waitForTable(timeout = 20000) {
    await this.driver.wait(
      until.elementLocated(By.css("table tbody tr")),
      timeout
    );
  }

  async getRowCount() {
    const rows = await this.driver.findElements(By.css("table tbody tr"));
    return rows.length;
  }

  async hasNuevaSolicitudButton() {
    const btns = await this.driver.findElements(
      By.xpath("//button[contains(.,'Nueva Solicitud')]")
    );
    return btns.length > 0;
  }

  async clickNuevaSolicitud() {
    const btn = await this.driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Nueva Solicitud')]")),
      10000
    );
    await this.driver.executeScript("arguments[0].click()", btn);
  }

  async search(text) {
    const input = await this.driver.wait(
      until.elementLocated(By.xpath("//input[contains(@placeholder,'Buscar') or contains(@placeholder,'buscar')]")),
      10000
    );
    await input.clear();
    await input.sendKeys(text);
    await this.driver.sleep(1500);
  }

  async getStatusOnRow(maintenanceCode) {
    const rows = await this.driver.findElements(By.css("table tbody tr"));
    for (const row of rows) {
      const text = await row.getText();
      if (text.includes(maintenanceCode)) {
        const badges = await row.findElements(
          By.xpath(".//span[contains(@class,'inline-flex')]")
        );
        for (const badge of badges) {
          const t = await badge.getText();
          if (
            [
              "Programado", "En Proceso", "Pend. Conformidad",
              "Confirmado", "Suspendido", "Cancelado",
            ].includes(t.trim())
          ) {
            return t.trim();
          }
        }
      }
    }
    return null;
  }

  async clickOnRow(maintenanceCode) {
    const rows = await this.driver.findElements(By.css("table tbody tr"));
    for (const row of rows) {
      const text = await row.getText();
      if (text.includes(maintenanceCode)) {
        await this.driver.executeScript("arguments[0].click()", row);
        await this.driver.sleep(1000);
        return true;
      }
    }
    return false;
  }

  async clickActionsOnRow(maintenanceCode) {
    const rows = await this.driver.findElements(By.css("table tbody tr"));
    for (const row of rows) {
      const text = await row.getText();
      if (text.includes(maintenanceCode)) {
        const actionBtn = await row.findElement(
          By.xpath(".//button[@title='Acciones'] | .//button[contains(@class,'p-2')]")
        );
        await this.driver.executeScript("arguments[0].click()", actionBtn);
        await this.driver.sleep(500);
        return true;
      }
    }
    return false;
  }

  async clickActionInMenu(actionLabel) {
    const btn = await this.driver.wait(
      until.elementLocated(
        By.xpath(`//div[contains(@style,'position: fixed')]//button[contains(.,'${actionLabel}')]`)
      ),
      5000
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(1000);
  }
}
