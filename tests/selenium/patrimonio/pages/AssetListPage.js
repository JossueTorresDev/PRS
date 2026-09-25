import { By } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class AssetListPage extends BasePage {
  TITLE = By.xpath("//h1[contains(.,'Gestión de Bienes')]");
  NUEVO_BIEN = By.xpath("//button[contains(.,'Nuevo Bien')]");
  TABLE_ROWS = By.css("tbody tr");
  SEARCH = By.xpath("//input[@placeholder='Buscar por código, descripción o marca...']");

  async isLoaded() {
    return this.isVisible(this.TITLE);
  }

  async getRowCount() {
    return (await this.driver.findElements(this.TABLE_ROWS)).length;
  }

  async search(term) {
    const el = await this.driver.findElement(this.SEARCH);
    await el.clear();
    await el.sendKeys(term);
  }

  async clickNuevoBien() {
    await this.jsClick(this.NUEVO_BIEN);
  }

  async waitForTable(timeout = 10000) {
    await this.driver.wait(async () => {
      const rows = await this.driver.findElements(this.TABLE_ROWS);
      return rows.length > 0;
    }, timeout);
  }

  async _findRowByText(text) {
    return this.driver.findElement(By.xpath(`//tbody/tr[.//*[contains(text(), '${text}')]]`));
  }

  async clickEditOnRow(text) {
    const row = await this._findRowByText(text);
    await this.driver.executeScript("arguments[0].click()",
      await row.findElement(By.xpath(".//button[@title='Editar']")));
  }

  async clickDepreciationOnRow(text) {
    const row = await this._findRowByText(text);
    await this.driver.executeScript("arguments[0].click()",
      await row.findElement(By.xpath(".//button[@title='Historial de depreciación']")));
  }

  async clickDeleteOnRow(text) {
    const row = await this._findRowByText(text);
    await this.driver.executeScript("arguments[0].click()",
      await row.findElement(By.xpath(".//button[@title='Dar de baja']")));
  }

  async getStatusOnRow(text) {
    const row = await this._findRowByText(text);
    return (await row.findElement(By.xpath(".//span[contains(@class,'rounded-full')]"))).getText();
  }
}
