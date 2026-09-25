import { By, until } from "selenium-webdriver";
import { BasePage } from "./BasePage.js";

export class LoginPage extends BasePage {
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/login`);
    await this.driver.wait(until.elementLocated(By.id("username")), 20000);
  }

  async login(username, password) {
    const u = await this.driver.findElement(By.id("username"));
    await u.sendKeys(username);
    const p = await this.driver.findElement(By.id("password"));
    await p.sendKeys(password);
    const btn = await this.driver.findElement(By.css("button[type='submit']"));
    await btn.click();
  }

  async waitForDashboard() {
    await this.driver.wait(async () => {
      const url = await this.driver.getCurrentUrl();
      return !url.includes("/login");
    }, 30000);
    await this.driver.executeScript(`
      document.querySelectorAll('.swal2-container, .swal2-popup').forEach(el => el.remove());
      document.body.style.overflow = '';
    `);
    await this.driver.sleep(500);
  }
}
