import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class CategoryListPage extends BasePage {
  TITLE = By.xpath("//h1[contains(.,'Gestión de Categorías')]");
  SEARCH = By.xpath(
    "//input[contains(@placeholder,'Buscar por código, nombre, descripción')]",
  );
  FILTER = By.xpath("//select[.//option[@value='todos']]");
  TABLE_ROWS = By.xpath("//tbody/tr[count(td)=7]");
  LOADING = By.xpath("//*[contains(text(),'Cargando categorías')]");
  FIRST_ROW = By.xpath("//tbody/tr[count(td)=7][1]");

  async isLoaded() {
    return this.isVisible(this.TITLE, 20000);
  }

  async waitForTable(timeout = 20000) {
    await this.driver
      .wait(async () => {
        const loading = await this.driver.findElements(this.LOADING);
        if (loading.length) return false;
        const rows = await this.driver.findElements(this.TABLE_ROWS);
        return rows.length > 0;
      }, timeout)
      .catch(() => {});
    await this.driver.sleep(500);
  }

  async getRowCount() {
    return (await this.driver.findElements(this.TABLE_ROWS)).length;
  }

  async search(term) {
    const el = await this.driver.wait(until.elementLocated(this.SEARCH), 10000);
    await el.clear();
    await el.sendKeys(term);
    await this.driver.sleep(1500);
  }

  async setFilter(value) {
    const select = await this.driver.findElement(this.FILTER);
    await this.driver.executeScript(
      "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
      select,
      value,
    );
    await this.driver.sleep(1000);
  }

  async getFirstRowCode() {
    const row = await this.driver.findElement(this.FIRST_ROW);
    const code = await row.findElement(By.xpath(".//td[1]//p[1]"));
    return (await code.getText()).trim();
  }

  async getFirstRowStatus() {
    const row = await this.driver.findElement(this.FIRST_ROW);
    const statusEl = await row.findElement(By.xpath(".//td[1]//p[2]"));
    const text = (await statusEl.getText()).trim();
    return text === "Activa" ? "ACTIVE" : "INACTIVE";
  }

  async clickDeleteOnFirstRow() {
    const row = await this.driver.findElement(this.FIRST_ROW);
    const btn = await row.findElement(
      By.xpath(".//button[@title='Inactivar']"),
    );
    await this.driver.executeScript("arguments[0].click()", btn);
  }

  async clickRestoreOnFirstRow() {
    const row = await this.driver.findElement(this.FIRST_ROW);
    const btn = await row.findElement(
      By.xpath(".//button[@title='Restaurar']"),
    );
    await this.driver.executeScript("arguments[0].click()", btn);
  }

  async clickEditOnFirstRow() {
    const row = await this.driver.findElement(this.FIRST_ROW);
    const btn = await row.findElement(
      By.xpath(".//button[@title='Editar']"),
    );
    await this.driver.executeScript("arguments[0].click()", btn);
  }
}
