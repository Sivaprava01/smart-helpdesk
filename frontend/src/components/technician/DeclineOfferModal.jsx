import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';

export default function DeclineOfferModal({ isOpen, onClose, onConfirm, loading = false, ticketTitle = '' }) {
  const [reason, setReason] = useState('BUSY');
  const [note, setNote] = useState('');

  const declineReasons = [
    { value: 'BUSY', label: 'Currently Busy on Another Task' },
    { value: 'NOT_FEELING_WELL', label: 'Not Feeling Well / Unwell' },
    { value: 'ENDING_SHIFT', label: 'Ending Shift / Off Duty Soon' },
    { value: 'PERSONAL_REASON', label: 'Personal / Emergency Reason' },
    { value: 'OTHER', label: 'Other Reason' },
  ];

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm({ reason, note: note.trim() || undefined });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Decline Assignment Offer"
      size="md"
      footer={
        <div className="d-flex justify-content-end gap-2 w-100">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleSubmit} loading={loading}>
            Confirm Decline
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="alert alert-warning p-3 small mb-3">
          <strong>Important:</strong> Declining this offer will remove you from this ticket's candidate pool and immediately trigger automated fallback rerouting to the next best technician.
        </div>

        {ticketTitle && (
          <div className="mb-3">
            <span className="font-label text-secondary small">TICKET:</span>
            <div className="fw-semibold text-on-surface">{ticketTitle}</div>
          </div>
        )}

        <div className="mb-3">
          <label className="form-label font-label text-secondary" htmlFor="declineReason">
            Reason for Declining <span className="text-danger">*</span>
          </label>
          <select
            id="declineReason"
            className="form-select"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            {declineReasons.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-2">
          <label className="form-label font-label text-secondary" htmlFor="declineNote">
            Additional Notes (Optional)
          </label>
          <textarea
            id="declineNote"
            className="form-control"
            rows="3"
            placeholder="Brief explanation for dispatch logs..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
          <div className="text-end text-secondary small font-label mt-1">
            {note.length} / 500 characters
          </div>
        </div>
      </form>
    </Modal>
  );
}
