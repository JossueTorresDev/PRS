import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import personService from "../../services/personService";
import documentTypeService from "../../services/documentTypeService";
import userService from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import IdentitySection from "../personas/form-sections/IdentitySection";
import PersonalInfoSection from "../personas/form-sections/PersonalInfoSection";
import ContactInfoSection from "../personas/form-sections/ContactInfoSection";

export default function UserProfileModal({ isOpen, onClose, type = "profile" }) {
    const { user, refreshUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [allDocumentTypes, setAllDocumentTypes] = useState([]);
    const [formData, setFormData] = useState({
        documentTypeId: "",
        documentNumber: "",
        personType: "N",
        firstName: "",
        lastName: "",
        birthDate: "",
        gender: "M",
        personalPhone: "",
        workPhone: "",
        personalEmail: "",
        address: "",
        password: "",
        confirmPassword: ""
    });
    const [hasChanges, setHasChanges] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadInitialData();
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (formData.personType && allDocumentTypes.length > 0) {
            filterDocumentTypes(formData.personType);
        }
    }, [formData.personType, allDocumentTypes]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            // 1. Cargar tipos de documento
            const types = await documentTypeService.getActiveDocumentTypes();
            setAllDocumentTypes(types);
            
            // 2. Cargar datos del perfil propio
            const personData = await personService.getPersonMe();
            
            // Formatear fecha para el input date
            let formattedBirthDate = "";
            if (personData.birthDate) {
                try {
                    const dateArr = Array.isArray(personData.birthDate) ? personData.birthDate : null;
                    const dateObj = dateArr ? new Date(dateArr[0], dateArr[1] - 1, dateArr[2]) : new Date(personData.birthDate);
                    if (!isNaN(dateObj.getTime())) formattedBirthDate = dateObj.toISOString().split('T')[0];
                } catch (e) { }
            }

            setFormData({
                ...formData,
                documentTypeId: personData.documentTypeId || "",
                documentNumber: personData.documentNumber || "",
                personType: personData.personType || "N",
                firstName: personData.firstName || "",
                lastName: personData.lastName || "",
                birthDate: formattedBirthDate,
                gender: personData.gender || "M",
                personalPhone: personData.personalPhone || "",
                workPhone: personData.workPhone || "",
                personalEmail: personData.personalEmail || "",
                address: personData.address || ""
            });
            
            filterDocumentTypes(personData.personType || "N", types);
            setHasChanges(false);
        } catch (error) {
            console.error("Error al cargar datos iniciales:", error);
            Swal.fire("Error", "No se pudieron cargar los datos del perfil", "error");
        } finally {
            setLoading(false);
        }
    };

    const filterDocumentTypes = (personType, types = allDocumentTypes) => {
        if (!types?.length) return;
        const filtered = personType === "N" ? types.filter(t => t.code !== "RUC") : types.filter(t => t.code === "RUC");
        setDocumentTypes(filtered);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setHasChanges(true);

        if (["documentNumber", "personalPhone", "workPhone"].includes(name)) {
            const numeric = value.replace(/\D/g, '');
            const selectedType = documentTypes.find(t => t.id === parseInt(formData.documentTypeId));
            if (name === "documentNumber" && selectedType?.length && numeric.length > selectedType.length) return;
            if (name === "personalPhone" && numeric.length > 9) return;
            if (name === "workPhone" && numeric.length > 20) return;
            setFormData(prev => ({ ...prev, [name]: numeric }));
        } else if (["firstName", "lastName"].includes(name)) {
            let cleanValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').replace(/^\s+/, '').replace(/\s{2,}/g, ' ');
            if (cleanValue.length <= 100) setFormData(prev => ({ ...prev, [name]: cleanValue }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (errors[name]) setErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return null;
        const birth = new Date(birthDate);
        const today = new Date();
        if (birth > today) return { age: null, isFuture: true };
        let age = today.getFullYear() - birth.getFullYear();
        if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
        return { age, isFuture: false, isAdult: age >= 18 };
    };

    const validatePassword = (value) => {
        if (type !== "profile" && !value.trim()) {
            return "La contraseña es obligatoria";
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

    const handleConfirmPasswordChange = (value) => {
        setHasChanges(true);
        setFormData(prev => ({ ...prev, confirmPassword: value }));
        const err = validateConfirmPassword(formData.password, value);
        if (err) {
            setErrors(prev => ({ ...prev, confirmPassword: err }));
        } else {
            setErrors(prev => { const n = { ...prev }; delete n.confirmPassword; return n; });
        }
    };

    const validate = () => {
        const n = {};
        if (type === "profile") {
            if (!formData.firstName) n.firstName = "Obligatorio";
            if (!formData.lastName) n.lastName = "Obligatorio";
            if (!formData.documentNumber) n.documentNumber = "Obligatorio";
            else {
                const t = documentTypes.find(x => x.id === parseInt(formData.documentTypeId));
                if (t?.length && formData.documentNumber.length !== t.length) n.documentNumber = `Debe tener ${t.length} dígitos`;
            }
            if (!formData.birthDate) n.birthDate = "Obligatorio";
            else if (!calculateAge(formData.birthDate).isAdult) n.birthDate = "Debe ser mayor de 18 años";
            if (!formData.personalPhone || formData.personalPhone.length !== 9) n.personalPhone = "Debe tener 9 dígitos";
            if (!formData.address) n.address = "Obligatorio";
            // Password validation en perfil solo si se ingresó
            if (formData.password) {
                const pwErr = validatePassword(formData.password);
                if (pwErr) n.password = pwErr;
                const cfErr = validateConfirmPassword(formData.password, formData.confirmPassword);
                if (cfErr) n.confirmPassword = cfErr;
            }
        } else {
            const pwErr = validatePassword(formData.password);
            if (pwErr) n.password = pwErr;
            const cfErr = validateConfirmPassword(formData.password, formData.confirmPassword);
            if (cfErr) n.confirmPassword = cfErr;
        }
        setErrors(n);
        return Object.keys(n).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            setLoading(true);
            if (type === "profile") {
                await personService.patchPersonMe({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    documentNumber: formData.documentNumber,
                    personalEmail: formData.personalEmail,
                    personalPhone: formData.personalPhone,
                    address: formData.address,
                    birthDate: formData.birthDate,
                    gender: formData.gender,
                    workPhone: formData.workPhone
                });

                if (formData.password) {
                    await userService.patchUserCredentials(user.id, {
                        password: formData.password
                    });
                }
                
                Swal.fire({
                    title: "¡Éxito!",
                    text: "Perfil actualizado correctamente",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                await userService.patchUserCredentials(user.id, {
                    password: formData.password
                });

                Swal.fire({
                    title: "¡Éxito!",
                    text: "Contraseña actualizada correctamente",
                    icon: "success",
                    timer: 2000,
                    showConfirmButton: false
                });
            }
            
            await refreshUserData();
            onClose();
        } catch (error) {
            Swal.fire("Error", error.message || "No se pudo actualizar el perfil", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getInitials = () => {
        if (!formData.firstName && !formData.lastName) return "U";
        const first = formData.firstName ? formData.firstName.trim().charAt(0) : "";
        const last = formData.lastName ? formData.lastName.trim().charAt(0) : "";
        return (first + last).toUpperCase();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className={`bg-white rounded-2xl shadow-2xl w-full ${type === "profile" ? "max-w-4xl" : "max-w-md"} overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row max-h-[90vh] md:max-h-[580px]`}>
                
                {/* Left Sidebar */}
                {type === "profile" && (
                    <div className="hidden md:flex w-[200px] shrink-0 bg-gradient-to-b from-slate-800 to-slate-900 p-5 flex-col items-center justify-between">
                        <div className="flex flex-col items-center text-center w-full pt-3">
                            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20 shadow-lg">
                                <span className="text-white font-bold text-2xl">{getInitials()}</span>
                            </div>
                            <h4 className="mt-3 font-semibold text-white text-sm leading-snug truncate max-w-full">
                                {formData.firstName || "Usuario"}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-full">
                                {formData.personalEmail || user?.username || "usuario@sipreb.gob.pe"}
                            </p>
                            <span className="mt-2.5 px-2.5 py-0.5 bg-white/10 border border-white/15 text-[10px] font-medium text-slate-300 rounded-full">
                                {formData.personType === "N" ? "Persona Natural" : "Persona Jurídica"}
                            </span>
                        </div>
                        <div className="text-[10px] text-slate-600 text-center font-medium pb-3">
                            SIPREB
                        </div>
                    </div>
                )}

                {/* Right Panel */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-white shrink-0">
                        <div>
                            <h3 className="text-base font-bold text-slate-800">
                                {type === "profile" ? "Editar Perfil" : "Seguridad de la Cuenta"}
                            </h3>
                            <p className="text-slate-500 text-[11px] mt-0.5">
                                {type === "profile" ? "Mantén tu información personal actualizada" : "Actualiza tu contraseña para proteger tu cuenta"}
                            </p>
                        </div>
                        <button onClick={onClose} className="hover:bg-slate-100 p-1.5 rounded-lg transition-colors">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M18 6L6 18M6 6l12 12"/></svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: "thin" }}>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {type === "profile" ? (
                                <>
                                    <IdentitySection 
                                        formData={formData} setFormData={setFormData} errors={errors} 
                                        documentTypes={documentTypes} handleChange={handleChange} 
                                        calculateAge={calculateAge} person={true}
                                        disabled={true}
                                    />
                                    <PersonalInfoSection 
                                        formData={formData} setFormData={setFormData} errors={errors} 
                                        handleChange={handleChange}
                                        disabled={true}
                                    />
                                    <ContactInfoSection formData={formData} errors={errors} handleChange={handleChange} />
                                    <div className="bg-white rounded-xl p-5 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
                                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5 mb-4">
                                            <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                            </span>
                                            Cambiar Contraseña
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-4">Dejar vacío para mantener la contraseña actual</p>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Nueva Contraseña</label>
                                                <div className="relative">
                                                    <input
                                                        name="password"
                                                        type={showPassword ? "text" : "password"}
                                                        value={formData.password}
                                                        onChange={handleChange}
                                                        className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm pr-10`}
                                                        placeholder="••••••••"
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
                                                    if (!formData.password?.trim()) return null;
                                                    return (
                                                        <div className="mt-3 space-y-3">
                                                            <div className="space-y-1.5">
                                                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                                                    <span className="text-gray-500">Seguridad de contraseña</span>
                                                                    <span className={strength.text}>{strength.label}</span>
                                                                </div>
                                                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                                                                    <div className={`h-full transition-all duration-500 rounded-full ${strength.color}`} style={{ width: `${score}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50">
                                                                <div className="text-xs font-semibold text-slate-700 mb-2">Requisitos de contraseña</div>
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
                                                {errors.password && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.password}</p>}
                                            </div>
                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Confirmar Contraseña</label>
                                                <div className="relative">
                                                    <input
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        value={formData.confirmPassword}
                                                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                                        className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm pr-10`}
                                                        placeholder="••••••••"
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
                                                {errors.confirmPassword && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.confirmPassword}</p>}
                                                {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                                                    <div className="mt-2 px-3 py-2 bg-green-50 border-l-4 border-l-green-500 rounded-lg">
                                                        <p className="text-xs text-green-700 flex items-center gap-2">
                                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            Las contraseñas coinciden
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-white rounded-xl p-5 border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
                                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5 mb-4">
                                        <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                        </span>
                                        Nueva Contraseña
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    name="password"
                                                    type={showPassword ? "text" : "password"}
                                                    value={formData.password}
                                                    onChange={handleChange}
                                                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.password ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm pr-10`}
                                                    placeholder="••••••••"
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
                                                if (!formData.password?.trim()) return null;
                                                return (
                                                    <div className="mt-3 space-y-3">
                                                        <div className="space-y-1.5">
                                                            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                                                                <span className="text-gray-500">Seguridad de contraseña</span>
                                                                <span className={strength.text}>{strength.label}</span>
                                                            </div>
                                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden flex gap-1">
                                                                <div className={`h-full transition-all duration-500 rounded-full ${strength.color}`} style={{ width: `${score}%` }}></div>
                                                            </div>
                                                        </div>
                                                        <div className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50">
                                                            <div className="text-xs font-semibold text-slate-700 mb-2">Requisitos de contraseña</div>
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
                                            {errors.password && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.password}</p>}
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">Confirmar Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={formData.confirmPassword}
                                                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                                    className={`w-full px-3.5 py-2.5 bg-slate-50 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-sm pr-10`}
                                                    placeholder="••••••••"
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
                                            {errors.confirmPassword && <p className="text-[10px] text-red-500 font-medium mt-1">{errors.confirmPassword}</p>}
                                            {!errors.confirmPassword && formData.confirmPassword && formData.password === formData.confirmPassword && (
                                                <div className="mt-2 px-3 py-2 bg-green-50 border-l-4 border-l-green-500 rounded-lg">
                                                    <p className="text-xs text-green-700 flex items-center gap-2">
                                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Las contraseñas coinciden
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Actions */}
                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg hover:bg-slate-50 transition-all text-xs uppercase tracking-wider"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !hasChanges}
                                    className={`px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 shadow-sm transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                                    Guardar Cambios
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
