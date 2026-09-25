import { By, until, Select } from "selenium-webdriver";
import { BasePage } from "../../../pages/BasePage.js";

export class PersonasListPage extends BasePage {
  TITLE = By.xpath("//h1[contains(.,'Gestión de Personas')]");
  NUEVA_PERSONA = By.xpath("//button[contains(.,'Nueva Persona')]");
  SEARCH = By.xpath("//input[contains(@placeholder,'Nombre, documento, email')]");
  GENDER_FILTER = By.xpath("//select[preceding-sibling::label[contains(.,'Género')] or contains(@class,'cursor-pointer')][1]");
  STATUS_FILTER = By.xpath("//select[preceding-sibling::label[contains(.,'Estado')]]");
  TABLE_ROWS = By.xpath("//tbody/tr[td]");
  LOADING = By.xpath("//*[contains(text(),'Cargando personas')]");

  async isLoaded() {
    return this.isVisible(this.TITLE, 20000);
  }

  async waitForTable(timeout = 20000) {
    await this.driver.wait(async () => {
      const loading = await this.driver.findElements(this.LOADING);
      if (loading.length) return false;
      const rows = await this.driver.findElements(this.TABLE_ROWS);
      return rows.length > 0;
    }, timeout).catch(() => {});
    await this.driver.sleep(500);
  }

  async getRowCount() {
    return (await this.driver.findElements(this.TABLE_ROWS)).length;
  }

  async hasNuevaPersonaButton() {
    return this.isVisible(this.NUEVA_PERSONA, 3000);
  }

  async clickNuevaPersona() {
    await this.jsClick(this.NUEVA_PERSONA);
  }

  async search(term) {
    const el = await this.driver.wait(until.elementLocated(this.SEARCH), 10000);
    await el.clear();
    await el.sendKeys(term);
    await this.driver.sleep(1500);
  }

  async setGenderFilter(value) {
    const selects = await this.driver.findElements(By.xpath("//select"));
    for (const sel of selects) {
      const options = await sel.findElements(By.xpath("./option"));
      for (const opt of options) {
        const text = await opt.getText();
        if (text.includes("Masculino") || text.includes("Todos")) {
          await this.driver.executeScript(
            "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
            sel,
            value
          );
          await this.driver.sleep(1000);
          return;
        }
      }
    }
  }

  async setStatusFilter(value) {
    const selects = await this.driver.findElements(By.xpath("//select"));
    for (const sel of selects) {
      const options = await sel.findElements(By.xpath("./option"));
      for (const opt of options) {
        const text = await opt.getText();
        if (text.includes("Activos") || text.includes("Inactivos")) {
          const select = new Select(sel);
          await select.selectByValue(value);
          await this.driver.sleep(1000);
          return;
        }
      }
    }
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
    }, timeout, `Persona no encontrada en listado: ${text}`);
  }

  async _findRowByText(text) {
    await this.waitForRowByText(text);
    return this.driver.findElement(this._rowLocator(text));
  }

  async clickViewOnRow(text) {
    const row = await this._findRowByText(text);
    const btn = await row.findElement(By.xpath(".//button[@title='Ver detalles']"));
    await this.driver.executeScript("arguments[0].click()", btn);
  }

  async clickEditOnRow(text) {
    const row = await this._findRowByText(text);
    const btn = await row.findElement(By.xpath(".//button[@title='Editar']"));
    await this.driver.executeScript("arguments[0].click()", btn);
  }

  async clickDeleteOnRow(text) {
    const row = await this._findRowByText(text);
    const btn = await row.findElement(By.xpath(".//button[@title='Eliminar']"));
    await this.driver.executeScript("arguments[0].click()", btn);
  }

  async clickRestoreOnRow(text) {
    const row = await this._findRowByText(text);
    const btn = await row.findElement(By.xpath(".//button[@title='Reactivar']"));
    await this.driver.executeScript("arguments[0].click()", btn);
  }

  async getStatusOnRow(text) {
    const row = await this._findRowByText(text);
    const nameCell = await row.findElement(By.xpath(".//td[1]//div"));
    const className = await nameCell.getAttribute("class");
    if (className.includes("text-red")) return "INACTIVE";
    return "ACTIVE";
  }

  async getNameOnRow(text) {
    const row = await this._findRowByText(text);
    const cell = await row.findElement(By.xpath(".//td[1]//div"));
    return (await cell.getText()).trim();
  }
}
