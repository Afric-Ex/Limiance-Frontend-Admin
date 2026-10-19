import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState(null);
  const resolveRef = useRef(null);

  /**
   * confirm({
   *   title: string,
   *   message: string,
   *   confirmText?: string,
   *   cancelText?: string,
   *   variant?: 'danger' | 'warning' | 'success' | 'primary',
   *   prompt?: boolean,
   *   promptPlaceholder?: string,
   *   promptDefault?: string,
   *   promptRequired?: boolean,
   * })
   *
   * Returns a Promise resolving to true/false (or prompt string/null if prompt=true).
   */
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setModalState({
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || (options.variant === 'danger' ? 'Confirm & Delete' : 'Confirm'),
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'primary',
        prompt: Boolean(options.prompt),
        promptPlaceholder: options.promptPlaceholder || 'Enter details...',
        promptValue: options.promptDefault || '',
        promptRequired: options.promptRequired ?? false,
      });
    });
  }, []);

  const handleCancel = () => {
    if (resolveRef.current) {
      resolveRef.current(modalState?.prompt ? null : false);
      resolveRef.current = null;
    }
    setModalState(null);
  };

  const handleConfirm = (e) => {
    e?.preventDefault();
    if (modalState?.prompt && modalState.promptRequired && !modalState.promptValue.trim()) {
      return;
    }
    if (resolveRef.current) {
      resolveRef.current(modalState?.prompt ? modalState.promptValue.trim() : true);
      resolveRef.current = null;
    }
    setModalState(null);
  };

  const getIcon = (variant) => {
    switch (variant) {
      case 'danger':
        return <AlertTriangle size={24} style={{ color: "var(--danger-text)" }} />;
      case 'warning':
        return <AlertCircle size={24} style={{ color: "var(--warning-text)" }} />;
      case 'success':
        return <CheckCircle2 size={24} style={{ color: "var(--success-text)" }} />;
      default:
        return <HelpCircle size={24} style={{ color: "var(--info-text)" }} />;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {modalState && (
        <div className="confirm-modal-overlay" onClick={handleCancel}>
          <div
            className={`confirm-modal-content confirm-modal-${modalState.variant}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              className="confirm-modal-close"
              onClick={handleCancel}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="confirm-modal-header">
              <div className={`confirm-modal-icon-badge badge-${modalState.variant}`}>
                {getIcon(modalState.variant)}
              </div>
              <div>
                <h3 className="confirm-modal-title">{modalState.title}</h3>
                <p className="confirm-modal-message">{modalState.message}</p>
              </div>
            </div>

            {modalState.prompt && (
              <form onSubmit={handleConfirm} style={{ marginTop: '1rem' }}>
                <div className="confirm-prompt-group">
                  <textarea
                    autoFocus
                    rows={3}
                    placeholder={modalState.promptPlaceholder}
                    value={modalState.promptValue}
                    onChange={(e) =>
                      setModalState((prev) => ({ ...prev, promptValue: e.target.value }))
                    }
                    className="confirm-prompt-input"
                  />
                </div>
              </form>
            )}

            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-btn-cancel"
                onClick={handleCancel}
              >
                {modalState.cancelText}
              </button>
              <button
                type="button"
                className={`confirm-btn-action btn-variant-${modalState.variant}`}
                onClick={handleConfirm}
                disabled={
                  modalState.prompt &&
                  modalState.promptRequired &&
                  !modalState.promptValue.trim()
                }
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}
