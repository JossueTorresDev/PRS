import { useEffect, useMemo } from 'react';
import {
  UserIcon,
  BuildingOffice2Icon,
  MapPinIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { MovementType } from '../../../types/movementTypes';
import {
  buildPersonsById,
  buildPositionsById,
  buildUserOptionLabel,
  getAssignableUsersForArea,
  getUserSelectId,
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

function UserResponsibleSelect({
  name,
  value,
  onChange,
  label,
  required,
  loadingData,
  users,
  selectedAreaId,
  personsById,
  positionsById,
  error,
}) {
  const assignableUsers = useMemo(
    () => getAssignableUsersForArea(users, selectedAreaId),
    [users, selectedAreaId]
  );
  const disabled = !selectedAreaId;

  return (
    <div>
      <FieldLabel icon={UserIcon} required={required}>{label}</FieldLabel>
      <select
        key={`${name}-${selectedAreaId || 'sin-area'}`}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={fieldClass(error, disabled)}
      >
        <option value="">Seleccionar responsable</option>
        {loadingData ? (
          <option disabled>Cargando...</option>
        ) : disabled ? (
          <option disabled>Seleccione primero el área</option>
        ) : assignableUsers.length === 0 ? (
          <option disabled>No hay usuarios asignados a esta área</option>
        ) : (
          assignableUsers.map((user) => {
            const id = getUserSelectId(user);
            if (!id) return null;
            return (
              <option key={id} value={id}>
                {buildUserOptionLabel(user, personsById, positionsById)}
              </option>
            );
          })
        )}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function LocationSelect({ name, value, onChange, label, required, items, codeKey, nameKey, error }) {
  const isArea = name.includes('Area') || name.includes('area');
  return (
    <div>
      <FieldLabel icon={isArea ? BuildingOffice2Icon : MapPinIcon} required={required}>
        {label}
      </FieldLabel>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className={fieldClass(error)}
      >
        <option value="">Seleccionar</option>
        {items.length === 0 ? (
          <option disabled>No hay opciones disponibles</option>
        ) : (
          items.map((item) => (
            <option key={item.id} value={item.id}>
              {item[codeKey] ? `${item[codeKey]} - ` : ''}
              {item[nameKey]}
            </option>
          ))
        )}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function OriginDestinationPanel({ title, icon: Icon, accent, children }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-gray-200/80 overflow-hidden shadow-sm">
      <div
        className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100"
        style={{ backgroundColor: `${accent}08` }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: accent, color: '#fff' }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

export default function MovementFormOriginDestinationTab({
  formData,
  errors,
  loadingData,
  users = [],
  persons = [],
  positions = [],
  areas,
  locations,
  isFirstAssignment,
  handleChange,
}) {
  const isInitial = formData.movementType === MovementType.INITIAL_ASSIGNMENT;
  const isReturn = formData.movementType === MovementType.RETURN;
  const isTransfer =
    formData.movementType === MovementType.REASSIGNMENT ||
    formData.movementType === MovementType.AREA_TRANSFER;
  const requiresOrigin = isInitial || isReturn || isTransfer;
  const requiresDestination = isInitial || isReturn || isTransfer;
  const requiresAreas = isTransfer;
  const areasConflict = errors.originAreaId?.includes('área de origen');
  const responsiblesConflict = !!errors.destinationResponsibleId;

  const personsById = useMemo(() => buildPersonsById(persons), [persons]);
  const positionsById = useMemo(() => buildPositionsById(positions), [positions]);

  const clearResponsibleIfNotInList = (fieldName, selectedId, areaId) => {
    if (!selectedId || !areaId) return;
    const pool = getAssignableUsersForArea(users, areaId);
    const stillValid = pool.some((u) => String(getUserSelectId(u)) === String(selectedId));
    if (!stillValid) {
      handleChange({ target: { name: fieldName, value: '' } });
    }
  };

  useEffect(() => {
    clearResponsibleIfNotInList(
      'originResponsibleId',
      formData.originResponsibleId,
      formData.originAreaId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.originAreaId, users]);

  useEffect(() => {
    clearResponsibleIfNotInList(
      'destinationResponsibleId',
      formData.destinationResponsibleId,
      formData.destinationAreaId
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.destinationAreaId, users]);

  return (
    <div className="space-y-6">
      {(areasConflict || responsiblesConflict) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-900">Conflicto entre campos relacionados</p>
            {areasConflict && <p className="text-xs text-red-700">{errors.originAreaId}</p>}
            {responsiblesConflict && (
              <p className="text-xs text-red-700">{errors.destinationResponsibleId}</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-xl bg-gray-50/70 ring-1 ring-gray-200/80 p-5">
        <SectionTitle>Responsables y ubicaciones</SectionTitle>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-5 items-start">
          <OriginDestinationPanel title="Origen" icon={ArrowLeftIcon} accent={BRAND}>
            <LocationSelect
              name="originAreaId"
              value={formData.originAreaId}
              onChange={handleChange}
              label="Área"
              required={requiresAreas}
              items={areas}
              codeKey="areaCode"
              nameKey="name"
              error={errors.originAreaId}
            />
            <UserResponsibleSelect
              name="originResponsibleId"
              value={formData.originResponsibleId}
              onChange={handleChange}
              label="Responsable"
              required={requiresOrigin}
              loadingData={loadingData}
              users={users}
              selectedAreaId={formData.originAreaId}
              personsById={personsById}
              positionsById={positionsById}
              error={errors.originResponsibleId}
            />
            <LocationSelect
              name="originLocationId"
              value={formData.originLocationId}
              onChange={handleChange}
              label="Ubicación"
              required
              items={locations}
              codeKey="locationCode"
              nameKey="name"
              error={errors.originLocationId}
            />
          </OriginDestinationPanel>

          <div className="hidden lg:flex flex-col items-center justify-center self-center px-1">
            <div className="w-10 h-10 rounded-full bg-white ring-1 ring-gray-200 flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5" style={{ color: ACCENT_DEST }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          <OriginDestinationPanel title="Destino" icon={ArrowRightIcon} accent={ACCENT_DEST}>
            <LocationSelect
              name="destinationAreaId"
              value={formData.destinationAreaId}
              onChange={handleChange}
              label="Área"
              required={requiresAreas}
              items={areas}
              codeKey="areaCode"
              nameKey="name"
              error={errors.destinationAreaId || (areasConflict ? errors.originAreaId : null)}
            />
            <UserResponsibleSelect
              name="destinationResponsibleId"
              value={formData.destinationResponsibleId}
              onChange={handleChange}
              label="Responsable"
              required={requiresDestination}
              loadingData={loadingData}
              users={users}
              selectedAreaId={formData.destinationAreaId}
              personsById={personsById}
              positionsById={positionsById}
              error={errors.destinationResponsibleId}
            />
            <LocationSelect
              name="destinationLocationId"
              value={formData.destinationLocationId}
              onChange={handleChange}
              label="Ubicación"
              required
              items={locations}
              codeKey="locationCode"
              nameKey="name"
              error={errors.destinationLocationId}
            />
          </OriginDestinationPanel>
        </div>
      </div>
    </div>
  );
}
