import React from 'react';

export default function PageHeader({
  title,
  subtitle,
  actions = null,
  breadcrumbs = null,
}) {
  return (
    <div className="mb-4">
      {breadcrumbs && (
        <div className="d-flex align-items-center gap-1 mb-2 font-label text-secondary" style={{ fontSize: '11px' }}>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>chevron_right</span>}
              {crumb.href ? (
                <a href={crumb.href} className="text-secondary text-decoration-none hover-primary">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-on-surface fw-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
        <div>
          <h1 className="h3 font-headline text-on-surface mb-1">{title}</h1>
          {subtitle && <p className="text-on-surface-variant mb-0" style={{ fontSize: '14px' }}>{subtitle}</p>}
        </div>
        {actions && <div className="d-flex align-items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
