import httpClient from '../../../shared/services/httpClient.js';
import { getEnv } from '../../../shared/utils/env.js';
import { getMunicipalityId } from '../../../shared/utils/municipalityHelper.js';
import { LOGO_URL } from '../../../assets/index.js';
import { uploadFile } from '../../../shared/services/storageService.js';
import personService from '../../ms-02-authentication/services/personService';
import userService from '../../ms-02-authentication/services/userService';
import roleService from '../../ms-02-authentication/services/roleService';
import assignmentService from '../../ms-02-authentication/services/assignmentService';

const API_BASE_URL = `${getEnv('VITE_GATEWAY_API_URL')}/municipalities`;

export const getDocumentTypes = async () => {
  try {
    const GATEWAY_URL = getEnv('VITE_GATEWAY_API_URL');
    const { data } = await httpClient.get(`${GATEWAY_URL}/document-types`);
    if (Array.isArray(data)) {
      return data.map(dt => ({
        id: dt.id || dt.documentTypeId,
        name: dt.name || dt.typeName || dt.tipo || `Tipo ${dt.id}`
      }));
    }
    return null;
  } catch (error) {
    return null;
  }
};

const toApiType = (uiTipo) => {
  switch ((uiTipo || '').toUpperCase()) {
    case 'PROVINCIAL': return 'PROVINCIAL';
    case 'DISTRITAL': return 'DISTRICT';
    case 'CENTRO POBLADO': return 'TOWN_CENTER';
    default: return uiTipo;
  }
};

const fromApiType = (apiType) => {
  switch ((apiType || '').toUpperCase()) {
    case 'PROVINCIAL': return 'PROVINCIAL';
    case 'DISTRICT': return 'DISTRITAL';
    case 'TOWN_CENTER': return 'CENTRO POBLADO';
    default: return apiType;
  }
};

const mapToApi = (m) => {
  if (!m) return m;
  return {
    id: m.id,
    name: m.nombre,
    ruc: m.ruc,
    ubigeoCode: m.ubigeo,
    municipalityType: toApiType(m.tipo),
    department: m.departamento,
    province: m.provincia,
    district: m.distrito,
    address: m.direccion,
    phoneNumber: m.telefono,
    mobileNumber: m.celular,
    email: m.email,
    website: m.website,
    mayorName: m.alcalde,
    isActive: m.activo,
    logoUrl: m.logoUrl || '',
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
};

const mapFromApi = (m) => {
  if (!m) return m;
  return {
    id: m.id,
    nombre: m.name,
    ruc: m.ruc,
    ubigeo: m.ubigeoCode,
    tipo: fromApiType(m.municipalityType),
    departamento: m.department,
    provincia: m.province,
    distrito: m.district,
    direccion: m.address,
    telefono: m.phoneNumber,
    celular: m.mobileNumber,
    email: m.email,
    website: m.website,
    alcalde: m.mayorName,
    activo: m.isActive,
    logoUrl: m.logoUrl || '',
    adminUsername: m.adminUsername,
    adminPasswordHash: m.adminPasswordHash,
    personaNombres: m.personaNombres || m.firstName || '',
    personaApellidos: m.personaApellidos || m.lastName || '',
    personaEmail: m.personaEmail || m.personEmail || '',
    personaDni: m.personaDni || m.documentNumber || '',
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
  };
};

const determineMunicipalCode = (selectedList, fallbackId) => {
  if (!selectedList) return fallbackId;
  try {
    const arr = Array.isArray(selectedList) ? selectedList : [selectedList];
    if (arr.length === 1 && arr[0]) return arr[0];
  } catch (e) {
  }
  return fallbackId;
};

const buildPersonPayload = (data, municipalityCode) => {
  return {
    firstName: (data.personaNombres || data.firstName || '').toString().trim() || 'NOMBRE',
    lastName: (data.personaApellidos || data.lastName || '').toString().trim() || 'APELLIDO',
    documentNumber: (data.personaDni || data.documentNumber || '').toString().trim() || '00000000',
    documentTypeId: parseInt(data.personaTipoDocumento || data.documentTypeId, 10) || 1,
    personalPhone: (data.personaTelefono || data.personalPhone || '').toString().trim() || '900000000',
    email: (data.personaEmail || data.email || '').toString().trim() || 'admin@vallegrande.edu.pe',
    personalEmail: (data.personaEmail || data.email || '').toString().trim() || 'admin@vallegrande.edu.pe',
    gender: (data.personaGenero || data.gender || 'M').toString().toUpperCase(),
    personType: (data.personaTipoPersona || data.personType || 'N').toString().toUpperCase(),
    birthDate: (data.personaFechaNacimiento || data.birthDate || '1990-01-01').toString(),
    address: (data.personaDireccion || data.address || data.direccion || 'Sin direccion').toString(),
    municipalCode: municipalityCode || null,
    municipality_code: municipalityCode || null,
    override_municipality_code: true
  };
};

const ensurePerson = async (data, municipalityCode) => {
  if (data?.personaNombres || data?.personaApellidos || data?.personaDni) {
    try {
      const found = await personService.getPersonByDocument(parseInt(data.personaTipoDocumento) || 1, data.personaDni).catch(() => null);
      let persona = null;
      if (found) {
        const existing = Array.isArray(found) ? (found.find(p => p.documentNumber === data.personaDni) || found[0]) : found;
        const existingId = existing?.id || existing?.personId || existing?.person_id;
        if (existingId) {
          persona = await personService.updatePerson(existingId, buildPersonPayload(data, municipalityCode)).catch(() => null);
          if (persona && !persona.id && !persona.personId && !persona.person_id) {
            persona = { ...persona, id: existingId };
          }
        }
      }
      if (!persona) {
        persona = await personService.createPerson(buildPersonPayload(data, municipalityCode)).catch(() => null);
      }
      return persona || null;
    } catch (err) {
      return null;
    }
  }
  try {
    if (data?.adminUsername) {
      const foundUser = await userService.getUserByUsername(data.adminUsername).catch(() => null);
      const user = Array.isArray(foundUser) ? (foundUser.find(u => u.username === data.adminUsername) || foundUser[0]) : foundUser;
      const personIdFromUser = user?.personId || user?.person_id;
      if (personIdFromUser) {
        const existingPerson = await personService.getPersonById(personIdFromUser).catch(() => null);
        const existingPersonId = existingPerson?.id || existingPerson?.personId || existingPerson?.person_id;
        if (existingPersonId) {
          const partial = buildPersonPayload({ ...existingPerson, ...data }, municipalityCode);
          let persona = await personService.updatePerson(existingPersonId, partial).catch(() => null);
          if (persona && !persona.id && !persona.personId && !persona.person_id) {
            persona = { ...persona, id: existingPersonId };
          }
          return persona;
        }
      }
    }
  } catch (e) {
  }
  return null;
};

const buildUserPayload = (username, password, roles, personId, municipalityCode) => {
  const userRoles = (roles && roles.length > 0) ? roles : ['TENANT_ADMIN'];
  const payload = {
    username,
    status: 'ACTIVE',
    municipalCode: municipalityCode,
    municipality_code: municipalityCode,
    person_id: personId,
    roles: userRoles,
    override_municipality_code: true
  };
  if (password) payload.password = password;
  return payload;
};

const ensureUser = async (username, password, roles, personId, municipalityCode) => {
  if (!username) return null;
  try {
    const found = await userService.getUserByUsername(username).catch(() => null);
    const existing = Array.isArray(found) ? (found.find(u => u.username === username) || found[0]) : found;
    let user = null;
    const existingUserId = existing?.id || existing?.userId || existing?.user_id;
    if (existingUserId) {
      user = await userService.updateUser(existingUserId, buildUserPayload(username, password, roles, personId, municipalityCode)).catch(() => null);
      if (user && !user.id && !user.userId && !user.user_id) {
        user = { ...user, id: existingUserId };
      }
    } else {
      user = await userService.createUser(buildUserPayload(username, password, roles, personId, municipalityCode)).catch(() => null);
    }
    if (user) {
      const userId = user.id || user.userId || user.user_id;
      try {
        const targetRoles = (roles && roles.length > 0) ? roles : ['TENANT_ADMIN'];
        for (const roleName of targetRoles) {
          try {
            const roleData = await roleService.getRoleByName(roleName).catch(() => null);
            const roleId = roleData?.id || roleData?.roleId;
            if (roleId) {
              const currentRoles = await assignmentService.getUserRoles(userId).catch(() => []);
              const hasRole = currentRoles.some(r => r.roleId === roleId || r.roleName === roleName);
              if (!hasRole) {
                await assignmentService.assignRoleToUser(userId, roleId).catch(err => {});
              }
            }
          } catch (roleErr) {
          }
        }
      } catch (syncErr) {
      }
    }
    return user;
  } catch (err) {
    return null;
  }
};

export const getMunicipalidades = async () => {
  const { data } = await httpClient.get(API_BASE_URL);
  const list = Array.isArray(data) ? data : (data.data || []);
  return { data: list.map(mapFromApi) };
};

export const getMunicipalidadById = async (id) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/${id}`);
  return mapFromApi(data);
};

export const getMunicipalidadDetails = async (id) => {
  try {
    const { data } = await httpClient.get(`${API_BASE_URL}/${id}/details`);

    const mappedMuni = mapFromApi(data.municipality);

    let personaNombres = '';
    let personaApellidos = '';
    let personaEmail = '';
    let adminUsername = data.adminUsername || '';

    if (data.person) {
      personaNombres = data.person.firstName || data.person.first_name || data.person.nombre || '';
      personaApellidos = data.person.lastName || data.person.last_name || data.person.apellido || '';
      personaEmail = data.person.email || data.person.emailAddress || data.person.mail || '';
    }

    if (data.authorityName && (!personaNombres || !personaApellidos)) {
      const nombreCompleto = data.authorityName.trim().split(' ');
      if (nombreCompleto.length > 0 && !personaNombres) personaNombres = nombreCompleto[0];
      if (nombreCompleto.length > 1 && !personaApellidos) personaApellidos = nombreCompleto.slice(1).join(' ');
    }

    if (data.firstName && !personaNombres) personaNombres = data.firstName;
    if (data.lastName && !personaApellidos) personaApellidos = data.lastName;
    if ((data.email || data.emailAddress) && !personaEmail) personaEmail = data.email || data.emailAddress;

    if ((!personaNombres || !personaApellidos || !personaEmail) && adminUsername) {
      try {
        const userData = await userService.getUserByUsername(adminUsername).catch(() => null);
        if (userData) {
          const user = Array.isArray(userData)
            ? userData.find(u => u.username === adminUsername) || userData[0]
            : userData;
          if (!personaNombres && (user.firstName || user.first_name)) personaNombres = user.firstName || user.first_name;
          if (!personaApellidos && (user.lastName || user.last_name)) personaApellidos = user.lastName || user.last_name;
          if (!personaEmail && (user.email || user.emailAddress || user.mail)) personaEmail = user.email || user.emailAddress || user.mail;
        }
      } catch (userError) {
      }
    }

    return {
      ...mappedMuni,
      adminUsername: adminUsername,
      adminPasswordHash: data.adminPasswordHash,
      personaNombres: personaNombres || '',
      personaApellidos: personaApellidos || '',
      personaEmail: personaEmail || '',
      personaDni: data.person?.documentNumber || data.person?.document_number || data.personaDni || ''
    };
  } catch (error) {
    throw error;
  }
};

export const getMunicipalidadCompleta = async (id) => {
  try {
    const muniResponse = await httpClient.get(`${API_BASE_URL}/${id}`);
    const municipalidadData = muniResponse.data;
    const mappedMuni = mapFromApi(municipalidadData);

    let adminUsername = null;
    try {
      const detailsResponse = await httpClient.get(`${API_BASE_URL}/${id}/details`);
      adminUsername = detailsResponse.data.adminUsername;
    } catch (detailsError) {
    }

    let userData = null;
    const isValidUsername = adminUsername &&
      adminUsername !== 'No asignado' &&
      adminUsername !== 'null' &&
      adminUsername !== 'undefined' &&
      !adminUsername.includes(' ') &&
      adminUsername.trim().length > 0;

    if (isValidUsername) {
      try {
        const found = await userService.getUserByUsername(adminUsername);
        if (Array.isArray(found)) {
          userData = found.find(u => u.username === adminUsername) || found[0];
        } else {
          userData = (found && found.username === adminUsername) ? found : found;
        }
        if (userData && userData.municipalCode && userData.municipalCode !== id) {
          userData = null;
        }
      } catch (userError) {
      }
    }

    if (!userData && mappedMuni.id) {
      try {
        const allUsers = await userService.getAllUsers().catch(() => []);
        const usersForMunicip = Array.isArray(allUsers)
          ? allUsers.filter(u => u.municipalCode === mappedMuni.id || u.municipality_code === mappedMuni.id)
          : [];
        if (usersForMunicip.length > 0) {
          userData = usersForMunicip.find(u =>
            u.roles?.includes('TENANT_ADMIN') ||
            u.roles?.includes('ADMIN') ||
            u.role?.name?.includes('ADMIN')
          ) || usersForMunicip[0];
          if (userData?.username) adminUsername = userData.username;
        }
      } catch (err) {
      }
    }

    let personaData = null;

    if (userData?.person || userData?.persona) {
      personaData = userData.person || userData.persona;
    }

    if (!personaData && (userData?.personId || userData?.person_id)) {
      const pId = userData.personId || userData.person_id;
      try {
        personaData = await personService.getPersonById(pId);
      } catch (svcErr) {
      }
    }

    if (!personaData) {
      const possiblePersona = municipalidadData?.person || municipalidadData?.persona || mappedMuni?.persona || mappedMuni?.person;
      if (possiblePersona) personaData = possiblePersona;
    }

    if (personaData) {
      const normalize = (p) => ({
        id: p.id || p.personId || p.person_id || p.personID,
        firstName: p.firstName || p.first_name || p.firstname || p.nombre || p.first || '',
        lastName: p.lastName || p.last_name || p.lastname || p.apellido || p.last || '',
        documentNumber: p.documentNumber || p.document_number || p.dni || p.document || '',
        email: p.email || p.emailAddress || p.mail || p.personalEmail || '',
        personalEmail: p.personalEmail || p.email || p.emailAddress || p.mail || '',
        personalPhone: p.personalPhone || p.phone || p.telefono || p.mobile || p.phoneNumber || '',
        cargo: p.cargo || p.position || p.jobTitle || '',
        gender: p.gender || p.genero || p.sex || 'M',
        birthDate: p.birthDate || p.birth_date || p.fechaNacimiento || p.fecha_nacimiento || '1990-01-01',
        documentTypeId: p.documentTypeId || p.document_type_id || p.tipoDocumento || p.document_type || 1,
        address: p.address || p.direccion || p.addressLine || '',
        personType: p.personType || p.tipoPersona || p.person_type || 'N'
      });
      personaData = normalize(personaData);
    }

    if (!personaData && mappedMuni.id) {
      try {
        const parsed = await personService.request(`/persons?municipality_code=${encodeURIComponent(mappedMuni.id)}`).catch(() => null);
        let candidate = null;
        if (Array.isArray(parsed)) {
          candidate = parsed.find(p => p.municipalCode === mappedMuni.id || p.municipality_code === mappedMuni.id);
        } else if (parsed && (parsed.municipalCode === mappedMuni.id || parsed.municipality_code === mappedMuni.id)) {
          candidate = parsed;
        }
        if (candidate) {
          const normalize = (p) => ({
            id: p.id || p.personId || p.person_id || p.personID,
            firstName: p.firstName || p.first_name || p.firstname || p.nombre || '',
            lastName: p.lastName || p.last_name || p.lastname || p.apellido || '',
            documentNumber: p.documentNumber || p.document_number || p.dni || p.document || '',
            email: p.email || p.emailAddress || p.mail || p.personalEmail || '',
            personalEmail: p.personalEmail || p.email || p.emailAddress || p.mail || '',
            personalPhone: p.personalPhone || p.phone || p.telefono || p.mobile || p.phoneNumber || '',
            cargo: p.cargo || p.position || p.jobTitle || '',
            gender: p.gender || p.genero || p.sex || 'M',
            birthDate: p.birthDate || p.birth_date || p.fechaNacimiento || '1990-01-01',
            documentTypeId: p.documentTypeId || p.document_type_id || p.tipoDocumento || 1,
            address: p.address || p.direccion || p.addressLine || '',
            personType: p.personType || p.tipoPersona || p.person_type || 'N'
          });
          personaData = normalize(candidate);
        }
      } catch (err) {
      }
    }

    if (!personaData && userData) {
      const firstName = userData?.firstName
        || userData?.first_name
        || userData?.firstname
        || userData?.nombre
        || userData?.first
        || userData?.authorityName?.split(' ')[0]
        || '';

      const lastName = userData?.lastName
        || userData?.last_name
        || userData?.lastname
        || userData?.apellido
        || userData?.last
        || userData?.authorityName?.split(' ').slice(1).join(' ')
        || '';

      personaData = {
        id: userData?.id || userData?.userId || userData?.user_id || '',
        firstName: firstName,
        lastName: lastName,
        documentNumber: userData?.documentNumber || userData?.document_number || userData?.documentId || userData?.doc_id || '',
        email: userData?.email || userData?.emailAddress || userData?.mail || userData?.personalEmail || '',
        personalPhone: userData?.personalPhone || userData?.phone || userData?.phoneNumber || userData?.telephone || userData?.telefono || '',
        cargo: userData?.cargo || userData?.position || userData?.jobTitle || userData?.job_title || '',
        gender: userData?.gender || userData?.genero || userData?.sex || 'M',
        birthDate: userData?.birthDate || userData?.birth_date || userData?.fechaNacimiento || userData?.fecha_nacimiento || '1990-01-01',
        documentTypeId: userData?.documentTypeId || userData?.document_type_id || userData?.tipoDocumento || 1,
        address: userData?.address || userData?.direccion || userData?.addressLine || userData?.address_line || '',
        personType: userData?.personType || userData?.tipoPersona || userData?.person_type || 'N'
      };
    }

    const resultadoFinal = {
      ...mappedMuni,
      id: mappedMuni.id,
      nombre: mappedMuni.nombre || mappedMuni.name,
      ruc: mappedMuni.ruc,
      ubigeo: mappedMuni.ubigeo || mappedMuni.ubigeoCode,
      tipo: mappedMuni.tipo || mappedMuni.municipalityType,
      departamento: mappedMuni.departamento || mappedMuni.department,
      provincia: mappedMuni.provincia,
      distrito: mappedMuni.distrito || mappedMuni.district,
      direccion: mappedMuni.direccion || mappedMuni.address,
      telefono: mappedMuni.telefono || mappedMuni.phoneNumber,
      celular: mappedMuni.celular || mappedMuni.mobileNumber,
      email: mappedMuni.email,
      website: mappedMuni.website,
      alcalde: mappedMuni.alcalde || mappedMuni.mayorName,
      activo: mappedMuni.activo !== undefined ? mappedMuni.activo : mappedMuni.isActive,
      personaNombres: personaData?.firstName || userData?.firstName || userData?.first_name || '',
      personaApellidos: personaData?.lastName || userData?.lastName || userData?.last_name || '',
      personaDni: personaData?.documentNumber || userData?.documentNumber || userData?.document_number || '',
      personaEmail: personaData?.email || personaData?.personalEmail || userData?.email || userData?.personalEmail || userData?.emailAddress || userData?.mail || '',
      personaTelefono: personaData?.personalPhone || userData?.personalPhone || userData?.phone || userData?.phoneNumber || '',
      personaCargo: personaData?.cargo || userData?.cargo || userData?.position || '',
      personaGenero: personaData?.gender || userData?.gender || 'M',
      personaFechaNacimiento: personaData?.birthDate || userData?.birthDate || userData?.birth_date || '1990-01-01',
      personaTipoDocumento: (personaData?.documentTypeId || userData?.documentTypeId || '1')?.toString() || '1',
      personaDireccion: personaData?.address || userData?.address || userData?.direccion || '',
      personaTipoPersona: personaData?.personType || userData?.personType || 'N',
      adminUsername: userData?.username || adminUsername || '',
      userName: userData?.username || adminUsername || '',
      adminPassword: '',
      adminRole: userData?.roles?.[0] || 'TENANT_ADMIN'
    };

    return resultadoFinal;
  } catch (error) {
    throw error;
  }
};

export const createMunicipalidad = async (data) => {
  try {
    if (!data || !data.adminUsername || !data.adminPassword) {
      throw new Error('Datos incompletos para crear municipalidad');
    }

    const payload = mapToApi(data) || {};
    if (data.logoUrl) {
      sessionStorage.setItem('muniLogo', data.logoUrl);
      sessionStorage.removeItem('muniLogoDataUrl');
    }
    if (!payload.municipalityType || String(payload.municipalityType).trim() === '') {
      throw new Error('El tipo de municipalidad no es válido. Seleccione un tipo antes de continuar.');
    }

    const municipalidadResponse = await httpClient.post(API_BASE_URL, payload);
    const municipalidadCreada = municipalidadResponse.data;
    const municipalityId = municipalidadCreada.id || municipalidadCreada.municipalityId;

    let personaCreada = null;
    let personaId = null;
    try {
      personaCreada = await ensurePerson(data, municipalityId);
      personaId = personaCreada?.id || personaCreada?.personId || personaCreada?.person_id || null;
    } catch (personaError) {
    }

    const GATEWAY_URL = getEnv('VITE_GATEWAY_API_URL');
    const onboardingPayload = {
      adminUsername: data.adminUsername,
      adminPassword: data.adminPassword,
      municipalCode: municipalityId,
      authorityName: `${data.personaNombres} ${data.personaApellidos}`.trim(),
      firstName: data.personaNombres || '',
      lastName: data.personaApellidos || '',
      email: data.personaEmail || data.email,
      ruc: data.ruc
    };

    try {
      await httpClient.post(`${GATEWAY_URL}/users/onboarding`, onboardingPayload);
    } catch (onboardingError) {
    }

    let usuarioFinal = null;
    if (data.adminUsername) {
      try {
        usuarioFinal = await ensureUser(data.adminUsername, data.adminPassword, ['TENANT_ADMIN'], personaId, municipalityId);
      } catch (usuarioError) {
      }
    }

    return {
      municipalidad: municipalidadCreada,
      persona: personaCreada,
      usuario: usuarioFinal,
      ids: {
        municipalityId,
        personaId,
        userId: usuarioFinal?.id || usuarioFinal?.userId || usuarioFinal?.user_id || null
      }
    };
  } catch (error) {
    throw error;
  }
};

export const updateMunicipalidad = async (id, data, fullData = null) => {
  if (!id) throw new Error('ID de municipalidad no válido');

  const payload = Object.entries(data).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});

  if (payload.logoUrl) {
    sessionStorage.setItem('muniLogo', payload.logoUrl);
    sessionStorage.removeItem('muniLogoDataUrl');
  }

  const municipalidadResponse = await httpClient.put(`${API_BASE_URL}/${id}`, {
    municipality: mapToApi(payload)
  });
  const municipalidadActualizada = municipalidadResponse.data;

  let personaActualizada = null;
  let personaId = null;
  const personaMunicipalidades = payload.personaMunicipalidades || payload.personaMunicipalidadesIds || null;
  const personaMunicipalCode = determineMunicipalCode(personaMunicipalidades, id);
  const finalMuniCode = personaMunicipalCode || id;
  const personUpdateData = fullData ? { ...fullData, ...payload } : payload;

  personaActualizada = await ensurePerson(personUpdateData, finalMuniCode);
  personaId = personaActualizada?.id || personaActualizada?.personId || personaActualizada?.personaId || null;

  let usuarioActualizado = null;
  if (payload.adminUsername) {
    try {
      const userMunicipalCode = personaMunicipalCode || id;
      usuarioActualizado = await ensureUser(payload.adminUsername, payload.adminPassword, [payload.adminRole || 'TENANT_ADMIN'], personaId, userMunicipalCode);
    } catch (usuarioError) {
    }
  }

  return {
    municipalidad: municipalidadActualizada,
    persona: personaActualizada,
    usuario: usuarioActualizado,
    ids: {
      municipalityId: id,
      personaId,
      userId: usuarioActualizado?.id || usuarioActualizado?.userId
    }
  };
};

export const deleteMunicipalidad = async (id) => {
  await httpClient.delete(`${API_BASE_URL}/${id}`);
};

export const getMunicipalidadesByEstado = async (activo) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/estado/${activo}`);
  const list = Array.isArray(data) ? data : (data.data || []);
  return { data: list.map(mapFromApi) };
};

export const getMunicipalidadByRuc = async (ruc) => {
  const { data } = await httpClient.get(`${API_BASE_URL}/ruc/${ruc}`);
  return mapFromApi(data);
};

export const validateRuc = async (ruc, excludeId = null) => {
  const params = excludeId ? { excludeId } : {};
  const { data } = await httpClient.get(`${API_BASE_URL}/validate/tax-id/${ruc}`, { params });
  return data;
};

export const validateUbigeo = async (ubigeo, excludeId = null) => {
  const params = excludeId ? { excludeId } : {};
  const { data } = await httpClient.get(`${API_BASE_URL}/validate/ubigeo-code/${ubigeo}`, { params });
  return data;
};

export const uploadLogo = async (file) => {
  const result = await uploadFile(file);
  return result.url;
};

export const getMunicipalityLogoUrl = async (municipalityId) => {
  const cached = sessionStorage.getItem('muniLogo');
  const id = municipalityId || getMunicipalityId();
  if (id) {
    try {
      const muni = await getMunicipalidadById(id);
      if (muni?.logoUrl) {
        const previous = sessionStorage.getItem('muniLogo');
        if (previous !== muni.logoUrl) {
          sessionStorage.removeItem('muniLogoDataUrl');
        }
        sessionStorage.setItem('muniLogo', muni.logoUrl);
        return muni.logoUrl;
      }
    } catch {
    }
  }
  return cached || null;
};

const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const fetchLogoAsDataUrl = async (url) => {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const response = await fetch(url);
    if (response.ok) return await blobToDataUrl(await response.blob());
  } catch {
  }
  return null;
};

export const getMunicipalityLogoForReport = async (municipalityId) => {
  const cachedDataUrl = sessionStorage.getItem('muniLogoDataUrl');
  if (cachedDataUrl?.startsWith('data:')) return cachedDataUrl;
  const url = await getMunicipalityLogoUrl(municipalityId);
  let dataUrl = await fetchLogoAsDataUrl(url);
  if (!dataUrl) dataUrl = await fetchLogoAsDataUrl(LOGO_URL);
  if (dataUrl) sessionStorage.setItem('muniLogoDataUrl', dataUrl);
  return dataUrl;
};
