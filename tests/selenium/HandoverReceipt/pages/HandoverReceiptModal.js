import { By, until, Key } from "selenium-webdriver";
import { Select } from "selenium-webdriver";
import { BasePage } from "../../pages/BasePage.js";

export class HandoverReceiptModal extends BasePage {
  ACTA_CODE = By.xpath("//input[@name='actaCode' or @name='code']");
  DESCRIPTION = By.xpath("//input[@name='description' or @name='descripcion' or //textarea[@name='description']]");
  DATE = By.xpath("//input[@name='date' or @name='actaDate']");
  RESPONSIBLE = By.xpath("//label[contains(.,'Responsable')]/following::input[@role='combobox']");
  AREA = By.xpath("//label[contains(.,'Área')]/following::input[@role='combobox']");
  ITEMS_TABLE = By.xpath("//table[contains(@class,'items')]");
  SAVE = By.xpath("//button[contains(.,'Guardar') or contains(.,'Registrar') or contains(.,'Crear')]");

  async waitOpen() {
    const locators = [this.ACTA_CODE, this.DATE, this.RESPONSIBLE, this.SAVE];
    await this.driver.wait(async () => {
      for (const loc of locators) {
        try {
          const els = await this.driver.findElements(loc);
          if (els.length > 0) return true;
        } catch {
          // ignore
        }
      }
      return false;
    }, 20000);
    await this.driver.sleep(300);
  }

  async safeSendKeys(by, text) {
    try {
      const el = await this.driver.findElement(by);
      await this.driver.executeScript("arguments[0].value = ''", el);
      await el.sendKeys(text);
      return true;
    } catch {
      return false;
    }
  }

  async _pickComboboxLabel(label, usedSet = new Set(), optionIndex = 0) {
    try {
      // First try native <select> following the label
      const selectEls = await this.driver.findElements(By.xpath(`//label[contains(.,'${label}')]/following::select[1]`));
      if (selectEls.length > 0) {
        try {
          const sel = selectEls[0];
          const options = await sel.findElements(By.tagName('option'));
          const validOptions = [];
          for (const opt of options) {
            try {
              const val = ((await opt.getAttribute('value')) || (await opt.getText())).trim();
              if (val && val !== '') {
                validOptions.push({ opt, val });
              }
            } catch {
              // ignore option read errors
            }
          }
          if (validOptions.length > 0) {
            let choice = validOptions[optionIndex] || validOptions[0];
            if (usedSet.has(choice.val)) {
              const fallback = validOptions.find(o => !usedSet.has(o.val));
              if (fallback) choice = fallback;
            }
            await choice.opt.click();
            await this.driver.sleep(200);
            usedSet.add(choice.val);
            return choice.val;
          }
        } catch {
          // fallback to combobox approach
        }
      }

      // Then try combobox/input-based dropdowns and other patterns
      // Build a list of xpath candidates to locate the control near the label
      const xpathCandidates = [
        `//label[contains(.,'${label}')]/following::input[@role='combobox' or @aria-haspopup='listbox'][1]`,
        `//label[contains(.,'${label}')]/following::select[1]`,
        `//label[contains(.,'${label}')]/following::div[contains(@class,'select')][1]`,
        `//label[contains(.,'${label}')]/following::button[@aria-haspopup='listbox'][1]`,
        `//label[contains(.,'${label}')]/ancestor::div[1]//input[@role='combobox'][1]`,
        `//input[@placeholder and contains(translate(@placeholder, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${label.toLowerCase()}')][1]`,
        `//*[@aria-label and contains(translate(@aria-label, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${label.toLowerCase()}')][1]`,
        `//label[contains(translate(normalize-space(string(.)), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${label.toLowerCase()}')]/following::*[self::div or self::button or self::input][1]`
      ];

      let control = null;
      for (const xp of xpathCandidates) {
        try {
          const els = await this.driver.findElements(By.xpath(xp));
          if (els.length > 0) { control = els[0]; break; }
        } catch {}
      }
      if (!control) return null;
      await this.driver.wait(until.elementIsVisible(control), 3000).catch(()=>{});
      try { await control.click(); } catch { await this.driver.executeScript('arguments[0].click()', control); }

      // Quick keyboard attempt: some comboboxes accept ArrowDown + Enter
      try {
        await control.sendKeys(Key.ARROW_DOWN, Key.ENTER);
        await this.driver.sleep(300);
        // if selection text appears in an option-like element, return it
        const maybeOpts = await this.driver.findElements(By.css("[role='option'], ul[role='listbox'] li, .react-select__single-value"));
        if (maybeOpts.length > 0) {
          try {
            const t = (await maybeOpts[0].getText()).trim();
            if (t) { usedSet.add(t); return t; }
          } catch {}
        }
      } catch {}

      const optionCandidateSelectors = [
        "[role='listbox'] [role='option']",
        "[role='listbox'] li",
        "ul[role='listbox'] li",
        "div[role='listbox'] [role='option']",
        ".react-select__menu div[class*='option']",
        "[role='combobox'] + ul li",
        "ul li"
      ];

      // wait until at least one candidate appears
      await this.driver.wait(async () => {
        for (const sel of optionCandidateSelectors) {
          const opts = await this.driver.findElements(By.css(sel));
          if (opts.length > 0) return true;
        }
        return false;
      }, 8000);

      // click the first visible option found (retry a couple times if options take time to render)
      for (const sel of optionCandidateSelectors) {
        const opts = await this.driver.findElements(By.css(sel));
        const visibleOpts = [];
        for (const opt of opts) {
          try {
            if (await opt.isDisplayed()) {
              const text = (await opt.getText()).trim();
              if (text && !usedSet.has(text)) {
                visibleOpts.push({ opt, text });
              }
            }
          } catch {
            // ignore and continue
          }
        }
        if (visibleOpts.length > 0) {
          const choice = visibleOpts[optionIndex] || visibleOpts[0];
          await this.driver.executeScript('arguments[0].scrollIntoView(true);', choice.opt);
          await choice.opt.click();
          await this.driver.sleep(300);
          usedSet.add(choice.text);
          return choice.text;
        }
      }

      // If none found, try a short retry loop (in case dropdown renders slowly)
      for (let i=0;i<3;i++) {
        await this.driver.sleep(300);
        for (const sel of optionCandidateSelectors) {
          const opts = await this.driver.findElements(By.css(sel));
          const visibleOpts = [];
          for (const opt of opts) {
            try {
              if (await opt.isDisplayed()) {
                const text = (await opt.getText()).trim();
                if (text && !usedSet.has(text)) {
                  visibleOpts.push({ opt, text });
                }
              }
            } catch {}
          }
          if (visibleOpts.length > 0) {
            const choice = visibleOpts[optionIndex] || visibleOpts[0];
            await this.driver.executeScript('arguments[0].scrollIntoView(true);', choice.opt);
            await choice.opt.click();
            await this.driver.sleep(300);
            usedSet.add(choice.text);
            return choice.text;
          }
        }
      }

      return null;
    } catch {
      return null;
    }
  }

  async fillAll(actaDesc) {
    // Fill description if present
    if (actaDesc) {
      await this.safeSendKeys(this.DESCRIPTION, actaDesc);
    }
    // Set unique acta code
    const uniqueCode = `ACT-${Date.now().toString(36).toUpperCase()}`;
    await this.driver.executeScript(`
      const input = document.querySelector('input[name="actaCode"]') || document.querySelector('input[name="code"]');
      if (input) {
        const proto = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
        proto.set.call(input, arguments[0]);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `, uniqueCode);
    await this.driver.sleep(200);

    // Fecha
    await this.safeSendKeys(this.DATE, '01012025');

      // Comboboxes - choose specific options by label position
      const comboLabels = [
        { label: 'Movimiento', index: 1 },
        { label: 'Generado por', index: 3 },
        { label: 'Responsable de Entrega', index: 1 },
        { label: 'Responsable de Recepción', index: 2 },
        { label: 'Testigo 1', index: 5 },
        { label: 'Testigo 2', index: 4 },
      ];
      const usedSelections = new Set();
      for (const item of comboLabels) {
        try { await this._pickComboboxLabel(item.label, usedSelections, item.index); } catch {}
      }

    // Add a minimal item if UI exposes a button; otherwise rely on default
    try {
      const addBtn = await this.driver.findElement(By.xpath("//button[contains(.,'Agregar Item') or contains(.,'Agregar')]"));
      await this.driver.executeScript('arguments[0].click()', addBtn);
      await this.driver.sleep(300);
      // fill first row inputs if present
      const firstQty = await this.driver.findElement(By.xpath("//table//tbody/tr[1]//input[@name='quantity' or @name='qty']"));
      try { await firstQty.clear(); await firstQty.sendKeys('1'); } catch {}
    } catch {
      // Ignore if the UI doesn't require adding items explicitly
    }

    // Fill three observation/conditions fields by label (as in screenshot)
    const obsMap = [
      { label: 'Observaciones de Entrega', value: actaDesc || 'Observaciones Entrega' },
      { label: 'Observaciones de Recepción', value: 'Observaciones Recepción' },
      { label: 'Condiciones Especiales', value: 'Condiciones especiales' },
    ];
    for (const o of obsMap) {
      try {
        const textareaBy = By.xpath(`//label[contains(., '${o.label}')]/following::textarea[1]`);
        await this.safeSendKeys(textareaBy, o.value);
      } catch {
        // ignore if not present
      }
    }

  }

  async save() {
    await this.jsClick(this.SAVE);
  }
}
