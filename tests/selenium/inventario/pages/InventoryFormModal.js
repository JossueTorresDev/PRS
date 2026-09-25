import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";


export class InventoryFormModal extends BasePage {
  DESCRIPTION = By.xpath("//textarea[@name='description']");
  INVENTORY_TYPE = By.xpath("//select[@name='inventoryType']");
  PLANNED_START_DATE = By.xpath("//input[@name='plannedStartDate']");
  PLANNED_END_DATE = By.xpath("//input[@name='plannedEndDate']");
  GENERAL_RESPONSIBLE = By.xpath("//select[@name='generalResponsibleId']");
  SAVE_BUTTON = By.xpath("//button[contains(.,'Guardar')]");


  async waitOpen(timeout = 5000) {
    await this.driver.wait(until.elementLocated(this.DESCRIPTION), timeout);
  }


  async fillDescription(description) {
    const el = await this.driver.findElement(this.DESCRIPTION);
    await el.clear();
    await el.sendKeys(description);
  }


  async setStartDate(date) {
    const el = await this.driver.findElement(this.PLANNED_START_DATE);
    await el.clear();
    await el.sendKeys(date);
  }


  async setEndDate(date) {
    const el = await this.driver.findElement(this.PLANNED_END_DATE);
    await el.clear();
    await el.sendKeys(date);
  }


  async selectResponsibleByIndex(index = 1) {
    const select = await this.driver.findElement(this.GENERAL_RESPONSIBLE);
    const options = await select.findElements(By.xpath("./option"));
    if (options.length > index) {
      await options[index].click();
    }
  }


  async save() {
    const btn = await this.driver.findElement(this.SAVE_BUTTON);
    await this.driver.executeScript("arguments[0].click()", btn);
  }
}
