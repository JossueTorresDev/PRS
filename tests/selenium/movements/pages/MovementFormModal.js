import { By, until } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class MovementFormModal extends BasePage {
  MODAL_TITLE = By.xpath("//h2[contains(.,'Nuevo Movimiento') or contains(.,'Editar Movimiento')]");
  SIGUIENTE = By.xpath("//div[contains(@class,'max-w-5xl')]//button[contains(.,'Siguiente')]");
  CREAR = By.xpath("//button[contains(.,'Crear Movimiento') or contains(.,'Actualizar Movimiento')]");
  REASON = By.xpath("//textarea[@name='reason']");

  _modalContentXpath() {
    return "//div[contains(@class,'max-w-5xl') and contains(@class,'rounded-3xl')]";
  }

  _assetComboXpath() {
    return `${this._modalContentXpath()}//input[@role='combobox' and contains(@placeholder,'Buscar y agregar bien')]`;
  }

  _selectXpath(name) {
    return `${this._modalContentXpath()}//select[@name='${name}']`;
  }

  async waitOpen() {
    await this.driver.wait(until.elementLocated(this.MODAL_TITLE), 15000);
    await this.driver.sleep(1000);
  }

  async waitAssetsLoaded() {
    await this.driver.wait(async () => {
      const loading = await this.driver.findElements(
        By.xpath(`${this._modalContentXpath()}//*[contains(text(),'Cargando activos')]`)
      );
      return loading.length === 0;
    }, 30000);
    await this.driver.sleep(1000);
  }

  async waitAssetChecksDone() {
    await this.driver.wait(async () => {
      const loading = await this.driver.findElements(
        By.xpath(`${this._modalContentXpath()}//*[contains(text(),'Verificando movimientos activos')]`)
      );
      return loading.length === 0;
    }, 30000);
  }

  async waitOriginDestinationTab() {
    await this.driver.wait(
      until.elementLocated(
        By.xpath(`${this._modalContentXpath()}//*[contains(text(),'Responsables y ubicaciones')]`)
      ),
      15000
    );
    await this.driver.wait(async () => {
      const selects = await this.driver.findElements(By.xpath(this._selectXpath("destinationLocationId")));
      return selects.length > 0;
    }, 15000);
    await this.driver.sleep(500);
  }

  async waitUsersTab() {
    await this.driver.wait(until.elementLocated(this.REASON), 15000);
    await this.driver.sleep(500);
  }

  async _tryGetSelectValues(name) {
    const selects = await this.driver.findElements(By.xpath(this._selectXpath(name)));
    if (!selects.length) return [];
    const options = await selects[0].findElements(By.xpath(".//option"));
    const values = [];
    for (const opt of options) {
      const value = await opt.getAttribute("value");
      if (value) values.push(value);
    }
    return values;
  }

  async _getSelectCurrentValue(name) {
    const selects = await this.driver.findElements(By.xpath(this._selectXpath(name)));
    if (!selects.length) return "";
    return (await selects[0].getAttribute("value")) || "";
  }

  async _setSelectValue(name, value) {
    const selectEl = await this.driver.wait(
      until.elementLocated(By.xpath(this._selectXpath(name))),
      15000,
      `Select ${name} no visible`
    );
    await this.driver.executeScript(
      "arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('change', { bubbles: true }));",
      selectEl,
      value
    );
    await this.driver.sleep(800);
  }

  async _setSelectValueWithVerify(name, value, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt += 1) {
      await this._setSelectValue(name, value);
      const current = await this._getSelectCurrentValue(name);
      if (String(current) === String(value)) return;
      await this.driver.sleep(600);
    }
    throw new Error(`No se pudo establecer ${name} con valor ${value}`);
  }

  async _waitSelectEnabled(name, timeout = 15000) {
    await this.driver.wait(async () => {
      const selects = await this.driver.findElements(By.xpath(this._selectXpath(name)));
      if (!selects.length) return false;
      return selects[0].isEnabled();
    }, timeout, `Select ${name} no se habilitó`);
  }

  async _waitSelectHasOptions(name, minCount = 1, timeout = 15000) {
    await this.driver.wait(async () => {
      const values = await this._tryGetSelectValues(name);
      return values.length >= minCount;
    }, timeout, `Select ${name} sin opciones`);
  }

  async addAssetByCode(assetCode) {
    const comboXpath = this._assetComboXpath();
    const input = await this.driver.wait(until.elementLocated(By.xpath(comboXpath)), 10000);
    await input.click();
    await input.clear();
    await input.sendKeys(assetCode);
    await this.driver.sleep(800);

    const optionsXpath = `${comboXpath}/following-sibling::ul//li[contains(., '${assetCode}')]`;
    const opt = await this.driver.wait(
      until.elementLocated(By.xpath(optionsXpath)),
      15000,
      `No se encontró el bien disponible ${assetCode} en el buscador`
    );
    const label = (await opt.getText()).trim();
    await this.driver.executeScript(
      "arguments[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));",
      opt
    );
    await this.waitAssetChecksDone();
    await this.driver.sleep(1500);
    return label || assetCode;
  }

  async _openAssetDropdown() {
    const comboXpath = this._assetComboXpath();
    const input = await this.driver.wait(until.elementLocated(By.xpath(comboXpath)), 10000);
    await input.click();
    await input.clear();
    await this.driver.sleep(500);
    return { input, comboXpath };
  }

  _enUsoMovementTypes() {
    return ["INITIAL_ASSIGNMENT", "REASSIGNMENT", "AREA_TRANSFER", "EXTERNAL_TRANSFER", "LOAN"];
  }

  async addFirstAvailableAsset() {
    const { comboXpath } = await this._openAssetDropdown();
    const optionsXpath = `${comboXpath}/following-sibling::ul//li`;

    await this.driver.wait(async () => {
      const opts = await this.driver.findElements(By.xpath(optionsXpath));
      for (const opt of opts) {
        const text = (await opt.getText()).trim();
        if (text && !text.startsWith("--") && !text.includes("No hay más bienes")) return true;
      }
      return false;
    }, 15000, "No aparecieron bienes disponibles en el buscador");

    const opts = await this.driver.findElements(By.xpath(optionsXpath));
    let lastError = "No hay bienes en el combobox";

    for (const opt of opts) {
      const text = (await opt.getText()).trim();
      if (!text || text.startsWith("--") || text.includes("No hay más bienes")) continue;

      try {
        await this.driver.executeScript(
          "arguments[0].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));",
          opt
        );
        await this.waitAssetChecksDone();
        await this.driver.sleep(1500);

        if (await this._assetUsableAfterAdd()) {
          return text;
        }

        lastError = `Bien ${text.split(" - ")[0].trim()} sin tipo válido o con movimiento activo`;
        await this.removeAddedAsset();
        await this._openAssetDropdown();
      } catch (err) {
        lastError = err.message;
        await this._openAssetDropdown();
      }
    }

    throw new Error(`No hay bienes disponibles en el selector del movimiento. ${lastError}`);
  }

  async removeAddedAsset() {
    const btn = await this.driver.findElement(
      By.xpath(`${this._modalContentXpath()}//button[@title='Quitar bien']`)
    );
    await this.driver.executeScript("arguments[0].click()", btn);
    await this.driver.sleep(1000);
  }

  async _assetUsableAfterAdd() {
    await this.waitAssetAdded();
    await this.waitAssetChecksDone();
    await this.driver.sleep(1000);

    const activeWarnings = await this.driver.findElements(
      By.xpath(
        `${this._modalContentXpath()}//*[contains(text(),'ya tiene') or contains(text(),'movimiento activo')]`
      )
    );
    if (activeWarnings.length) return false;

    try {
      await this._waitSelectHasOptions("movementType", 1, 20000);
    } catch {
      return false;
    }

    const options = await this._tryGetSelectValues("movementType");
    return options.some((type) => this._enUsoMovementTypes().includes(type));
  }

  async addDisponibleAsset(assetCodes) {
    let lastError = "Sin candidatos";

    for (const code of assetCodes) {
      try {
        const label = await this.addAssetByCode(code);
        if (await this._assetUsableAfterAdd()) {
          return { label, code };
        }
        await this.removeAddedAsset();
        lastError = `El bien ${code} tiene movimiento activo o no admite asignación/reasignación`;
      } catch (err) {
        lastError = err.message;
      }
    }

    try {
      const label = await this.addFirstAvailableAsset();
      const code = label.split(" - ")[0].trim();
      return { label, code };
    } catch (err) {
      lastError = err.message;
    }

    throw new Error(`No se pudo agregar un bien disponible al movimiento. ${lastError}`);
  }

  async waitAssetAdded() {
    await this.driver.wait(async () => {
      const empty = await this.driver.findElements(
        By.xpath(`${this._modalContentXpath()}//*[contains(text(),'Sin bienes agregados')]`)
      );
      return empty.length === 0;
    }, 10000);
  }

  async selectRequiredMovementType() {
    await this.driver.wait(async () => {
      const values = await this._tryGetSelectValues("movementType");
      return values.length > 0;
    }, 15000, "Tipo de movimiento sin opciones tras agregar el bien");

    await this.driver.sleep(1000);

    const options = await this._tryGetSelectValues("movementType");
    const preferredTypes = this._enUsoMovementTypes();
    const current = await this._getSelectCurrentValue("movementType");
    if (current && options.includes(current) && preferredTypes.includes(current)) {
      return current;
    }

    const typeToUse = preferredTypes.find((type) => options.includes(type)) || options[0];
    if (!typeToUse) {
      throw new Error("Debe seleccionar el tipo de movimiento (campo obligatorio)");
    }

    await this._setSelectValueWithVerify("movementType", typeToUse);
    await this.driver.sleep(800);

    const finalType = await this._getSelectCurrentValue("movementType");
    if (!finalType) {
      throw new Error("No se pudo establecer el tipo de movimiento");
    }
    return finalType;
  }

  async getCreatedMovementNumber() {
    await this.driver.wait(async () => {
      const popups = await this.driver.findElements(By.xpath("//div[contains(@class,'swal2-popup')]"));
      if (!popups.length) return false;
      const text = await popups[0].getText();
      return /N[úu]mero de Movimiento:/i.test(text);
    }, 20000, "No apareció el número de movimiento tras crear");

    const text = await this.driver.findElement(By.xpath("//div[contains(@class,'swal2-popup')]")).getText();
    const match = text.match(/N[úu]mero de Movimiento:\s*(\S+)/i);
    if (!match) {
      throw new Error("No se pudo leer el número de movimiento del mensaje de éxito");
    }
    return match[1].trim();
  }

  async fillOriginDestinationTab() {
    const areas = await this._tryGetSelectValues("originAreaId");
    if (areas.length < 2) {
      throw new Error("Se necesitan al menos 2 áreas distintas para origen y destino");
    }

    let originArea = await this._getSelectCurrentValue("originAreaId");
    if (!originArea) {
      originArea = areas[0];
      await this._setSelectValueWithVerify("originAreaId", originArea);
    }

    await this._waitSelectHasOptions("originLocationId");
    let originLocation = await this._getSelectCurrentValue("originLocationId");
    if (!originLocation) {
      const originLocations = await this._tryGetSelectValues("originLocationId");
      if (!originLocations.length) throw new Error("Falta ubicación de origen");
      await this._setSelectValueWithVerify("originLocationId", originLocations[0]);
    }

    await this._waitSelectEnabled("originResponsibleId");
    await this._waitSelectHasOptions("originResponsibleId");
    const originUsers = await this._tryGetSelectValues("originResponsibleId");
    if (!originUsers.length) throw new Error("Falta responsable de origen");
    const originResponsible = originUsers[0];
    await this._setSelectValueWithVerify("originResponsibleId", originResponsible);

    const destinationArea = areas.find((a) => String(a) !== String(originArea));
    if (!destinationArea) {
      throw new Error("No se encontró un área de destino distinta al origen");
    }
    await this._setSelectValueWithVerify("destinationAreaId", destinationArea);

    await this._waitSelectHasOptions("destinationLocationId");
    const destLocations = await this._tryGetSelectValues("destinationLocationId");
    if (!destLocations.length) throw new Error("Falta ubicación de destino");
    await this._setSelectValueWithVerify("destinationLocationId", destLocations[0]);

    await this._waitSelectEnabled("destinationResponsibleId");
    await this._waitSelectHasOptions("destinationResponsibleId");
    const destUsers = await this._tryGetSelectValues("destinationResponsibleId");
    const destUser = destUsers.find((u) => u !== originResponsible) || destUsers[1];
    if (!destUser) {
      throw new Error("No hay responsable de destino distinto al de origen");
    }
    await this._setSelectValueWithVerify("destinationResponsibleId", destUser);

    const finalOriginArea = await this._getSelectCurrentValue("originAreaId");
    const finalDestArea = await this._getSelectCurrentValue("destinationAreaId");
    if (String(finalOriginArea) === String(finalDestArea)) {
      throw new Error("El área de origen y destino quedaron iguales tras completar el formulario");
    }
  }

  async fillUsersTab(reason) {
    const reasonEl = await this.driver.wait(until.elementLocated(this.REASON), 10000);
    await reasonEl.clear();
    await reasonEl.sendKeys(reason);

    const requestingUsers = await this._tryGetSelectValues("requestingUser");
    const executingUsers = await this._tryGetSelectValues("executingUser");
    if (!requestingUsers.length || !executingUsers.length) {
      throw new Error("Faltan usuarios solicitante o ejecutor");
    }
    await this._setSelectValue("requestingUser", requestingUsers[0]);
    const executingUser = executingUsers.find((u) => u !== requestingUsers[0]) || executingUsers[0];
    await this._setSelectValue("executingUser", executingUser);
  }

  async assertNoValidationErrors() {
    const errors = await this.driver.findElements(
      By.xpath(
        `${this._modalContentXpath()}//p[contains(@class,'text-red-600') or contains(@class,'text-red-700')]`
      )
    );
    if (errors.length > 0) {
      const texts = [];
      for (const el of errors) {
        const text = (await el.getText()).trim();
        if (text) texts.push(text);
      }
      if (texts.length > 0) {
        throw new Error(`Errores de validación: ${texts.join(" | ")}`);
      }
    }
  }

  async fillCreateForm(reason, assetCodes) {
    await this.waitAssetsLoaded();

    const codes = Array.isArray(assetCodes) ? assetCodes : [assetCodes].filter(Boolean);
    let assetLabel;
    let usedCode;

    if (codes.length) {
      ({ label: assetLabel, code: usedCode } = await this.addDisponibleAsset(codes));
    } else {
      assetLabel = await this.addFirstAvailableAsset();
      usedCode = assetLabel.split(" - ")[0].trim();
    }

    const movementType = await this.selectRequiredMovementType();
    console.log(`>>> Tipo de movimiento seleccionado: ${movementType}`);
    await this.assertNoValidationErrors();
    await this.jsClick(this.SIGUIENTE);
    await this.waitOriginDestinationTab();

    await this.fillOriginDestinationTab();
    await this.assertNoValidationErrors();
    await this.jsClick(this.SIGUIENTE);
    await this.waitUsersTab();

    await this.fillUsersTab(reason);
    await this.assertNoValidationErrors();
    await this.jsClick(this.SIGUIENTE);
    await this.jsClick(this.CREAR);

    return { assetLabel, assetCode: usedCode, movementType };
  }
}
