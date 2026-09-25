import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';

const API_BASE_URL = getEnv('VITE_GATEWAY_API_URL', '');

class PersonService {

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const response = await httpClient({
        method: options.method || 'GET',
        url,
        data: options.body ? JSON.parse(options.body) : undefined,
        headers: options.headers || {},
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getAllPersons() { return await this.request('/persons'); }
  async getPersonMe() { return await this.request('/persons/me'); }
  async getPersonById(personId) { return await this.request(`/persons/${personId}`); }

  async patchPersonMe(personData) {
    return await this.request('/persons/me', {
      method: 'PATCH',
      body: JSON.stringify(personData),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async patchPerson(id, personData) {
    return await this.request(`/persons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(personData),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async getPersonByDocument(documentTypeId, documentNumber) {
    return await this.request(`/persons/document/${documentTypeId}/${documentNumber}`);
  }

  async getPersonByEmail(email) {
    return await this.request(`/persons/email/${encodeURIComponent(email)}`);
  }

  async searchPersonsByName(name) {
    return await this.request(`/persons/search/name/${encodeURIComponent(name)}`);
  }

  async createPerson(personData) {
    return await this.request('/persons', {
      method: 'POST',
      body: JSON.stringify(personData),
    });
  }

  async updatePerson(personId, personData) {
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    const updatedBy = currentUser?.userId || 'system';
    return await this.request(`/persons/${personId}?updatedBy=${updatedBy}`, {
      method: 'PUT',
      body: JSON.stringify(personData),
    });
  }

  async deletePerson(personId) {
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    const updatedBy = currentUser?.userId || 'system';
    return await this.request(`/persons/${personId}?updatedBy=${updatedBy}`, {
      method: 'DELETE',
    });
  }

  async restorePerson(personId) {
    const currentUser = JSON.parse(sessionStorage.getItem('user'));
    const updatedBy = currentUser?.userId || 'system';
    return await this.request(`/persons/${personId}/restore?updatedBy=${updatedBy}`, {
      method: 'PATCH',
    });
  }

  async getInactivePersons() { return await this.request('/persons/inactive'); }
  async checkEmailExists(email) { return await this.request(`/persons/exists/email/${encodeURIComponent(email)}`); }

  async checkDocumentExists(documentTypeId, documentNumber) {
    return await this.request(`/persons/exists/document/${documentTypeId}/${documentNumber}`);
  }

  async getActivePersons() { return await this.request('/persons/active'); }
}

const personService = new PersonService();
export default personService;
