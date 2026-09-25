import { By, until } from "selenium-webdriver";

export class BasePage {
  constructor(driver, baseUrl) {
    this.driver = driver;
    this.baseUrl = baseUrl;
  }

  async navigateTo(path = "") {
    await this.driver.get(`${this.baseUrl}${path}`);
  }

  async jsClick(by) {
    const el = await this.driver.wait(until.elementLocated(by), 10000);
    await this.driver.executeScript("arguments[0].click()", el);
  }

  async sendKeys(by, text) {
    const el = await this.driver.wait(until.elementLocated(by), 10000);
    await this.driver.executeScript("arguments[0].value = '';", el);
    await el.sendKeys(text);
  }

  async getText(by) {
    return (await this.driver.wait(until.elementLocated(by), 10000)).getText();
  }

  async isVisible(by, timeout = 5000) {
    try {
      await this.driver.wait(until.elementLocated(by), timeout);
      return await (await this.driver.findElement(by)).isDisplayed();
    } catch {
      return false;
    }
  }
}
