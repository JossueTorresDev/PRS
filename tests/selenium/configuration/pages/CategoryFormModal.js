import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class CategoryFormModal extends BasePage {
  MODAL_TITLE = By.xpath("//h2[text()='Editar Categoría']");

  _modalXpath() {
    return "//h2[text()='Editar Categoría']/ancestor::div[contains(@class,'rounded-3xl')][1]";
  }

  _fieldXpath(name) {
    return `${this._modalXpath()}//*[@name='${name}']`;
  }

  async waitOpen() {
    await this.driver.wait(until.elementLocated(this.MODAL_TITLE), 15000);
    await this.driver.sleep(500);
  }

  async waitClosed(timeout = 15000) {
    await this.driver.wait(async () => {
      const titles = await this.driver.findElements(this.MODAL_TITLE);
      return titles.length === 0;
    }, timeout);
  }

  async setDescription(value) {
    const el = await this.driver.wait(
      until.elementLocated(By.xpath(this._fieldXpath("description"))),
      10000
    );
    await el.clear();
    await this.driver.sleep(300);
    for (const char of value) {
      await el.sendKeys(char);
      await this.driver.sleep(80);
    }
  }

  async clickGuardar() {
    const btn = await this.driver.findElement(
      By.xpath(`${this._modalXpath()}//button[text()='Guardar Cambios']`)
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(800);
  }

  async editDescription(descripcion) {
    await this.waitOpen();
    await this.setDescription(descripcion);
    await this.clickGuardar();
  }
}
