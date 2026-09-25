import { By } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class HandoverReceiptListPage extends BasePage {
  TITLE = By.xpath("//h1[contains(.,'Actas de Entrega') or contains(.,'Actas')]");
  NUEVA_ACTA = By.xpath("//button[contains(.,'Nueva Acta') or contains(.,'Nuevo Acta') or contains(.,'Nueva Acta de Entrega')]");
  TABLE_ROWS = By.css("tbody tr");
  SEARCH = By.xpath("//input[@placeholder='Buscar por número de acta...' or @placeholder='Buscar por número de acta...']");

  async isLoaded() {
    return this.isVisible(this.TITLE);
  }

  async getRowCount() {
    return (await this.driver.findElements(this.TABLE_ROWS)).length;
  }

  async getLastReceiptNumber() {
    const el = await this.driver.findElement(By.xpath("//tbody/tr[last()]//td[1]//p[contains(@class,'font-semibold') or normalize-space(text())]"));
    return (await el.getText()).trim();
  }

  async search(term) {
    const el = await this.driver.findElement(this.SEARCH);
    await this.driver.executeScript("arguments[0].value = ''", el);
    await el.sendKeys(term);
  }

  async clickNuevaActa() {
    await this.jsClick(this.NUEVA_ACTA);
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

  async clickViewOnRow(text) {
    const row = await this._findRowByText(text);
    await this.driver.executeScript("arguments[0].click()",
      await row.findElement(By.xpath(".//button[@title='Ver'] | .//button[contains(.,'Ver')]")));
  }

  async clickEditOnRow(text) {
    const row = await this._findRowByText(text);
    await this.driver.executeScript("arguments[0].click()",
      await row.findElement(By.xpath(".//button[@title='Editar'] | .//button[contains(.,'Editar')]")));
  }
}
