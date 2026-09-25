import { By, until } from "selenium-webdriver";
import { BasePage } from "./BasePage.js";

export class SidebarPage extends BasePage {
  async goToBienes() {
    await this.driver.get(`${this.baseUrl}/bienes`);
    await this.driver.wait(until.elementLocated(
      By.xpath("//h1[contains(.,'Gestión de Bienes')]")
    ), 20000);
  }

  async goToMovimientos() {
    await this.driver.get(`${this.baseUrl}/movimientos`);
    await this.driver.wait(until.elementLocated(
      By.xpath("//h1[contains(.,'Movimientos de Activos')]")
    ), 20000);
  }

  async goToActas() {
    await this.driver.get(`${this.baseUrl}/actas`);
    await this.driver.wait(until.elementLocated(
      By.xpath("//h1[contains(.,'Actas de Entrega')]")
    ), 20000);
  }

  async goToProveedores() {
    await this.driver.get(`${this.baseUrl}/proveedores`);
    await this.driver.wait(until.elementLocated(
      By.xpath("//h1[contains(.,'Gestión de Proveedores')]")
    ), 20000);
  }

  async goToPersonas() {
    await this.driver.get(`${this.baseUrl}/personas`);
    await this.driver.wait(until.elementLocated(
      By.xpath("//h1[contains(.,'Gestión de Personas')]")
    ), 20000);
  }

  async goToInventarios() {
    await this.driver.get(`${this.baseUrl}/inventarios`);
    await this.driver.sleep(500);
  }

  async goToCategorias() {
    await this.driver.get(`${this.baseUrl}/categorias`);
    await this.driver.wait(until.elementLocated(
      By.xpath("//h1[contains(.,'Gestión de Categorías')]")
    ), 20000);
  }

}
