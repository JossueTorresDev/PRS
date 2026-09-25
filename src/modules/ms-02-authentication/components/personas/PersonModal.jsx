import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import documentTypeService from "../../services/documentTypeService";
import personService from "../../services/personService";
import IdentitySection from "./form-sections/IdentitySection";
import PersonalInfoSection from "./form-sections/PersonalInfoSection";
import ContactInfoSection from "./form-sections/ContactInfoSection";
import { useAuth } from "../../hooks/useAuth";

const INITIAL_FORM_STATE = {
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
};

export default function PersonModal({ isOpen, onClose, person, onSuccess }) {
    const { user: currentUserProfile } = useAuth();
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [allDocumentTypes, setAllDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            const personTypeToUse = person?.personType || "N";
            loadDocumentTypes(personTypeToUse);
        }
    }, [isOpen, person]);

    useEffect(() => {
        if (formData.personType && allDocumentTypes.length > 0) {
            filterDocumentTypes(formData.personType);
        }
    }, [formData.personType, allDocumentTypes]);

    useEffect(() => {
        if (person) {
            let formattedBirthDate = "";
            if (person.birthDate) {
                try {
                    const dateArr = Array.isArray(person.birthDate) ? person.birthDate : null;
                    const dateObj = dateArr ? new Date(dateArr[0], dateArr[1] - 1, dateArr[2]) : new Date(person.birthDate);
                    if (!isNaN(dateObj.getTime())) formattedBirthDate = dateObj.toISOString().split('T')[0];
                } catch (e) { }
            }
            setFormData({ ...person, birthDate: formattedBirthDate, 
                         hasSupplier: !!person.serviceSupplierId, 
                         hasWarranty: !!person.warrantyExpirationDate });
        } else {
            setFormData(INITIAL_FORM_STATE);
        }
    }, [person, isOpen]);

    const loadDocumentTypes = async (personTypeOverride = null) => {
        try {
            const types = await documentTypeService.getActiveDocumentTypes();
            setAllDocumentTypes(types);
            filterDocumentTypes(personTypeOverride || formData.personType, types);
        } catch (e) { }
    };

    const filterDocumentTypes = (personType, types = allDocumentTypes) => {
        if (!types?.length) return;
        const filtered = personType === "N" ? types.filter(t => t.code !== "RUC") : types.filter(t => t.code === "RUC");
        setDocumentTypes(filtered);
        if (formData.documentTypeId && !filtered.some(t => t.id === parseInt(formData.documentTypeId))) {
            setFormData(prev => ({ ...prev, documentTypeId: "", documentNumber: "" }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
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

    const validateForm = () => {
        const n = {};
        if (!formData.documentTypeId) n.documentTypeId = "Obligatorio";
        if (!formData.documentNumber) n.documentNumber = "Obligatorio";
        else {
            const t = documentTypes.find(x => x.id === parseInt(formData.documentTypeId));
            if (t?.length && formData.documentNumber.length !== t.length) n.documentNumber = `Debe tener ${t.length} dígitos`;
        }
        if (!formData.firstName) n.firstName = "Obligatorio";
        if (!formData.lastName) n.lastName = "Obligatorio";
        if (!formData.birthDate) n.birthDate = "Obligatorio";
        else if (!calculateAge(formData.birthDate).isAdult) n.birthDate = "Debe ser mayor de 18 años";
        if (!formData.personalPhone || formData.personalPhone.length !== 9) n.personalPhone = "Debe tener 9 dígitos";
        if (!formData.address) n.address = "Obligatorio";
        setErrors(n);
        return Object.keys(n).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return Swal.fire("Error", "Revise el formulario", "warning");
        setLoading(true);
        try {
            const data = { ...formData, documentTypeId: parseInt(formData.documentTypeId) };
            if (person) {
                await personService.updatePerson(person.id, data);
            } else {

                data.createdBy = currentUserProfile?.userId || 
                    JSON.parse(sessionStorage.getItem('user'))?.userId || 
                    'system';
                await personService.createPerson(data);
            }
            onSuccess();
            onClose();
        } catch (error) {
            Swal.fire("Error", error.message || "Fallo al guardar", "error");
        } finally {
            setLoading(true); // Ocultar spinner
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-gray-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-cyan-100 flex-shrink-0 flex justify-between items-center bg-cyan-600">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">{person ? "Editar Persona" : "Nueva Persona"}</h2>
                            <p className="text-cyan-100 text-sm mt-1">Completa los datos de la persona</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-all duration-200">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto flex-1 bg-white" style={{ scrollbarWidth: "thin" }}>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <IdentitySection 
                            formData={formData} setFormData={setFormData} errors={errors} 
                            documentTypes={documentTypes} handleChange={handleChange} 
                            calculateAge={calculateAge} person={person}
                        />
                        <PersonalInfoSection formData={formData} setFormData={setFormData} errors={errors} handleChange={handleChange} />
                        <ContactInfoSection formData={formData} errors={errors} handleChange={handleChange} />

                        <div className="mt-8 flex justify-end gap-4 p-2">
                            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-all uppercase text-xs tracking-widest">Cancelar</button>
                            <button type="submit" disabled={loading} className="px-10 py-3 rounded-xl bg-cyan-600 text-white font-black hover:bg-cyan-700 shadow-lg transition-all uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>}
                                {person ? (loading ? 'Guardando...' : 'Guardar Cambios') : (loading ? 'Creando...' : 'Registrar Persona')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
