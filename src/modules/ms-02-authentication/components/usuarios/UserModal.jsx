import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import areaService from "../../services/areaService";
import personService from "../../services/personService";
import positionService from "../../services/positionService";
import userService from "../../services/userService";
import assignmentService from "../../services/assignmentService";
import { useAuth } from "../../hooks/useAuth";

export default function UserModal({
  isOpen,
  onClose,
  onSuccess,
  user = null,
  users = [],
}) {
  const { user: currentUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    personId: "",
    areaId: "",
    positionId: "",
    directManagerId: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [persons, setPersons] = useState([]);
  const [loadingPersons, setLoadingPersons] = useState(false);
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPersons();
      loadPositions();
      loadAreas();
    }

  }, [isOpen]);

  const loadPersons = async () => {
    try {
      setLoadingPersons(true);
      const data = await personService.getAllPersons();
      setPersons(Array.isArray(data) ? data : []);
    } catch {
      setPersons([]);
    } finally {
      setLoadingPersons(false);
    }
  };

  const loadPositions = async () => {
    try {
      setLoadingPositions(true);
      const data = await positionService.getActivePositions();
      setPositions(data);
    } catch {
      setPositions([]);
    } finally {
      setLoadingPositions(false);
    }
  };

  const loadAreas = async () => {
    try {
      setLoadingAreas(true);
      const data = await areaService.getActiveAreas();
      setAreas(data);
    } catch {
      setAreas([]);
    } finally {
      setLoadingAreas(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (user && user.id) {
          setFormData({
            username: user.username || "",
            password: "",
            personId: user.personId || "",
            areaId: user.areaId || "",
            positionId: user.positionId || "",
            directManagerId: user.directManagerId || "",
          });
          setConfirmPassword("");
        } else {
          setFormData({
            username: "",
            password: "",
            personId: "",
            areaId: "",
            positionId: "",
            directManagerId: "",
          });
          setConfirmPassword("");
        }
        setError(null);
      }, 50);
    }
  }, [user, isOpen]);

  const [validationErrors, setValidationErrors] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    personId: "",
    directManagerId: ""
  });

  const validateUsername = (value) => {
    if (!value.trim()) {
      return "El username es obligatorio";
    }
    if (!/^[a-zA-Z]+$/.test(value)) {
      return "Solo se permiten letras, sin espacios ni números";
    }
    return "";
  };

  const validatePassword = (value) => {
    if (!user && !value.trim()) {
      return "La contraseña es obligatoria para usuarios nuevos";
    }
    if (value && /\s/.test(value)) {
      return "La contraseña no puede contener espacios";
    }
    if (value) {
      if (value.length < 8 || value.length > 100) {
        return "La contraseña debe tener entre 8 y 100 caracteres";
      }

      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      // Actualizado para permitir caracteres especiales
      if (!(hasUpper && hasLower && hasNumber)) {
        return "La contraseña debe tener al menos una mayúscula, una minúscula y un número";
      }
    }
    return "";
  };

  const getPasswordRules = (value) => {
    const v = value || "";
    return {
      length: v.length >= 8 && v.length <= 100,
      upper: /[A-Z]/.test(v),
      lower: /[a-z]/.test(v),
      number: /[0-9]/.test(v),
      special: /[@#$%^&+=!_/*-]/.test(v),
      noSpaces: v ? !/\s/.test(v) : true,
    };
  };

  const getPasswordStrength = (value) => {
    if (!value) return 0;
    const rules = getPasswordRules(value);
    let score = 0;
    if (rules.length) score += 20;
    if (rules.upper) score += 20;
    if (rules.lower) score += 20;
    if (rules.number) score += 20;
    if (rules.special) score += 20;
    if (!rules.noSpaces) score = 0;
    return score;
  };

  const getStrengthLabel = (score) => {
    if (score === 0) return { label: "Muy Débil", color: "bg-red-500", text: "text-red-500" };
    if (score <= 40) return { label: "Débil", color: "bg-orange-500", text: "text-orange-500" };
    if (score <= 60) return { label: "Media", color: "bg-yellow-500", text: "text-yellow-500" };
    if (score <= 80) return { label: "Segura", color: "bg-green-500", text: "text-green-500" };
    return { label: "Muy Segura", color: "bg-emerald-600", text: "text-emerald-600" };
  };

  const PasswordRuleItem = ({ ok, text }) => (
    <div className={`flex items-center gap-2 text-xs ${ok ? "text-green-700" : "text-slate-500"}`}>
      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full ${ok ? "bg-green-100" : "bg-slate-100"}`}>
        {ok ? (
          <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        )}
      </span>
      <span>{text}</span>
    </div>
  );

  const validateConfirmPassword = (password, confirm) => {
    if (password && confirm && password !== confirm) {
      return "Las contraseñas no coinciden";
    }
    return "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    let error = "";
    if (name === "username") {
      error = validateUsername(value);
    } else if (name === "password") {
      error = validatePassword(value);

      if (confirmPassword) {
        const confirmError = validateConfirmPassword(value, confirmPassword);
        setValidationErrors(prev => ({ ...prev, confirmPassword: confirmError }));
      }
    } else if (name === "personId") {
      error = value.trim() ? "" : "Debe seleccionar una persona";
    } else if (name === "directManagerId") {
      error = value.trim() ? "" : "Debe seleccionar un jefe directo";
    }

    setValidationErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    const error = validateConfirmPassword(formData.password, value);
    setValidationErrors(prev => ({ ...prev, confirmPassword: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const errors = {
      username: validateUsername(formData.username),
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.password, confirmPassword),
      personId: formData.personId?.trim() ? "" : "Debe seleccionar una persona",
      directManagerId: formData.directManagerId?.trim() ? "" : "Debe seleccionar un jefe directo"
    };

    setValidationErrors(errors);

    if (Object.values(errors).some(error => error !== "")) {
      setLoading(false);
      return;
    }

    const isValidUUID = (uuid) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(uuid);
    };

    if (!isValidUUID(formData.personId)) {
      Swal.fire({
        title: "Error de Validación",
        text: "El ID de persona no es válido",
        icon: "error",
      });
      setLoading(false);
      return;
    }

    try {
      if (user) {


        const payload = {
          id: user.id,
          username: formData.username?.trim(),
          personId: formData.personId?.trim(),
          directManagerId:
            formData.directManagerId?.trim() && formData.directManagerId !== user.id
              ? formData.directManagerId.trim()
              : user.directManagerId || null,
          status: user.status || "ACTIVE",

          municipalCode:
            user.municipalCode ||
            currentUserProfile?.municipalCode ||
            sessionStorage.getItem("municipalCode"),
          ...(user.version !== undefined && user.version !== null ? { version: user.version } : {}),
        };

        if (formData.areaId === "") payload.areaId = null;
        else if (formData.areaId?.trim()) payload.areaId = formData.areaId.trim();

        if (formData.positionId === "") payload.positionId = null;
        else if (formData.positionId?.trim()) payload.positionId = formData.positionId.trim();

        if (formData.password?.trim()) {
          payload.password = formData.password.trim();
        }
        await userService.updateUser(user.id, payload, currentUserProfile?.userId);

        Swal.fire({
          title: "Actualizado",
          text: "El usuario ha sido actualizado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        const createData = {
          username: formData.username?.trim(),
          password: formData.password?.trim(),
          personId: formData.personId?.trim(),
          status: "ACTIVE",
          preferences: {},
          requiresPasswordReset: false,
          // municipalCode: el backend lo extrae del JWT automáticamente
          createdBy: currentUserProfile?.userId || JSON.parse(sessionStorage.getItem('user'))?.userId || 'system'
        };

        if (formData.areaId && formData.areaId.trim() !== "") {
          createData.areaId = formData.areaId.trim();
        }

        if (formData.positionId && formData.positionId.trim() !== "") {
          createData.positionId = formData.positionId.trim();
        }

        if (formData.directManagerId && formData.directManagerId.trim() !== "") {
          createData.directManagerId = formData.directManagerId.trim();
        }

        const newUser = await userService.createUser(createData);

        Swal.fire({
          title: "Creado",
          text: "El usuario ha sido creado correctamente",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
      }

      onSuccess();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Error al guardar el usuario",
        icon: "error",
      });

      setError(err.message || "Error al guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col border border-gray-100 animate-fadeInScale">
        {}
        <div className="px-8 py-6 border-b border-cyan-100 flex-shrink-0 flex justify-between items-center bg-cyan-600 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-inner text-white">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {user ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <p className="text-cyan-100 text-sm mt-1">
                {user ? 'Actualiza la información del usuario' : 'Completa los datos para crear un nuevo usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {}
        <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-white" style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}>
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-cyan-500 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </span>
                Credenciales de Acceso
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    placeholder="Ej: jperez"
                    className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm ${validationErrors.username
                      ? "bg-red-50 focus:ring-red-500/20"
                      : formData.username?.trim()
                        ? "bg-green-50 focus:ring-green-500/20"
                        : "bg-gray-50 focus:ring-cyan-500/20"
                      }`}
                  />
                  {validationErrors.username && (
                    <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {validationErrors.username}
                      </p>
                    </div>
                  )}
                  {!validationErrors.username && formData.username?.trim() && (
                    <div className="mt-2 px-4 py-2 bg-green-50 border-l-4 border-l-green-500 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Username válido
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Persona <span className="text-red-500">*</span>
                  </label>
                  {loadingPersons ? (
                    <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-600 border-t-transparent"></div>
                      <span className="text-sm font-medium text-gray-600">Cargando personas...</span>
                    </div>
                  ) : persons.length === 0 ? (
                    <div className="w-full px-4 py-3 bg-red-50 border-l-4 border-l-red-500 rounded-xl">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        No se pudieron cargar las personas
                      </p>
                      <p className="text-xs text-red-600 mt-1 ml-6">Verifica que el servicio esté activo</p>
                    </div>
                  ) : (
                    <>
                      <select
                        name="personId"
                        value={formData.personId}
                        onChange={handleChange}
                        required
                        className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm appearance-none cursor-pointer ${validationErrors.personId
                          ? "bg-red-50 focus:ring-red-500/20"
                          : formData.personId?.trim()
                            ? "bg-green-50 focus:ring-green-500/20"
                            : "bg-gray-50 focus:ring-cyan-500/20"
                          }`}
                      >
                        <option value="">Seleccione una persona</option>
                        {persons.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}{person.documentNumber ? ` - ${person.documentNumber}` : ''}
                          </option>
                        ))}
                      </select>
                      {validationErrors.personId && (
                        <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                          <p className="text-sm text-red-700 flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {validationErrors.personId}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Contraseña {!user && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!user}
                      minLength={user ? undefined : 8}
                      maxLength={100}
                      placeholder={user ? "Dejar vacío para no cambiar" : "Ingrese contraseña"}
                      className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm pr-10 ${validationErrors.password
                        ? "bg-red-50 focus:ring-red-500/20"
                        : formData.password?.trim()
                          ? "bg-green-50 focus:ring-green-500/20"
                          : "bg-gray-50 focus:ring-cyan-500/20"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {(() => {
                    const rules = getPasswordRules(formData.password);
                    const score = getPasswordStrength(formData.password);
                    const strength = getStrengthLabel(score);
                    const showContent = (!user && true) || (user && !!formData.password?.trim());
                    if (!showContent) return null;

                    return (
                      <div className="mt-3 space-y-3">
                        {}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-gray-500">Seguridad de contraseña</span>
                            <span className={strength.text}>{strength.label}</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${strength.color}`}
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>

                        {}
                        <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 backdrop-blur-sm">
                          <div className="text-xs font-semibold text-slate-700 mb-2">
                            Requisitos de contraseña
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                            <PasswordRuleItem ok={rules.length} text="8–100 caracteres" />
                            <PasswordRuleItem ok={rules.noSpaces} text="Sin espacios" />
                            <PasswordRuleItem ok={rules.upper} text="1 mayúscula" />
                            <PasswordRuleItem ok={rules.lower} text="1 minúscula" />
                            <PasswordRuleItem ok={rules.number} text="1 número" />
                            <PasswordRuleItem ok={rules.special} text="1 símbolo (@/.*-_)" />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  {validationErrors.password && (
                    <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg shadow-sm">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {validationErrors.password}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Confirmar Contraseña {!user && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                      required={!user}
                      placeholder={user ? "Confirmar nueva contraseña" : "Confirmar contraseña"}
                      className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm pr-10 ${validationErrors.confirmPassword
                        ? "bg-red-50 focus:ring-red-500/20"
                        : confirmPassword && formData.password === confirmPassword
                          ? "bg-green-50 focus:ring-green-500/20"
                          : "bg-gray-50 focus:ring-cyan-500/20"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {validationErrors.confirmPassword}
                      </p>
                    </div>
                  )}
                  {!validationErrors.confirmPassword && confirmPassword && formData.password === confirmPassword && (
                    <div className="mt-2 px-4 py-2 bg-green-50 border-l-4 border-l-green-500 rounded-lg">
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Las contraseñas coinciden
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-2xl p-6 border-l-4 border-l-cyan-500 border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                Información Organizacional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Área
                  </label>
                  {loadingAreas ? (
                    <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-600 border-t-transparent"></div>
                      <span className="text-sm font-medium text-gray-600">Cargando áreas...</span>
                    </div>
                  ) : areas.length === 0 ? (
                    <div className="w-full px-4 py-3 bg-red-50 border-l-4 border-l-red-500 rounded-xl">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        No se pudieron cargar las áreas
                      </p>
                      <p className="text-xs text-red-600 mt-1 ml-6">Verifica que el servicio MS-03 esté activo</p>
                    </div>
                  ) : (
                    <select
                      name="areaId"
                      value={formData.areaId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm appearance-none"
                    >
                      <option value="">Sin área asignada</option>
                      {areas.map((area) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Cargo/Posición
                  </label>
                  {loadingPositions ? (
                    <div className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-cyan-600 border-t-transparent"></div>
                      <span className="text-sm font-medium text-gray-600">Cargando posiciones...</span>
                    </div>
                  ) : positions.length === 0 ? (
                    <div className="w-full px-4 py-3 bg-red-50 border-l-4 border-l-red-500 rounded-xl">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        No se pudieron cargar las posiciones
                      </p>
                      <p className="text-xs text-red-600 mt-1 ml-6">Verifica que el servicio MS-03 esté activo</p>
                    </div>
                  ) : (
                    <select
                      name="positionId"
                      value={formData.positionId}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-cyan-500/20 transition-all text-sm appearance-none"
                    >
                      <option value="">Sin cargo asignado</option>
                      {positions.map((position) => (
                        <option key={position.id} value={position.id}>
                          {position.name} - {position.description}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 pl-1">
                    Jefe Directo <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="directManagerId"
                    value={formData.directManagerId}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-3 border-none rounded-xl text-slate-900 focus:ring-2 transition-all text-sm appearance-none ${validationErrors.directManagerId
                      ? "bg-red-50 focus:ring-red-500/20"
                      : formData.directManagerId?.trim()
                        ? "bg-green-50 focus:ring-green-500/20"
                        : "bg-gray-50 focus:ring-cyan-500/20"
                      }`}
                  >
                    <option value="">Seleccione un jefe directo</option>
                    {users.map((u) => {
                      const person = persons.find(p => p.id === u.personId);
                      const displayName = person
                        ? `${person.firstName} ${person.lastName}`
                        : u.username;
                      return (
                        <option key={u.id} value={u.id}>
                          {displayName} ({u.username})
                        </option>
                      );
                    })}
                  </select>
                  {validationErrors.directManagerId && (
                    <div className="mt-2 px-4 py-2 bg-red-50 border-l-4 border-l-red-500 rounded-lg">
                      <p className="text-sm text-red-700 flex items-center gap-2">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {validationErrors.directManagerId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>

        {}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex-shrink-0 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 font-semibold transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-600/20"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {user ? "Actualizar Usuario" : "Crear Usuario"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

