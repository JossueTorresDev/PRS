import { By } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class HandoverReceiptListPage extends BasePage {
  TITLE = By.xpath("//h1[contains(.,'Actas de Entrega')]");
  TABLE_ROWS = By.xpath("//tbody/tr");
  STATUS_DROPDOWN = By.xpath("//label[contains(.,'Estado')]/following::button[1]");

  async isLoaded() {
    return this.isVisible(this.TITLE);
  }

  async waitForTable(timeout = 20000) {
    await this.driver.wait(async () => {
      const rows = await this.driver.findElements(this.TABLE_ROWS);
      return rows.length > 0;
    }, timeout).catch(() => {});
  }

  async filterByStatusLabel(label) {
    await this.jsClick(this.STATUS_DROPDOWN);
    await this.driver.sleep(300);
    const option = await this.driver.findElement(
      By.xpath(`//button[contains(@class,'hover:bg-blue-50') and contains(normalize-space(.),'${label}')]`)
    );
    await this.driver.executeScript("arguments[0].click()", option);
    await this.driver.sleep(1500);
  }

  async _closeDetailsIfOpen() {
    const closeButtons = await this.driver.findElements(
      By.xpath("//button[.//*[name()='svg' and contains(@class,'h-6')]]")
    );
    if (closeButtons.length > 0) {
      await this.driver.executeScript("arguments[0].click()", closeButtons[0]);
      await this.driver.sleep(500);
    }
  }

  async findActaForMovement(movementNumber, maxRows = 20) {
    await this.waitForTable();
    const rows = await this.driver.findElements(this.TABLE_ROWS);
    const limit = Math.min(rows.length, maxRows);

    for (let i = 0; i < limit; i++) {
      const currentRows = await this.driver.findElements(this.TABLE_ROWS);
      if (i >= currentRows.length) break;

      const viewBtn = await currentRows[i].findElement(
        By.xpath(".//button[@title='Ver detalles']")
      );
      await this.driver.executeScript("arguments[0].click()", viewBtn);
      await this.driver.sleep(2000);

      const body = await this.driver.findElement(By.tagName("body")).getText();
      if (body.includes(movementNumber)) {
        await this._closeDetailsIfOpen();
        return true;
      }

      await this._closeDetailsIfOpen();
    }

    return false;
  }
}
