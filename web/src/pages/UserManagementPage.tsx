/**
 * User Management page - Admin only
 * Allows admins to view and manage users and drivers
 */

import { useState, type FC, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth-store';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useUsers } from '@/hooks/useUsers';
import { type UserRole } from '@/core/firebase';
import './UserManagementPage.css';

type TabType = 'users' | 'drivers';

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone: string; // Required when role === 'driver'
}

const initialFormState: NewUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'driver',
  phone: '',
};

export const UserManagementPage: FC = () => {
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = userRole === 'admin';

  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<NewUserForm>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const handleCopySlug = async (slug: string) => {
    try {
      const fullUrl = `${window.location.origin}/registrar-viaje/${slug}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const { users, drivers, isLoading, error, refetch, registerNewUser, updateUser } = useUsers();

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    await updateUser(userId, { is_active: !currentStatus });
  };

  // Driver status is controlled by user's is_active (driver.id === user.id)
  const handleToggleDriverStatus = async (driverId: string, currentStatus: boolean) => {
    await updateUser(driverId, { is_active: !currentStatus });
  };

  const handleChangeUserRole = async (userId: string, newRole: UserRole) => {
    await updateUser(userId, { role: newRole });
  };

  const handleOpenModal = () => {
    setFormData(initialFormState);
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData(initialFormState);
    setFormError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!formData.name.trim()) {
      setFormError('El nombre es requerido');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('El correo es requerido');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    // Phone is required for drivers
    if (formData.role === 'driver' && !formData.phone.trim()) {
      setFormError('El teléfono es requerido para conductores');
      return;
    }

    setIsSubmitting(true);

    const success = await registerNewUser({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      role: formData.role,
      phone: formData.role === 'driver' ? formData.phone.trim() : undefined,
    });

    setIsSubmitting(false);

    if (success) {
      handleCloseModal();
    } else {
      // Error is set in the hook, but we can also show it locally
      setFormError(error || 'Error al crear el usuario');
    }
  };

  const formatDate = (timestamp: { toDate: () => Date } | undefined) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate();
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="user-management-page">
        <header className="page-header">
          <div className="page-header-content">
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="page-subtitle">Administra usuarios y conductores del sistema</p>
          </div>
          <div className="page-header-actions">
            <button type="button" className="btn btn-primary" onClick={handleOpenModal}>
              <span>+</span> Agregar Usuario
            </button>
            <button type="button" className="btn btn-outline" onClick={refetch}>
              <span>🔄</span> Actualizar
            </button>
          </div>
        </header>

        {error && (
          <div className="error-banner">
            <span className="error-icon">!</span>
            <span>{error}</span>
            <button type="button" className="btn-retry" onClick={refetch}>
              Reintentar
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'users' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Usuarios ({users.length})
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'drivers' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('drivers')}
          >
            Conductores ({drivers.length})
          </button>
        </div>

        {/* Content */}
        <div className="tab-content">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Cargando datos...</p>
            </div>
          ) : activeTab === 'users' ? (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        No hay usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td className="cell-name">{user.name}</td>
                        <td className="cell-email">{user.email}</td>
                        <td>
                          <select
                            className="role-select"
                            value={user.role}
                            onChange={(e) =>
                              handleChangeUserRole(user.id, e.target.value as UserRole)
                            }
                          >
                            <option value="admin">Admin</option>
                            <option value="driver">Conductor</option>
                          </select>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}
                          >
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="cell-date">{formatDate(user.created_at)}</td>
                        <td className="cell-actions">
                          <span
                            className={`status-badge ${user.is_active ? 'status-inactive' : 'status-active'}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                          >
                            {user.is_active ? 'Desactivar' : 'Activar'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Slug</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {drivers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="empty-state">
                        No hay conductores registrados
                      </td>
                    </tr>
                  ) : (
                    drivers.map((driver) => (
                      <tr key={driver.id}>
                        <td className="cell-name">{driver.name}</td>
                        <td className="cell-email">{driver.email}</td>
                        <td className="cell-phone">{driver.phone || '-'}</td>
                        <td className="cell-slug">
                          <code>{driver.unique_slug}</code>
                          <span
                            className={`copy-btn ${copiedSlug === driver.unique_slug ? 'copied' : ''}`}
                            onClick={() => handleCopySlug(driver.unique_slug)}
                            title="Copiar slug"
                          >
                            {copiedSlug === driver.unique_slug ? '✓' : '📋'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${driver.is_active ? 'status-active' : 'status-inactive'}`}
                          >
                            {driver.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="cell-actions">
                          <span
                            className={`status-badge ${driver.is_active ? 'status-inactive' : 'status-active'}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleToggleDriverStatus(driver.id, driver.is_active)}
                          >
                            {driver.is_active ? 'Desactivar' : 'Activar'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for adding new user */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Agregar Nuevo Usuario</h2>
                <button type="button" className="modal-close" onClick={handleCloseModal}>
                  &times;
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {formError && <div className="form-error">{formError}</div>}

                  <div className="form-group">
                    <label htmlFor="name">Nombre completo</label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Juan Pérez"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Ej: juan@ejemplo.com"
                      autoComplete="off"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Contraseña temporal</label>
                    <input
                      type="password"
                      id="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                    />
                    <span className="form-hint">El usuario podrá cambiarla después</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="role">Rol</label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value as UserRole, phone: '' })
                      }
                    >
                      <option value="driver">Conductor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  {/* Phone field - only shown for drivers */}
                  {formData.role === 'driver' && (
                    <div className="form-group">
                      <label htmlFor="phone">Teléfono *</label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Ej: +57 300 123 4567"
                        autoComplete="off"
                      />
                      <span className="form-hint">
                        Se generará automáticamente un enlace público para registrar viajes
                      </span>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleCloseModal}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Creando...' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};
