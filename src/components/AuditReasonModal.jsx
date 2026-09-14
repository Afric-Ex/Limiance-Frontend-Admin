import React, { useState } from 'react';
import './AuditReasonModal.css';

export default function AuditReasonModal({ isOpen, onClose, onConfirm, title, actionLabel }) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim().length < 8) {
      alert("Please provide a meaningful reason of at least 8 characters.");
      return;
    }
    onConfirm(reason.trim());
    setReason('');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{title || "Confirm Action"}</h3>
        <p className="modal-desc">This action requires a reason for the immutable audit log.</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Reason for change</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Enter a descriptive reason..."
              rows={4}
              required
              minLength={8}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-confirm">{actionLabel || "Confirm"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
