import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class SupplierFormModal extends BasePage {
  MODAL_TITLE = By.xpath(
    "//h3[contains(.,'Nuevo Proveedor') or contains(.,'Editar Proveedor')]"
  );
  GUARDAR = By.xpath(
    "//h3[contains(.,'Proveedor')]/ancestor::div[contains(@class,'rounded-2xl')]//button[contains(.,'Guardar') or contains(.,'Actualizar')]"
  );

  _modalXpath() {
    return "//h3[contains(.,'Nuevo Proveedor') or contains(.,'Editar Proveedor')]/ancestor::div[contains(@class,'rounded-2xl')][1]";
  }

  _confirmationXpath() {
    return "//h3[contains(.,'Confirmar Registro')]/ancestor::div[contains(@class,'rounded-2xl')][1]";
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
      const modals = await this.driver.findElements(this.MODAL_TITLE);
      return modals.length === 0;
    }, timeout);
  }

  async _setInput(name, value) {
    const el = await this.driver.wait(
      until.elementLocated(By.xpath(this._fieldXpath(name))),
      10000
    );
    await el.clear();
    await el.sendKeys(value);
  }

  async _blurField(name) {
    const el = await this.driver.findElement(By.xpath(this._fieldXpath(name)));
    await this.driver.executeScript("arguments[0].blur();", el);
    await this.driver.sleep(300);
  }

  async _setSelect(name, value) {
    const el = await this.driver.wait(
      until.elementLocated(By.xpath(this._fieldXpath(name))),
      10000
    );
    await this.driver.executeScript(
      "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
      el,
      value
    );
    await this.driver.sleep(500);
  }

  async waitDocumentCheckDone() {
    const spinnerXpath = `${this._modalXpath()}//input[@name='numeroDocumento']/following-sibling::div//svg[contains(@class,'animate-spin')]`;
    await this.driver.wait(async () => {
      const spinners = await this.driver.findElements(By.xpath(spinnerXpath));
      return spinners.length === 0;
    }, 20000).catch(() => {});
    await this.driver.sleep(500);
  }

  async fillCreateForm(data, log = () => {}) {
    log("  · Información básica: tipo documento, DNI, razón social y nombre comercial");
    await this._setSelect("documentTypesId", String(data.documentTypesId || 1));
    await this._setInput("numeroDocumento", data.numeroDocumento);
    await this._blurField("numeroDocumento");
    log("  · Verificando que el DNI no esté registrado...");
    await this.waitDocumentCheckDone();

    await this._setInput("legalName", data.legalName);
    await this._blurField("legalName");
    await this._setInput("tradeName", data.tradeName);
    await this._blurField("tradeName");

    log("  · Información de contacto: dirección, teléfono, email, sitio web y contacto principal");
    await this._setInput("address", data.address);
    await this._blurField("address");
    await this._setInput("phone", data.phone);
    await this._blurField("phone");
    await this._setInput("email", data.email);
    await this._blurField("email");

    if (data.website) {
      await this._setInput("website", data.website);
      await this._blurField("website");
    }

    await this._setInput("mainContact", data.mainContact);
    await this._blurField("mainContact");

    log("  · Información tributaria: clasificación de empresa");
    await this._setSelect("classification", data.classification);
  }

  async assertNoValidationErrors() {
    const errors = await this.driver.findElements(
      By.xpath(`${this._modalXpath()}//p[contains(@class,'text-red-600')]`)
    );
    const texts = [];
    for (const el of errors) {
      const text = (await el.getText()).trim();
      if (text) texts.push(text);
    }
    if (texts.length) {
      throw new Error(`Errores de validación: ${texts.join(" | ")}`);
    }
  }

  async clickGuardar() {
    const btn = await this.driver.wait(until.elementLocated(this.GUARDAR), 10000);
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(800);
  }

  async waitConfirmationOpen() {
    await this.driver.wait(
      until.elementLocated(By.xpath(`${this._confirmationXpath()}//h3[contains(.,'Confirmar Registro')]`)),
      10000
    );
  }

  async confirmSave() {
    await this.waitConfirmationOpen();
    const btn = await this.driver.findElement(
      By.xpath(`${this._confirmationXpath()}//button[contains(.,'Sí, Guardar') or contains(.,'Sí, Actualizar')]`)
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(1500);
  }

  async saveNewSupplier(data, log = () => {}) {
    await this.fillCreateForm(data, log);
    log("  · Revisando que no haya errores de validación...");
    await this.assertNoValidationErrors();
    log("  · Clic en Guardar...");
    await this.clickGuardar();
    log("  · Confirmando registro en el diálogo...");
    await this.confirmSave();
    log("  · Esperando cierre del formulario...");
    await this.waitClosed();
  }
}
