import { By, until } from "selenium-webdriver";
import { Select } from "selenium-webdriver";
import { BasePage } from "../../../pages/BasePage.js";

export class PersonModal extends BasePage {
  MODAL_TITLE = By.xpath(
    "//h2[contains(.,'Nueva Persona') or contains(.,'Editar Persona')]"
  );
  DOCUMENT_TYPE_SELECT = By.xpath("//select[@name='documentTypeId']");
  DOCUMENT_NUMBER = By.xpath("//input[@name='documentNumber']");
  FIRST_NAME = By.xpath("//input[@name='firstName']");
  LAST_NAME = By.xpath("//input[@name='lastName']");
  PERSONAL_PHONE = By.xpath("//input[@name='personalPhone']");
  WORK_PHONE = By.xpath("//input[@name='workPhone']");
  EMAIL = By.xpath("//input[@name='personalEmail']");
  ADDRESS = By.xpath("//textarea[@name='address']");
  SUBMIT_BTN = By.xpath(
    "//button[contains(.,'Registrar Persona') or contains(.,'Guardar Cambios')]"
  );
  CANCEL_BTN = By.xpath("//button[contains(.,'Cancelar')]");

  _modalXpath() {
    return "//h2[contains(.,'Nueva Persona') or contains(.,'Editar Persona')]/ancestor::div[contains(@class,'rounded-3xl')][1]";
  }

  _dateInputXpath(field) {
    return `${this._modalXpath()}//input[@placeholder='${field}']`;
  }

  async waitOpen() {
    await this.driver.wait(until.elementLocated(this.MODAL_TITLE), 15000);
    await this.driver.sleep(500);
  }

  async waitClosed(timeout = 15000) {
    await this.driver.wait(async () => {
      const modals = await this.driver.findElements(this.MODAL_TITLE);
      return modals.length === 0;
    }, timeout);
  }

  async selectDocumentType(value) {
    await this.driver.wait(async () => {
        const options = await this.driver.findElements(
            By.xpath("//select[@name='documentTypeId']/option[string-length(@value) > 0]")
        );
        return options.length > 0;
    }, 15000, "Las opciones de tipo de documento no cargaron");

    const el = await this.driver.findElement(this.DOCUMENT_TYPE_SELECT);
    const select = new Select(el);
    await select.selectByValue(String(value));
    await this.driver.sleep(500);
  }

  async setDocumentNumber(value) {
    const el = await this.driver.wait(
      until.elementLocated(this.DOCUMENT_NUMBER),
      10000
    );
    await el.clear();
    await el.sendKeys(value);
  }

 async setBirthDate(day, month, year) {
    const dayInput = await this.driver.wait(
      until.elementLocated(By.xpath(
        "//span[contains(text(),'Día')]/following-sibling::input[1]"
      )),
      10000
    );
    await dayInput.sendKeys(day);
    await this.driver.sleep(200);

    const monthInput = await this.driver.findElement(
      By.xpath("//span[contains(text(),'Mes')]/following-sibling::input[1]")
    );
    await monthInput.sendKeys(month);
    await this.driver.sleep(200);

    const yearInput = await this.driver.findElement(
      By.xpath("//span[contains(text(),'Año')]/following-sibling::input[1]")
    );
    await yearInput.sendKeys(year);
    await this.driver.sleep(300);
    await this.driver.executeScript("arguments[0].blur();", yearInput);
    await this.driver.sleep(300);
  }

  async setFirstName(value) {
    const el = await this.driver.wait(
      until.elementLocated(this.FIRST_NAME),
      10000
    );
    await el.clear();
    await el.sendKeys(value);
  }

  async setLastName(value) {
    const el = await this.driver.wait(
      until.elementLocated(this.LAST_NAME),
      10000
    );
    await el.clear();
    await el.sendKeys(value);
  }

  async setPersonalPhone(value) {
    const el = await this.driver.wait(
      until.elementLocated(this.PERSONAL_PHONE),
      10000
    );
    await el.clear();
    await el.sendKeys(value);
  }

  async setEmail(value) {
    const el = await this.driver.wait(
      until.elementLocated(this.EMAIL),
      10000
    );
    await el.clear();
    await el.sendKeys(value);
  }

  async setAddress(value) {
    const el = await this.driver.wait(
      until.elementLocated(this.ADDRESS),
      10000
    );
    await el.clear();
    await el.sendKeys(value);
  }

  async fillNaturalPerson(data) {
    await this.selectDocumentType(data.documentTypeId);
    await this.setDocumentNumber(data.documentNumber);
    await this.setBirthDate(data.birthDay, data.birthMonth, data.birthYear);
    await this.setFirstName(data.firstName);
    await this.setLastName(data.lastName);
    await this.setPersonalPhone(data.personalPhone);
    if (data.email) await this.setEmail(data.email);
    await this.setAddress(data.address);
  }

  async clickSubmit() {
    const btn = await this.driver.wait(
      until.elementLocated(this.SUBMIT_BTN),
      10000
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(1500);
  }

  async save(data) {
    await this.fillNaturalPerson(data);
    await this.clickSubmit();
  }
}
