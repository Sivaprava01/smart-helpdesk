import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/common/Button';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import TechnicianFormModal from './TechnicianFormModal';
import { techniciansApi } from '../../api/technicians';
import { categoriesApi } from '../../api/categories';
import { useToast } from '../../context/ToastContext';

export default function TechnicianCapacityPage() {
  const { showSuccess, showError } = useToast();
  const [technicians, setTechnicians] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [dutyFilter, setDutyFilter] = useState('ALL'); // 'ALL', 'ON_DUTY', 'OFF_DUTY'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError(null);
      const [techsData, catsData] = await Promise.all([
        techniciansApi.list(),
        categoriesApi.list({ is_active: true }),
      ]);
      setTechnicians(techsData);
      setCategories(catsData);
    } catch (err) {
      setError(err.message || 'Failed to load technician capacity data.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleDuty(tech, e) {
    e.stopPropagation();
    try {
      const updatedDuty = !tech.is_on_duty;
      await techniciansApi.update(tech.id, { is_on_duty: updatedDuty });
      setTechnicians((prev) =>
        prev.map((t) => (t.id === tech.id ? { ...t, is_on_duty: updatedDuty } : t))
      );
      showSuccess(
        `${tech.full_name} is now ${updatedDuty ? 'On Duty (Available)' : 'Off Duty'}.`
      );
    } catch (err) {
      showError(err.message || 'Failed to update duty status.');
    }
  }

  function handleOpenCreate() {
    setEditingTechnician(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(tech) {
    setEditingTechnician(tech);
    setIsModalOpen(true);
  }

  // Filtered List
  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = tech.full_name?.toLowerCase().includes(q);
        const matchEmail = tech.email?.toLowerCase().includes(q);
        const matchZone = tech.current_zone?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchZone) return false;
      }

      // Category / Skill
      if (selectedCategory) {
        const hasCat = tech.categories?.some((c) => c.id === selectedCategory);
        if (!hasCat) return false;
      }

      // Zone
      if (selectedZone) {
        if (tech.current_zone !== selectedZone) return false;
      }

      // Duty status
      if (dutyFilter === 'ON_DUTY' && !tech.is_on_duty) return false;
      if (dutyFilter === 'OFF_DUTY' && tech.is_on_duty) return false;

      return true;
    });
  }, [technicians, searchQuery, selectedCategory, selectedZone, dutyFilter]);

  // Unique Zones list from actual data
  const zonesList = useMemo(() => {
    const set = new Set();
    technicians.forEach((t) => {
      if (t.current_zone) set.add(t.current_zone);
    });
    return Array.from(set);
  }, [technicians]);

  return (
    <div>
      {/* Header */}
      <PageHeader
        title="Technician Capacity Management"
        subtitle="Monitor live technician workloads, skills, and dispatch availability."
        breadcrumbs={[{ label: 'Operations', href: '/dashboard' }, { label: 'Technicians' }]}
        actions={
          <Button variant="primary" icon="person_add" onClick={handleOpenCreate}>
            Register Technician
          </Button>
        }
      />

      {/* Filter Toolbar (Matches Stitch 07fc047c...) */}
      <div className="sh-card p-3 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center gap-3">
          {/* Search Box */}
          <div className="position-relative" style={{ minWidth: '220px', flex: '1 1 200px' }}>
            <span
              className="material-symbols-outlined position-absolute text-secondary"
              style={{ left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '18px' }}
            >
              search
            </span>
            <input
              type="text"
              className="form-control form-control-sm ps-4 bg-surface-container-low border-outline-variant"
              placeholder="Search by name, email, zone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <select
            className="form-select form-select-sm bg-surface-container-low border-outline-variant"
            style={{ width: 'auto', minWidth: '150px' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Skills / Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Zone Filter */}
          <select
            className="form-select form-select-sm bg-surface-container-low border-outline-variant"
            style={{ width: 'auto', minWidth: '140px' }}
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
          >
            <option value="">All Zones</option>
            {zonesList.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>

          {/* Duty Status Pills */}
          <div className="btn-group btn-group-sm bg-surface-container-low p-1 border rounded" role="group">
            <button
              type="button"
              className={`btn btn-sm ${
                dutyFilter === 'ALL'
                  ? 'btn-primary'
                  : 'btn-link text-secondary text-decoration-none'
              }`}
              style={{ fontSize: '12px', padding: '3px 10px' }}
              onClick={() => setDutyFilter('ALL')}
            >
              All ({technicians.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                dutyFilter === 'ON_DUTY'
                  ? 'btn-primary'
                  : 'btn-link text-secondary text-decoration-none'
              }`}
              style={{ fontSize: '12px', padding: '3px 10px' }}
              onClick={() => setDutyFilter('ON_DUTY')}
            >
              On Duty ({technicians.filter((t) => t.is_on_duty).length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                dutyFilter === 'OFF_DUTY'
                  ? 'btn-primary'
                  : 'btn-link text-secondary text-decoration-none'
              }`}
              style={{ fontSize: '12px', padding: '3px 10px' }}
              onClick={() => setDutyFilter('OFF_DUTY')}
            >
              Off Duty ({technicians.filter((t) => !t.is_on_duty).length})
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="ms-auto d-flex align-items-center gap-1">
            <button
              type="button"
              className={`btn btn-sm ${
                viewMode === 'grid'
                  ? 'bg-primary-subtle text-primary fw-bold'
                  : 'text-secondary'
              }`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                grid_view
              </span>
            </button>
            <button
              type="button"
              className={`btn btn-sm ${
                viewMode === 'list'
                  ? 'bg-primary-subtle text-primary fw-bold'
                  : 'text-secondary'
              }`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                view_list
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && <SkeletonLoader type="card" count={6} />}

      {/* Error State */}
      {!loading && error && (
        <ErrorState title="Failed to load technicians" message={error} onRetry={loadData} />
      )}

      {/* Empty State */}
      {!loading && !error && filteredTechnicians.length === 0 && (
        <EmptyState
          icon="engineering"
          title="No technicians found"
          description={
            searchQuery || selectedCategory || selectedZone || dutyFilter !== 'ALL'
              ? 'No technicians match your active filter selection.'
              : 'There are no technicians registered in the system yet.'
          }
          actionLabel="Register First Technician"
          onAction={handleOpenCreate}
        />
      )}

      {/* Grid View */}
      {!loading && !error && filteredTechnicians.length > 0 && viewMode === 'grid' && (
        <div className="row g-3">
          {filteredTechnicians.map((tech) => {
            const workloadPct = Math.min(
              100,
              Math.round(((tech.current_workload || 0) / (tech.max_workload || 5)) * 100)
            );
            const isAtCapacity = (tech.current_workload || 0) >= (tech.max_workload || 5);
            const reopenRate =
              tech.completed_jobs_count > 0
                ? ((tech.reopened_jobs_count / tech.completed_jobs_count) * 100).toFixed(1) + '%'
                : '0.0%';

            // Left stripe color
            let stripeColor = '#10b981'; // Green
            if (!tech.is_on_duty) stripeColor = '#94a3b8'; // Slate
            else if (isAtCapacity) stripeColor = '#ef4444'; // Red
            else if (workloadPct >= 60) stripeColor = '#f59e0b'; // Amber

            return (
              <div key={tech.id} className="col-12 col-md-6 col-lg-4">
                <div
                  className="sh-card position-relative overflow-hidden h-100 d-flex flex-column"
                  style={{ borderLeft: `4px solid ${stripeColor}` }}
                >
                  {/* Card Header */}
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="d-flex align-items-center justify-content-center rounded-circle bg-primary-subtle text-primary fw-bold"
                        style={{ width: '42px', height: '42px', fontSize: '15px' }}
                      >
                        {tech.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-headline h6 text-on-surface mb-0">{tech.full_name}</h3>
                        <div className="text-secondary small d-flex align-items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                            location_on
                          </span>
                          <span>{tech.current_zone || 'Tower A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Duty Toggle Button */}
                    <button
                      type="button"
                      className={`btn btn-sm ${
                        tech.is_on_duty
                          ? 'btn-success bg-opacity-25 text-success border-success'
                          : 'btn-secondary bg-opacity-25 text-secondary border-secondary'
                      }`}
                      style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}
                      onClick={(e) => handleToggleDuty(tech, e)}
                      title="Click to toggle on-duty/off-duty"
                    >
                      {tech.is_on_duty ? '● On Duty' : '○ Off Duty'}
                    </button>
                  </div>

                  {/* Skills / Categories Tags */}
                  <div className="d-flex flex-wrap gap-1 mb-3">
                    {tech.categories && tech.categories.length > 0 ? (
                      tech.categories.map((cat) => (
                        <span
                          key={cat.id}
                          className="badge bg-surface-container-high text-on-surface-variant font-label"
                          style={{ fontSize: '10px' }}
                        >
                          {cat.name}
                        </span>
                      ))
                    ) : (
                      <span className="badge bg-light text-secondary font-label" style={{ fontSize: '10px' }}>
                        General Maintenance
                      </span>
                    )}
                  </div>

                  {/* Metrics 3-Col Bar (Matches Stitch 07fc047c...) */}
                  <div className="row g-0 text-center py-2 mb-3 border-top border-bottom border-outline-variant bg-surface-container-low rounded-2">
                    <div className="col-4 border-end border-outline-variant">
                      <div className="font-label text-secondary" style={{ fontSize: '10px' }}>
                        RATING
                      </div>
                      <div className="fw-bold font-headline text-on-surface d-flex align-items-center justify-content-center gap-1" style={{ fontSize: '13px' }}>
                        {tech.overall_rating ? Number(tech.overall_rating).toFixed(2) : 'N/A'}
                        {tech.overall_rating && (
                          <span className="material-symbols-outlined text-warning" style={{ fontSize: '14px' }}>
                            star
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-4 border-end border-outline-variant">
                      <div className="font-label text-secondary" style={{ fontSize: '10px' }}>
                        COMPLETED
                      </div>
                      <div className="fw-bold font-headline text-on-surface" style={{ fontSize: '13px' }}>
                        {tech.completed_jobs_count || 0}
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="font-label text-secondary" style={{ fontSize: '10px' }}>
                        REOPEN RATE
                      </div>
                      <div
                        className={`fw-bold font-headline ${
                          reopenRate === '0.0%' ? 'text-success' : 'text-danger'
                        }`}
                        style={{ fontSize: '13px' }}
                      >
                        {reopenRate}
                      </div>
                    </div>
                  </div>

                  {/* Workload Progress Bar */}
                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="font-label text-secondary" style={{ fontSize: '11px' }}>
                        CURRENT WORKLOAD
                      </span>
                      <span className="font-mono text-on-surface fw-semibold" style={{ fontSize: '12px' }}>
                        {tech.current_workload || 0} / {tech.max_workload || 5} Active
                      </span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className={`progress-bar ${
                          isAtCapacity
                            ? 'bg-danger'
                            : workloadPct >= 60
                            ? 'bg-warning'
                            : 'bg-primary'
                        }`}
                        role="progressbar"
                        style={{ width: `${workloadPct}%` }}
                        aria-valuenow={workloadPct}
                        aria-valuemin="0"
                        aria-valuemax="100"
                      ></div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top border-outline-variant">
                      <button
                        type="button"
                        className="btn btn-sm btn-link text-primary p-0 d-flex align-items-center gap-1 text-decoration-none"
                        style={{ fontSize: '12px' }}
                        onClick={() => handleOpenEdit(tech)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                          edit
                        </span>
                        <span>Edit Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {!loading && !error && filteredTechnicians.length > 0 && viewMode === 'list' && (
        <div className="sh-card bg-white p-0 overflow-hidden shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
              <thead className="bg-surface-container-low border-bottom border-outline-variant">
                <tr>
                  <th className="py-3 px-3 font-label text-secondary">TECHNICIAN</th>
                  <th className="py-3 px-3 font-label text-secondary">SKILLS</th>
                  <th className="py-3 px-3 font-label text-secondary">ZONE</th>
                  <th className="py-3 px-3 font-label text-secondary">DUTY</th>
                  <th className="py-3 px-3 font-label text-secondary">RATING</th>
                  <th className="py-3 px-3 font-label text-secondary">WORKLOAD</th>
                  <th className="py-3 px-3 font-label text-secondary text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTechnicians.map((tech) => {
                  const isAtCapacity = (tech.current_workload || 0) >= (tech.max_workload || 5);
                  return (
                    <tr key={tech.id} className="border-bottom border-outline-variant">
                      <td className="py-3 px-3">
                        <div className="fw-semibold text-on-surface">{tech.full_name}</div>
                        <div className="text-secondary small font-mono">{tech.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="d-flex flex-wrap gap-1">
                          {tech.categories?.map((c) => (
                            <span key={c.id} className="badge bg-surface-container text-on-surface-variant font-label">
                              {c.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3">{tech.current_zone || 'Tower A'}</td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          className={`btn btn-sm ${
                            tech.is_on_duty
                              ? 'btn-success bg-opacity-25 text-success border-success'
                              : 'btn-secondary bg-opacity-25 text-secondary border-secondary'
                          }`}
                          style={{ fontSize: '11px', padding: '2px 8px', borderRadius: 'var(--radius-pill)' }}
                          onClick={(e) => handleToggleDuty(tech, e)}
                        >
                          {tech.is_on_duty ? '● On Duty' : '○ Off Duty'}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <span className="fw-semibold font-mono">
                          {tech.overall_rating ? Number(tech.overall_rating).toFixed(2) : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className={isAtCapacity ? 'text-danger fw-bold' : ''}>
                          {tech.current_workload || 0} / {tech.max_workload || 5}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-end">
                        <Button variant="secondary" size="sm" icon="edit" onClick={() => handleOpenEdit(tech)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Dialog for Register/Edit */}
      <TechnicianFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        technician={editingTechnician}
        onSaved={loadData}
      />
    </div>
  );
}
