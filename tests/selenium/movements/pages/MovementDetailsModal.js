import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class MovementDetailsModal extends BasePage {
  _modalXpath() {
    return "//h2[contains(.,'Detalles del Movimiento')]/ancestor::div[contains(@class,'max-w-5xl')]";
  }

  TITLE = By.xpath("//h2[contains(.,'Detalles del Movimiento')]");
  APPROVE = By.xpath(
    "//h2[contains(.,'Detalles del Movimiento')]/ancestor::div[contains(@class,'max-w-5xl')]//button[contains(normalize-space(.), 'Aprobar')]"
  );
  IN_PROCESS = By.xpath(
    "//h2[contains(.,'Detalles del Movimiento')]/ancestor::div[contains(@class,'max-w-5xl')]//button[contains(normalize-space(.), 'En Proceso')]"
  );
  COMPLETE = By.xpath(
    "//h2[contains(.,'Detalles del Movimiento')]/ancestor::div[contains(@class,'max-w-5xl')]//button[contains(normalize-space(.), 'Completar')]"
  );
  STATUS = By.xpath(
    "//h2[contains(.,'Detalles del Movimiento')]/ancestor::div[contains(@class,'max-w-5xl')]//span[normalize-space(.)='Estado']/following-sibling::span[contains(@class,'rounded-full')]"
  );
  CLOSE = By.xpath(
    "//h2[contains(.,'Detalles del Movimiento')]/ancestor::div[contains(@class,'max-w-5xl')]//button[normalize-space(.)='Cerrar']"
  );

  async waitOpen(movementNumber = null) {
    await this.driver.wait(until.elementLocated(this.TITLE), 15000);
    if (movementNumber) {
      await this.driver.wait(async () => {
        const modal = await this.driver.findElement(By.xpath(this._modalXpath()));
        const text = await modal.getText();
        return text.includes(movementNumber);
      }, 15000, `Detalle no muestra ${movementNumber}`);
    }
    await this.driver.sleep(500);
  }

  async getStatusLabel() {
    const el = await this.driver.wait(until.elementLocated(this.STATUS), 10000);
    return (await el.getText()).trim();
  }

  async waitForStatus(expectedLabel, timeout = 30000) {
    await this.driver.wait(async () => {
      try {
        return (await this.getStatusLabel()) === expectedLabel;
      } catch {
        return false;
      }
    }, timeout, `Estado no cambió a ${expectedLabel}`);
  }

  async _dismissSwal() {
    await this.driver.executeScript(`
      document.querySelectorAll('.swal2-container, .swal2-popup').forEach(el => el.remove());
      document.body.style.overflow = '';
    `);
    await this.driver.sleep(500);
  }

  async _confirmSwal(confirmText) {
    const btn = await this.driver.wait(
      until.elementLocated(
        By.xpath(`//button[contains(@class,'swal2-confirm') and contains(normalize-space(.), '${confirmText}')]`)
      ),
      15000
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(1500);
  }

  async _waitSwalContains(...texts) {
    await this.driver.wait(async () => {
      const popups = await this.driver.findElements(By.xpath("//div[contains(@class,'swal2-popup')]"));
      if (!popups.length) return false;
      const body = await popups[0].getText();
      return texts.some((t) => body.includes(t));
    }, 20000);
    await this.driver.sleep(1000);
    await this._dismissSwal();
  }

  async approve() {
    await this.jsClick(this.APPROVE);
    await this._confirmSwal("Sí, aprobar");
    await this._waitSwalContains("Aprobado");
    await this.waitForStatus("Aprobado");
  }

  async markInProcess() {
    await this.jsClick(this.IN_PROCESS);
    await this._confirmSwal("Sí, en proceso");
    await this._waitSwalContains("En Proceso");
    await this.waitForStatus("En Proceso");
  }

  async complete() {
    await this.jsClick(this.COMPLETE);
    await this._confirmSwal("Sí, completar");
    await this._waitSwalContains("Acta generada automáticamente", "Completado", "Movimiento completado");
    await this.waitForStatus("Completado");
  }

  async close() {
    const closeBtn = await this.driver.findElements(this.CLOSE);
    if (closeBtn.length > 0) {
      await this.driver.executeScript("arguments[0].click()", closeBtn[0]);
    }
    await this.driver.sleep(500);
  }
}
