import { useMemo } from 'react';
import {
  UserCircleIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import authService from '../../../../ms-02-authentication/services/auth.service';
import {
  buildPersonsById,
  buildPositionsById,
  buildUserOptionLabel,
  getRequestingUserFilterAreaId,
  getRequestingUserAreaPendingMessage,
  getRequestingUsersForArea,
  getUserAccountId,
  getUsersWithPerson,
  requestingUserUsesAreaFilter,
} from '../../../utils/movementUserAreaUtils';
import { SectionTitle, FieldLabel, BRAND, ACCENT_DEST } from './formTabUi';

const fieldClass = (hasError, disabled = false) =>
  `w-full px-4 py-3 border rounded-lg text-gray-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#283447]/15 focus:border-[#283447] ${
    disabled
      ? 'bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200'
      : hasError
        ? 'border-red-400 bg-red-50/40'
        : 'border-gray-200 bg-white hover:border-gray-300'
  }`;

const textareaClass = (hasError) =>
  `w-full px-4 py-3 border rounded-lg text-gray-800 transition-all resize-none focus:outline-none focus:ring-2 focus:ring-[#283447]/15 focus:border-[#283447] ${
    hasError ? 'border-red-400 bg-red-50/40' : 'border-gray-200 bg-white hover:border-gray-300'
  }`;

function UserPanel({ title, icon: Icon, accent, children }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200/80 overflow-hidden shadow-sm">
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-100"
        style={{ backgroundColor: `${accent}08` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent, color: '#fff' }}
        >
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function TextAreaField({ name, value, onChange, label, icon: Icon, required, error, placeholder, maxLength }) {
  return (
    <div>
      <FieldLabel icon={Icon} required={required}>{label}</FieldLabel>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        maxLength={maxLength}
        className={textareaClass(error)}
        placeholder={placeholder}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function MovementFormUsersTab({
  formData,
  errors,
  loadingData,
  users = [],
  persons = [],
  positions = [],
  movement,
  handleChange,
}) {
  const personsById = useMemo(() => buildPersonsById(persons), [persons]);
  const positionsById = useMemo(() => buildPositionsById(positions), [positions]);

  const filterAreaId = useMemo(
    () =>
      getRequestingUserFilterAreaId(
        formData.movementType,
        formData.originAreaId,
        formData.destinationAreaId
      ),
    [formData.movementType, formData.originAreaId, formData.destinationAreaId]
  );

  const usesAreaFilter = requestingUserUsesAreaFilter(formData.movementType);
  const requestingPendingMessage = getRequestingUserAreaPendingMessage(formData.movementType);

  const requestingUserOptions = useMemo(
    () =>
      getRequestingUsersForArea(
        users,
        formData.movementType,
        formData.originAreaId,
        formData.destinationAreaId
      ),
    [users, formData.movementType, formData.originAreaId, formData.destinationAreaId]
  );

  const requestingSelectDisabled = usesAreaFilter && !filterAreaId;
  const executingUserOptions = useMemo(() => getUsersWithPerson(users), [users]);

  const executingUserId = formData.executingUser || authService.getCurrentUser()?.userId || authService.getCurrentUser()?.id || '';

  const executingUserLabel = useMemo(() => {
    if (!executingUserId) return 'Usuario en sesión';
    const matched = executingUserOptions.find(
      (user) => String(getUserAccountId(user)) === String(executingUserId)
    );
    if (matched) return buildUserOptionLabel(matched, personsById, positionsById);
    const authUser = authService.getCurrentUser();
    return authUser?.nombre || authUser?.username || 'Usuario en sesión';
  }, [executingUserId, executingUserOptions, personsById, positionsById]);

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gray-50/70 ring-1 ring-gray-200/80 p-5">
        <SectionTitle>Usuarios del movimiento</SectionTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <UserPanel title="Solicitante" icon={UserCircleIcon} accent={BRAND}>
            <FieldLabel icon={UserIcon} required>Usuario</FieldLabel>
            <select
              key={`requesting-${formData.movementType}-${filterAreaId || 'sin-area'}`}
              name="requestingUser"
              value={formData.requestingUser}
              onChange={handleChange}
              disabled={requestingSelectDisabled}
              className={fieldClass(errors.requestingUser, requestingSelectDisabled)}
            >
              <option value="">Seleccionar usuario</option>
              {loadingData ? (
                <option disabled>Cargando...</option>
              ) : requestingSelectDisabled ? (
                <option disabled>{requestingPendingMessage}</option>
              ) : requestingUserOptions.length === 0 ? (
                <option disabled>No hay usuarios asignados a esta área</option>
              ) : (
                requestingUserOptions.map((user) => {
                  const id = getUserAccountId(user);
                  if (!id) return null;
                  return (
                    <option key={id} value={id}>
                      {buildUserOptionLabel(user, personsById, positionsById)}
                    </option>
                  );
                })
              )}
            </select>
            {errors.requestingUser && (
              <p className="mt-1.5 text-sm text-red-600">{errors.requestingUser}</p>
            )}
          </UserPanel>

          <UserPanel title="Ejecutor" icon={UserCircleIcon} accent={ACCENT_DEST}>
            <FieldLabel icon={UserIcon}>Usuario</FieldLabel>
            <select
              name="executingUser"
              value={executingUserId}
              disabled
              className={fieldClass(false, true)}
            >
              <option value={executingUserId || ''}>
                {loadingData && !executingUserId ? 'Cargando...' : executingUserLabel}
              </option>
            </select>
            {!movement && (
              <p className="mt-1.5 text-xs text-gray-500">
                Asignado automáticamente al usuario en sesión.
              </p>
            )}
          </UserPanel>
        </div>
      </div>

      <div className="rounded-xl bg-gray-50/70 ring-1 ring-gray-200/80 p-5">
        <SectionTitle accent={ACCENT_DEST}>Información adicional</SectionTitle>
        <div className="rounded-xl bg-white ring-1 ring-gray-200/80 p-5 space-y-5 shadow-sm">
          <TextAreaField
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            label="Motivo"
            icon={ChatBubbleLeftRightIcon}
            required
            error={errors.reason}
            placeholder="Describa el motivo del movimiento (mínimo 10 caracteres)"
            maxLength={500}
          />
          <TextAreaField
            name="observations"
            value={formData.observations}
            onChange={handleChange}
            label="Observaciones"
            icon={ClipboardDocumentListIcon}
            error={errors.observations}
            placeholder="Observaciones adicionales (opcional)"
            maxLength={1000}
          />
          <TextAreaField
            name="specialConditions"
            value={formData.specialConditions}
            onChange={handleChange}
            label="Condiciones especiales"
            icon={DocumentTextIcon}
            error={errors.specialConditions}
            placeholder="Condiciones especiales del movimiento (opcional)"
            maxLength={500}
          />
        </div>
      </div>
    </div>
  );
}
