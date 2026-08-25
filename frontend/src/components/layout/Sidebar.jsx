import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const userRole = user?.role || 'CUSTOMER';

  // Role-based navigation items
  const allNavItems = [
    { path: '/dashboard', label: 'Operations Dashboard', icon: 'dashboard', roles: ['ADMIN', 'DISPATCHER'] },
    { path: '/tickets', label: userRole === 'CUSTOMER' ? 'My Tickets' : 'Ticket Hub', icon: 'confirmation_number', roles: ['ADMIN', 'DISPATCHER', 'TECHNICIAN', 'CUSTOMER'] },
    { path: '/tickets/new', label: 'Request Service', icon: 'add_circle', roles: ['CUSTOMER'] },
    { path: '/technician/jobs', label: 'My Field Jobs', icon: 'assignment_ind', roles: ['ADMIN', 'TECHNICIAN'] },
    { path: '/technicians', label: 'Technician Capacity', icon: 'engineering', roles: ['ADMIN', 'DISPATCHER'] },
    { path: '/routing', label: 'Routing Engine', icon: 'route', roles: ['ADMIN', 'DISPATCHER'] },
    { path: '/customers', label: 'Resident Directory', icon: 'groups', roles: ['ADMIN', 'DISPATCHER'] },
    { path: '/categories', label: 'Service Categories', icon: 'category', roles: ['ADMIN', 'DISPATCHER'] },
  ];

  const visibleNavItems = allNavItems.filter(
    (item) => item.roles.includes(userRole) || userRole === 'ADMIN'
  );

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'SH';

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
              Operations Portal
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
        {visibleNavItems.map((item) => (
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

      {/* Real Authenticated User Profile & Logout */}
      <div className="pt-3 border-top border-outline-variant mt-auto">
        <div className="d-flex align-items-center gap-2 px-2 mb-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle bg-primary-container text-white fw-bold"
            style={{ width: '34px', height: '34px', fontSize: '12px' }}
          >
            {initials}
          </div>
          <div className="overflow-hidden flex-grow-1">
            <div className="font-headline text-on-surface text-truncate fw-semibold" style={{ fontSize: '13px' }}>
              {user?.email}
            </div>
            <div className="d-flex align-items-center gap-1">
              <span className="badge bg-primary-subtle text-primary font-label" style={{ fontSize: '9px' }}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-sm btn-outline-secondary w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={logout}
          style={{ fontSize: '12px' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
            logout
          </span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
