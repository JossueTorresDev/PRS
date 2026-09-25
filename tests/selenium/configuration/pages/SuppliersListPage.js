import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class SuppliersListPage extends BasePage {
  TITLE = By.xpath("//h1[contains(.,'Gestión de Proveedores')]");
  NUEVO_PROVEEDOR = By.xpath("//button[contains(.,'Nuevo Proveedor')]");
  SEARCH = By.xpath("//input[@placeholder='RUC, razón social, nombre comercial o email...']");
  TABLE_ROWS = By.xpath("//tbody/tr[td]");

  async isLoaded() {
    return this.isVisible(this.TITLE);
  }

  async waitForTable(timeout = 20000) {
    await this.driver.wait(async () => {
      const loading = await this.driver.findElements(
        By.xpath("//*[contains(text(),'Cargando proveedores')]")
      );
      if (loading.length) return false;
      const rows = await this.driver.findElements(this.TABLE_ROWS);
      return rows.length > 0;
    }, timeout).catch(() => {});
    await this.driver.sleep(500);
  }

  async getRowCount() {
    return (await this.driver.findElements(this.TABLE_ROWS)).length;
  }

  async hasNuevoProveedorButton() {
    return this.isVisible(this.NUEVO_PROVEEDOR, 3000);
  }

  async clickNuevoProveedor() {
    await this.jsClick(this.NUEVO_PROVEEDOR);
  }

  async search(term) {
    const el = await this.driver.wait(until.elementLocated(this.SEARCH), 10000);
    await el.clear();
    await el.sendKeys(term);
    await this.driver.sleep(1500);
  }

  _rowLocator(text) {
    return By.xpath(
      `//tbody/tr[.//td[contains(normalize-space(.), '${text}')]]`
    );
  }

  async waitForRowByText(text, timeout = 20000) {
    await this.driver.wait(async () => {
      const rows = await this.driver.findElements(this._rowLocator(text));
      return rows.length > 0;
    }, timeout, `Proveedor no encontrado en listado: ${text}`);
  }

  async _findRowByText(text) {
    await this.waitForRowByText(text);
    return this.driver.findElement(this._rowLocator(text));
  }

  async getStatusOnRow(text) {
    const row = await this._findRowByText(text);
    const statusCell = await row.findElement(By.xpath(".//td[6]"));
    return (await statusCell.getText()).trim();
  }

  async getLegalNameOnRow(text) {
    const row = await this._findRowByText(text);
    const cell = await row.findElement(By.xpath(".//td[2]"));
    return (await cell.getText()).split("\n")[0].trim();
  }

  async getClassificationOnRow(text) {
    const row = await this._findRowByText(text);
    const cell = await row.findElement(By.xpath(".//td[5]"));
    return (await cell.getText()).trim();
  }

  async clickViewOnRow(text) {
    const row = await this._findRowByText(text);
    const btn = await row.findElement(By.xpath(".//button[@title='Ver detalles']"));
    await this.driver.executeScript("arguments[0].click()", btn);
  }
}
