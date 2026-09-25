import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class SupplierDetailModal extends BasePage {
  MODAL_TITLE = By.xpath("//h3[contains(.,'Detalles del Proveedor')]");

  _modalXpath() {
    return "//h3[contains(.,'Detalles del Proveedor')]/ancestor::div[contains(@class,'rounded')][1]";
  }

  async waitOpen(legalName) {
    await this.driver.wait(until.elementLocated(this.MODAL_TITLE), 15000);
    if (legalName) {
      await this.driver.wait(async () => {
        const modal = await this.driver.findElement(By.xpath(this._modalXpath()));
        const text = await modal.getText();
        return text.includes(legalName);
      }, 10000, `Detalle no muestra ${legalName}`);
    }
    await this.driver.sleep(500);
  }

  async getHeaderLegalName() {
    const el = await this.driver.findElement(
      By.xpath(`${this._modalXpath()}//p[contains(@class,'text-slate-100')]`)
    );
    return (await el.getText()).trim();
  }

  async getModalText() {
    const modal = await this.driver.findElement(By.xpath(this._modalXpath()));
    return modal.getText();
  }

  async close() {
    const btn = await this.driver.findElement(
      By.xpath(
        `${this._modalXpath()}//h3[contains(.,'Detalles del Proveedor')]/ancestor::div[contains(@class,'justify-between')]//button`
      )
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(500);
  }
}
