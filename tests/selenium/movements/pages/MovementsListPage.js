import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class MovementsListPage extends BasePage {
  TITLE = By.xpath("//h1[contains(.,'Movimientos de Activos')]");
  NUEVO_MOVIMIENTO = By.xpath("//button[contains(.,'Nuevo Movimiento')]");
  SEARCH = By.xpath("//input[@placeholder='Buscar por numero, activo...']");
  TABLE_ROWS = By.xpath("//tbody/tr");

  async isLoaded() {
    return this.isVisible(this.TITLE);
  }

  async getRowCount() {
    return (await this.driver.findElements(this.TABLE_ROWS)).length;
  }

  async waitForTable(timeout = 15000) {
    await this.driver.wait(async () => {
      const rows = await this.driver.findElements(this.TABLE_ROWS);
      return rows.length > 0;
    }, timeout).catch(() => {});
  }

  async search(term) {
    const el = await this.driver.wait(until.elementLocated(this.SEARCH), 10000);
    await el.clear();
    await el.sendKeys(term);
    await this.driver.sleep(2500);
  }

  _rowLocator(text) {
    return By.xpath(
      `//tbody/tr[.//td[1][contains(normalize-space(.), '${text}')] or .//*[contains(text(), '${text}')]]`
    );
  }

  async waitForRowByText(text, timeout = 25000) {
    await this.driver.wait(async () => {
      const rows = await this.driver.findElements(this._rowLocator(text));
      return rows.length > 0;
    }, timeout, `Movimiento no encontrado en listado: ${text}`);
  }

  async _findRowByText(text) {
    await this.waitForRowByText(text);
    return this.driver.findElement(this._rowLocator(text));
  }

  async hasNuevoMovimientoButton() {
    return this.isVisible(this.NUEVO_MOVIMIENTO, 3000);
  }

  async clickNuevoMovimiento() {
    await this.jsClick(this.NUEVO_MOVIMIENTO);
  }

  async getMovementNumberByText(text) {
    const row = await this._findRowByText(text);
    return (await row.findElement(By.xpath(".//td[1]"))).getText();
  }

  async getStatusOnRowByText(text) {
    const row = await this._findRowByText(text);
    const statusCell = await row.findElement(By.xpath(".//td[5]"));
    return (await statusCell.getText()).trim();
  }

  async clickViewOnRowByText(text) {
    const row = await this._findRowByText(text);
    const btn = await row.findElement(By.xpath(".//button[@title='Ver detalles']"));
    await this.driver.executeScript("arguments[0].click()", btn);
  }

  async openMovementByNumber(movementNumber) {
    await this.search(movementNumber);
    await this.waitForRowByText(movementNumber);
    await this.clickViewOnRowByText(movementNumber);
  }

  async getStatusByMovementNumber(movementNumber) {
    await this.search(movementNumber);
    await this.waitForRowByText(movementNumber);
    return this.getStatusOnRowByText(movementNumber);
  }
}
