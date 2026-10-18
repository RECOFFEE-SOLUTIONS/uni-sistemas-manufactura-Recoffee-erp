"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Mail,
  Phone,
} from "lucide-react";
import apiClient from "@/lib/api";
import { Supplier } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";

export default function SuppliersPage() {
  const { showToast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Supplier[]>("/api/suppliers", {
        params: { activeOnly: activeOnly ? true : undefined },
      });
      setSuppliers(res.data);
    } catch {
      showToast("Error al cargar proveedores desde la API", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [activeOnly]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(
      (s) =>
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.contactName && s.contactName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.email && s.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [suppliers, searchTerm]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({
      code: "",
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier(s);
    setFormData({
      code: s.code,
      name: s.name,
      contactName: s.contactName || "",
      email: s.email || "",
      phone: s.phone || "",
      address: s.address || "",
      isActive: s.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setModalError("El código y el nombre del proveedor son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      contactName: formData.contactName.trim() || null,
      email: formData.email.trim() || null,
      phone: formData.phone.trim() || null,
      address: formData.address.trim() || null,
      isActive: formData.isActive,
    };

    try {
      if (editingSupplier) {
        await apiClient.put(`/api/suppliers/${editingSupplier.id}`, {
          ...editingSupplier,
          ...payload,
        });
        showToast(`Proveedor ${payload.code} actualizado exitosamente`, "success");
      } else {
        await apiClient.post("/api/suppliers", payload);
        showToast(`Proveedor ${payload.code} creado exitosamente`, "success");
      }
      setIsModalOpen(false);
      fetchSuppliers();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        const msg = axErr.response?.data?.message || "Ocurrió un error al procesar el proveedor.";
        setModalError(msg);
        showToast(msg, "error");
      } else {
        setModalError("No se pudo conectar con el servidor.");
        showToast("Error de conexión con el backend", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`¿Está seguro de eliminar o desactivar el proveedor "${s.code} - ${s.name}"?`)) {
      return;
    }

    try {
      const res = await apiClient.delete(`/api/suppliers/${s.id}`);
      showToast(res.data?.message || `Proveedor ${s.code} procesado`, "success");
      fetchSuppliers();
    } catch {
      showToast("Error al intentar eliminar el proveedor", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Catálogo de Proveedores
            </h1>
            <p className="text-xs text-slate-400">
              Gestión de proveedores de materia prima (broza de café, pergamino) e insumos de empaque
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSuppliers}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proveedor</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-950"
          />
          <span>Mostrar únicamente proveedores activos</span>
        </label>
      </div>

      {/* Tabla DataGrid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Código</th>
                <th className="px-4 py-3.5">Razón Social / Nombre</th>
                <th className="px-4 py-3.5">Contacto</th>
                <th className="px-4 py-3.5">Teléfono</th>
                <th className="px-4 py-3.5">Correo</th>
                <th className="px-4 py-3.5">Dirección</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                    <span>Cargando proveedores...</span>
                  </td>
                </tr>
              ) : filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <span>No se encontraron proveedores registrados.</span>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {s.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                    <td className="px-4 py-3 text-slate-300">{s.contactName || "—"}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      {s.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" /> {s.phone}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {s.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500" /> {s.email}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                      {s.address || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {s.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Editar proveedor"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          title="Eliminar o desactivar proveedor"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSupplier ? `Editar Proveedor (${editingSupplier.code})` : "Nuevo Proveedor"}
        description="Complete los datos comerciales y de contacto del proveedor."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Código <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ej. PRV-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Persona de Contacto
              </label>
              <input
                type="text"
                placeholder="ej. Juan Pérez"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Razón Social / Nombre Comercial <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ej. Beneficio Las Segovias S.A."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                placeholder="+505 2222-3333"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                placeholder="ventas@proveedor.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Dirección Comercial / Planta
            </label>
            <textarea
              rows={2}
              placeholder="Ubicación o dirección fiscal del proveedor..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-950"
            />
            <span>Proveedor habilitado y activo</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingSupplier ? "Guardar Cambios" : "Crear Proveedor"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
