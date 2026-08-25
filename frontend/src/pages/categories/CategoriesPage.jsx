import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import ModalDialog from '../../components/common/ModalDialog';
import { categoriesApi } from '../../api/categories';
import { useToast } from '../../context/ToastContext';

export default function CategoriesPage() {
  const { showSuccess, showError } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesApi.list();
      setCategories(data);
    } catch (err) {
      setError(err.message || 'Failed to load service categories.');
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingCategory(null);
    setFormName('');
    setFormActive(true);
    setIsModalOpen(true);
  }

  function handleOpenEdit(cat) {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormActive(cat.is_active);
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formName.trim()) {
      showError('Category name is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, {
          name: formName.trim(),
          is_active: formActive,
        });
        showSuccess('Service category updated successfully.');
      } else {
        await categoriesApi.create({
          name: formName.trim(),
          is_active: formActive,
        });
        showSuccess('New service category created.');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      showError(err.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Service Categories"
        subtitle="Manage available facility maintenance domains and technical skills."
        breadcrumbs={[{ label: 'Operations', href: '/dashboard' }, { label: 'Categories' }]}
        actions={
          <Button variant="primary" icon="add" onClick={handleOpenCreate}>
            Add Category
          </Button>
        }
      />

      {loading && <SkeletonLoader type="card" count={4} />}

      {!loading && error && (
        <ErrorState title="Failed to load categories" message={error} onRetry={loadCategories} />
      )}

      {!loading && !error && categories.length === 0 && (
        <EmptyState
          icon="category"
          title="No service categories"
          description="Create your first service category (e.g., Plumbing, Electrical, HVAC) to get started."
          actionLabel="Add Category"
          onAction={handleOpenCreate}
        />
      )}

      {!loading && !error && categories.length > 0 && (
        <div className="row g-3">
          {categories.map((cat) => (
            <div key={cat.id} className="col-12 col-sm-6 col-lg-4">
              <div className="sh-card h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h3 className="h6 font-headline text-on-surface mb-0">{cat.name}</h3>
                    <span
                      className={`sh-badge ${
                        cat.is_active ? 'sh-badge-closed' : 'sh-badge-pending'
                      }`}
                    >
                      {cat.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="font-mono text-secondary small" style={{ fontSize: '11px' }}>
                    ID: {cat.id}
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top border-outline-variant">
                  <Button variant="secondary" size="sm" icon="edit" onClick={() => handleOpenEdit(cat)}>
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Dialog */}
      <ModalDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Service Category' : 'Create Service Category'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label font-label text-secondary mb-1">
              Category Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Plumbing, HVAC, Electrical"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-check form-switch mt-3">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="activeCategorySwitch"
              checked={formActive}
              onChange={(e) => setFormActive(e.target.checked)}
            />
            <label className="form-check-label fw-semibold" htmlFor="activeCategorySwitch">
              Active Category (Available for Ticket Requests)
            </label>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}
