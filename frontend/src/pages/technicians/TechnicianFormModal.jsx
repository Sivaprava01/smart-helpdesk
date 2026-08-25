import React, { useState, useEffect } from 'react';
import ModalDialog from '../../components/common/ModalDialog';
import Button from '../../components/common/Button';
import { categoriesApi } from '../../api/categories';
import { techniciansApi } from '../../api/technicians';
import { useToast } from '../../context/ToastContext';

export default function TechnicianFormModal({
  isOpen,
  onClose,
  technician = null, // null for Create, object for Edit
  onSaved,
}) {
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    current_zone: 'Tower A',
    max_workload: 5,
    is_on_duty: true,
    category_ids: [],
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (technician) {
        setFormData({
          full_name: technician.full_name || '',
          email: technician.email || '',
          phone_number: technician.phone_number || '',
          current_zone: technician.current_zone || 'Tower A',
          max_workload: technician.max_workload ?? 5,
          is_on_duty: technician.is_on_duty ?? true,
          category_ids: technician.categories ? technician.categories.map((c) => c.id) : [],
        });
      } else {
        setFormData({
          full_name: '',
          email: '',
          phone_number: '',
          current_zone: 'Tower A',
          max_workload: 5,
          is_on_duty: true,
          category_ids: [],
        });
      }
      setErrors({});
    }
  }, [isOpen, technician]);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      const data = await categoriesApi.list({ is_active: true });
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoadingCategories(false);
    }
  }

  function handleCategoryToggle(catId) {
    setFormData((prev) => {
      const exists = prev.category_ids.includes(catId);
      return {
        ...prev,
        category_ids: exists
          ? prev.category_ids.filter((id) => id !== catId)
          : [...prev.category_ids, catId],
      };
    });
  }

  function validate() {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'Full name is required';
    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.phone_number.trim()) errs.phone_number = 'Phone number is required';
    if (formData.max_workload < 1 || formData.max_workload > 20) {
      errs.max_workload = 'Maximum workload must be between 1 and 20';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (technician) {
        // Edit mode
        await techniciansApi.update(technician.id, {
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          current_zone: formData.current_zone,
          max_workload: parseInt(formData.max_workload, 10),
          is_on_duty: formData.is_on_duty,
          category_ids: formData.category_ids,
        });
        showSuccess('Technician details updated successfully.');
      } else {
        // Create mode
        await techniciansApi.create({
          full_name: formData.full_name,
          email: formData.email,
          phone_number: formData.phone_number,
          current_zone: formData.current_zone,
          max_workload: parseInt(formData.max_workload, 10),
          is_on_duty: formData.is_on_duty,
          category_ids: formData.category_ids,
        });
        showSuccess('Technician registered successfully.');
      }
      onSaved();
      onClose();
    } catch (err) {
      showError(err.message || 'Failed to save technician.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={technician ? 'Edit Technician Capacity & Skills' : 'Register New Technician'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            {technician ? 'Save Changes' : 'Register Technician'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="row g-3">
          {/* Full Name */}
          <div className="col-12 col-md-6">
            <label className="form-label font-label text-secondary mb-1">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.full_name ? 'is-invalid' : ''}`}
              placeholder="e.g. Sarah Jenkins"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            />
            {errors.full_name && <div className="invalid-feedback">{errors.full_name}</div>}
          </div>

          {/* Email */}
          <div className="col-12 col-md-6">
            <label className="form-label font-label text-secondary mb-1">
              Email Address <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          {/* Phone Number */}
          <div className="col-12 col-md-6">
            <label className="form-label font-label text-secondary mb-1">
              Phone Number <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className={`form-control ${errors.phone_number ? 'is-invalid' : ''}`}
              placeholder="+1234567890"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            />
            {errors.phone_number && <div className="invalid-feedback">{errors.phone_number}</div>}
          </div>

          {/* Current Zone */}
          <div className="col-12 col-md-6">
            <label className="form-label font-label text-secondary mb-1">Operating Zone</label>
            <select
              className="form-select"
              value={formData.current_zone}
              onChange={(e) => setFormData({ ...formData, current_zone: e.target.value })}
            >
              <option value="Tower A">Tower A</option>
              <option value="Tower B">Tower B</option>
              <option value="Tower C">Tower C</option>
              <option value="Tower D">Tower D</option>
              <option value="North Wing">North Wing</option>
              <option value="South Wing">South Wing</option>
            </select>
          </div>

          {/* Max Workload Capacity */}
          <div className="col-12 col-md-6">
            <label className="form-label font-label text-secondary mb-1">
              Max Active Workload Capacity
            </label>
            <input
              type="number"
              min="1"
              max="20"
              className={`form-control ${errors.max_workload ? 'is-invalid' : ''}`}
              value={formData.max_workload}
              onChange={(e) => setFormData({ ...formData, max_workload: e.target.value })}
            />
            {errors.max_workload && <div className="invalid-feedback">{errors.max_workload}</div>}
            <div className="form-text" style={{ fontSize: '11px' }}>
              Maximum simultaneous tickets allowed before marked busy.
            </div>
          </div>

          {/* On Duty Status */}
          <div className="col-12 col-md-6 d-flex align-items-center">
            <div className="form-check form-switch mt-3">
              <input
                className="form-check-input"
                type="checkbox"
                role="switch"
                id="onDutySwitch"
                checked={formData.is_on_duty}
                onChange={(e) => setFormData({ ...formData, is_on_duty: e.target.checked })}
              />
              <label className="form-check-label fw-semibold" htmlFor="onDutySwitch">
                On Duty (Available for Dispatch)
              </label>
            </div>
          </div>

          {/* Skills / Categories */}
          <div className="col-12">
            <label className="form-label font-label text-secondary mb-1">
              Service Skills & Categories
            </label>
            {loadingCategories ? (
              <div className="text-secondary small">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="text-secondary small">No active categories found.</div>
            ) : (
              <div className="d-flex flex-wrap gap-2 pt-1">
                {categories.map((cat) => {
                  const isSelected = formData.category_ids.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`btn btn-sm d-inline-flex align-items-center gap-1 ${
                        isSelected ? 'btn-primary' : 'btn-outline-secondary'
                      }`}
                      style={{ borderRadius: 'var(--radius-pill)', fontSize: '12px' }}
                      onClick={() => handleCategoryToggle(cat.id)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        {isSelected ? 'check' : 'add'}
                      </span>
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </form>
    </ModalDialog>
  );
}
