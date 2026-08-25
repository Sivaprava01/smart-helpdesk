import React from 'react';
import { getTicketStatusMeta, getAssignmentStatusMeta } from '../../constants/statusMappings';

export default function StatusBadge({
  status,
  type = 'ticket', // 'ticket' or 'assignment'
  showIcon = true,
  adminMode = false,
  className = '',
}) {
  const meta = type === 'assignment' ? getAssignmentStatusMeta(status) : getTicketStatusMeta(status);
  const label = adminMode && meta.adminLabel ? meta.adminLabel : meta.label;

  return (
    <span className={`sh-badge ${meta.className} ${className}`} title={meta.description || label}>
      {showIcon && meta.icon && (
        <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
      )}
      <span>{label}</span>
    </span>
  );
}
