/**
 * Centralized Smart-HelpDesk Status Mappings
 * Explicit separation between TicketStatus and AssignmentStatus
 */

export const TICKET_STATUS = {
  PENDING: {
    key: 'PENDING',
    label: 'Request Received',
    adminLabel: 'Pending Dispatch',
    className: 'sh-badge-pending',
    icon: 'schedule',
    description: 'Ticket created and waiting in queue for dispatch.',
  },
  ROUTING: {
    key: 'ROUTING',
    label: 'Finding Specialist',
    adminLabel: 'In Routing',
    className: 'sh-badge-routing',
    icon: 'autorenew',
    description: 'Assignment offer dispatched to top-ranked technician.',
  },
  ASSIGNED: {
    key: 'ASSIGNED',
    label: 'Specialist Assigned',
    adminLabel: 'Assigned',
    className: 'sh-badge-assigned',
    icon: 'assignment_ind',
    description: 'Technician accepted the offer and is en route.',
  },
  ARRIVED: {
    key: 'ARRIVED',
    label: 'Specialist on Site',
    adminLabel: 'Arrived',
    className: 'sh-badge-arrived',
    icon: 'location_on',
    description: 'Technician has arrived on location.',
  },
  IN_PROGRESS: {
    key: 'IN_PROGRESS',
    label: 'Work in Progress',
    adminLabel: 'In Progress',
    className: 'sh-badge-inprogress',
    icon: 'build',
    description: 'Technician is actively working on the issue.',
  },
  AWAITING_CUSTOMER_CONFIRMATION: {
    key: 'AWAITING_CUSTOMER_CONFIRMATION',
    label: 'Waiting for Confirmation',
    adminLabel: 'Awaiting Confirmation',
    className: 'sh-badge-confirmation',
    icon: 'rate_review',
    description: 'Work completed by technician; customer verification required.',
  },
  RESOLVED: {
    key: 'RESOLVED',
    label: 'Issue Resolved',
    adminLabel: 'Resolved',
    className: 'sh-badge-closed',
    icon: 'task_alt',
    description: 'Work completed and issue resolved.',
  },
  CLOSED: {
    key: 'CLOSED',
    label: 'Resolved & Closed',
    adminLabel: 'Closed',
    className: 'sh-badge-closed',
    icon: 'check_circle',
    description: 'Customer verified resolution. Ticket is closed.',
  },
  REOPENED: {
    key: 'REOPENED',
    label: 'Issue Unresolved',
    adminLabel: 'Reopened',
    className: 'sh-badge-reopened',
    icon: 'replay',
    description: 'Customer reported issue unresolved; rerouting in progress.',
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'Cancelled',
    adminLabel: 'Cancelled',
    className: 'sh-badge-cancelled',
    icon: 'cancel',
    description: 'Service request cancelled.',
  },
};

export const ASSIGNMENT_STATUS = {
  OFFERED: {
    key: 'OFFERED',
    label: 'Offer Pending',
    className: 'sh-badge-routing',
    icon: 'pending_actions',
  },
  DEFERRED: {
    key: 'DEFERRED',
    label: 'Ask Me Later (Active)',
    className: 'sh-badge-pending',
    icon: 'update',
  },
  ACCEPTED: {
    key: 'ACCEPTED',
    label: 'Accepted',
    className: 'sh-badge-assigned',
    icon: 'task_alt',
  },
  DECLINED: {
    key: 'DECLINED',
    label: 'Declined',
    className: 'sh-badge-cancelled',
    icon: 'close',
  },
  EXPIRED: {
    key: 'EXPIRED',
    label: 'Expired',
    className: 'sh-badge-cancelled',
    icon: 'timer_off',
  },
  CANCELLED: {
    key: 'CANCELLED',
    label: 'Cancelled',
    className: 'sh-badge-cancelled',
    icon: 'cancel',
  },
  COMPLETED: {
    key: 'COMPLETED',
    label: 'Completed Attempt',
    className: 'sh-badge-closed',
    icon: 'verified',
  },
};

export const getTicketStatusMeta = (status) => {
  return TICKET_STATUS[status] || {
    key: status,
    label: status,
    adminLabel: status,
    className: 'sh-badge-pending',
    icon: 'info',
    description: '',
  };
};

export const getAssignmentStatusMeta = (status) => {
  return ASSIGNMENT_STATUS[status] || {
    key: status,
    label: status,
    className: 'sh-badge-pending',
    icon: 'info',
  };
};
