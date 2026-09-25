import { By } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";


export class InventoryListPage extends BasePage {
  NUEVO_INVENTARIO = By.xpath("//button[contains(.,'Nuevo Inventario')]");
  TABLE_ROWS = By.css("tbody tr");
  SEARCH = By.xpath("//input[@placeholder='Buscar por número o descripción...']");


  async search(term) {
    const el = await this.driver.findElement(this.SEARCH);
    await el.clear();
    await el.sendKeys(term);
  }


  async clickNuevoInventario() {
    const btn = await this.driver.findElement(this.NUEVO_INVENTARIO);
    await this.driver.executeScript("arguments[0].click()", btn);
  }


  async getRowCount() {
    return (await this.driver.findElements(this.TABLE_ROWS)).length;
  }


  async _findRowByText(text) {
    return this.driver.findElement(By.xpath(`//tbody/tr[.//*[contains(text(), '${text}')]]`));
  }


  async clickViewOnRow(text) {
    const row = await this._findRowByText(text);
    const btn = await row.findElement(By.xpath(".//button[@title='Ver detalles']"));
    await this.driver.executeScript("arguments[0].click()", btn);
  }


  async clickStartOnRow(text) {
    const row = await this._findRowByText(text);
    const btn = await row.findElement(By.xpath(".//button[contains(@title,'Iniciar')]"));
    await this.driver.executeScript("arguments[0].click()", btn);
  }


  async getStatusOnRow(text) {
    const row = await this._findRowByText(text);
    return (await row.findElement(By.xpath(".//span[contains(@class,'rounded-full')]"))).getText();
  }
}
