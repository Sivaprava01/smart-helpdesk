import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import ModalDialog from '../../components/common/ModalDialog';
import { customersApi } from '../../api/customers';
import { useToast } from '../../context/ToastContext';

export default function CustomersPage() {
  const { showSuccess, showError } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    default_location: 'Tower A, Apt 402',
    age: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);
      setError(null);
      const data = await customersApi.list();
      setCustomers(data);
    } catch (err) {
      setError(err.message || 'Failed to load resident directory.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingCustomer(null);
    setFormData({
      full_name: '',
      email: '',
      phone_number: '',
      default_location: 'Tower A, Apt 402',
      age: '',
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function handleOpenEdit(cust) {
    setEditingCustomer(cust);
    setFormData({
      full_name: cust.full_name || '',
      email: cust.email || '',
      phone_number: cust.phone_number || '',
      default_location: cust.default_location || 'Tower A, Apt 402',
      age: cust.age || '',
    });
    setErrors({});
    setIsModalOpen(true);
  }

  function validate() {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Valid email is required';
    }
    if (!formData.phone_number.trim()) errs.phone_number = 'Phone number is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        default_location: formData.default_location.trim(),
        age: formData.age ? parseInt(formData.age, 10) : undefined,
      };

      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, payload);
        showSuccess('Resident profile updated successfully.');
      } else {
        await customersApi.create(payload);
        showSuccess('Resident registered successfully.');
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      showError(err.message || 'Failed to save customer.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Residents & Customers"
        subtitle="Manage resident profiles, contact channels, and default unit locations."
        breadcrumbs={[{ label: 'Operations', href: '/dashboard' }, { label: 'Customers' }]}
        actions={
          <Button variant="primary" icon="person_add" onClick={handleOpenCreate}>
            Register Resident
          </Button>
        }
      />

      {loading && <SkeletonLoader type="table-row" count={5} />}

      {!loading && error && (
        <ErrorState title="Failed to load residents" message={error} onRetry={loadCustomers} />
      )}

      {!loading && !error && customers.length === 0 && (
        <EmptyState
          icon="groups"
          title="No residents registered"
          description="Register your first resident or customer to begin dispatching service requests."
          actionLabel="Register Resident"
          onAction={handleOpenCreate}
        />
      )}

      {!loading && !error && customers.length > 0 && (
        <div className="sh-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="bg-surface-container-low border-bottom border-outline-variant">
                <tr>
                  <th className="py-3 px-3 font-label text-secondary">NAME</th>
                  <th className="py-3 px-3 font-label text-secondary">CONTACT</th>
                  <th className="py-3 px-3 font-label text-secondary">LOCATION</th>
                  <th className="py-3 px-3 font-label text-secondary">CUSTOMER ID</th>
                  <th className="py-3 px-3 font-label text-secondary text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((cust) => (
                  <tr key={cust.id} className="border-bottom border-outline-variant">
                    <td className="py-3 px-3">
                      <div className="fw-semibold text-on-surface">{cust.full_name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div>{cust.phone_number}</div>
                      <div className="text-secondary small font-mono">{cust.email}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="badge bg-surface-container text-on-surface-variant">
                        {cust.default_location || 'Tower A'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-secondary small" style={{ fontSize: '11px' }}>
                      {cust.id}
                    </td>
                    <td className="py-3 px-3 text-end">
                      <Button variant="secondary" size="sm" icon="edit" onClick={() => handleOpenEdit(cust)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <ModalDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Resident Details' : 'Register Resident'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {editingCustomer ? 'Save Changes' : 'Register Resident'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label font-label text-secondary mb-1">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
              placeholder="e.g. Siva Prava"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            {errors.full_name && <div className="invalid-feedback">{errors.full_name}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label font-label text-secondary mb-1">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="siva@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label font-label text-secondary mb-1">
              Phone Number <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.phone_number ? 'is-invalid' : ''}`}
              placeholder="+919876543210"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            {errors.phone_number && <div className="invalid-feedback">{errors.phone_number}</div>}
          </div>

          <div className="mb-3">
            <label className="form-label font-label text-secondary mb-1">Default Unit / Location</label>
            <input
              type="text"
              className="form-control"
              placeholder="Tower A, Flat 402"
              value={formData.default_location}
              onChange={(e) => setFormData({ ...formData, default_location: e.target.value })}
            />
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
