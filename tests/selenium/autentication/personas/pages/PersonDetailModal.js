import { By, until } from "selenium-webdriver";
import { BasePage } from "../../../pages/BasePage.js";

export class PersonDetailModal extends BasePage {
  MODAL_HEADER = By.xpath(
    "//h2[contains(@class,'font-bold') and contains(@class,'text-white')]"
  );
   CLOSE_BTN = By.xpath(
    "//div[contains(@class,'bg-gradient-to-r') and contains(@class,'from-cyan-600')]//button[last()]"
  );

  async waitOpen() {
    await this.driver.wait(until.elementLocated(this.MODAL_HEADER), 15000);
    await this.driver.sleep(500);
  }

  async waitClosed(timeout = 10000) {
    await this.driver.wait(async () => {
      const modals = await this.driver.findElements(this.MODAL_HEADER);
      return modals.length === 0;
    }, timeout);
  }

  async getHeaderName() {
    const el = await this.driver.wait(
      until.elementLocated(this.MODAL_HEADER),
      10000
    );
    return (await el.getText()).trim();
  }

  async getModalText() {
    await this.driver.wait(until.elementLocated(this.MODAL_HEADER), 10000);
    const modal = await this.driver.findElement(
      By.xpath(
        "//h2[contains(@class,'font-bold') and contains(@class,'text-white')]/ancestor::div[contains(@class,'rounded-2xl')][1]"
      )
    );
    return await modal.getText();
  }

  async close() {
    const btn = await this.driver.wait(
      until.elementLocated(this.CLOSE_BTN),
      5000
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(500);
  }
}
