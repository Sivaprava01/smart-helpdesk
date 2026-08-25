import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePersona } from '../../context/PersonaContext';

export default function Sidebar({ isOpen, onClose }) {
  const { currentPersona, setPersona, PERSONAS } = usePersona();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/tickets', label: 'Tickets', icon: 'confirmation_number' },
    { path: '/technician/jobs', label: 'My Jobs', icon: 'assignment_ind' },
    { path: '/technicians', label: 'Technicians', icon: 'engineering' },
    { path: '/routing', label: 'Routing', icon: 'route' },
    { path: '/customers', label: 'Customers', icon: 'groups' },
    { path: '/categories', label: 'Service Categories', icon: 'category' },
  ];

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="d-flex align-items-center justify-content-between px-2 mb-4">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-2 bg-primary text-white"
            style={{ width: '36px', height: '36px' }}
          >
            <span className="material-symbols-outlined fill-1" style={{ fontSize: '20px' }}>
              widgets
            </span>
          </div>
          <div>
            <div className="font-headline text-on-surface fw-bold" style={{ fontSize: '16px', lineHeight: '1.2' }}>
              Smart-HelpDesk
            </div>
            <div className="font-label text-secondary" style={{ fontSize: '10px' }}>
              Live Operations
            </div>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button
          type="button"
          className="btn btn-sm btn-link d-md-none text-secondary p-0"
          onClick={onClose}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-grow-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Persona Switcher / User Profile footer */}
      <div className="pt-3 border-top border-outline-variant mt-auto">
        <div className="px-2 mb-2 font-label text-secondary" style={{ fontSize: '10px' }}>
          DEMO PERSONA
        </div>
        <select
          className="form-select form-select-sm mb-3 bg-surface-container-low border-outline-variant text-on-surface font-body"
          style={{ fontSize: '12px' }}
          value={currentPersona.id}
          onChange={(e) => setPersona(PERSONAS[e.target.value])}
        >
          <option value="DISPATCHER">🛡️ Dispatcher / Admin</option>
          <option value="TECHNICIAN">🔧 Field Technician</option>
          <option value="CUSTOMER">🏠 Resident / Customer</option>
        </select>

        <div className="d-flex align-items-center gap-2 px-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle bg-primary-container text-white fw-bold"
            style={{ width: '32px', height: '32px', fontSize: '12px' }}
          >
            {currentPersona.avatar}
          </div>
          <div className="overflow-hidden">
            <div className="font-headline text-on-surface text-truncate fw-semibold" style={{ fontSize: '13px' }}>
              {currentPersona.name}
            </div>
            <div className="text-secondary text-truncate" style={{ fontSize: '11px' }}>
              {currentPersona.role}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
