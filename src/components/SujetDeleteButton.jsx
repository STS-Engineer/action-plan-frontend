import { useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import { deleteSujet } from "../redux/sujet/sujet";

const getDeleteErrorMessage = (error) => (
  error?.response?.data?.detail ||
  error?.message ||
  "Unable to delete topic."
);

export const SujetDeleteButton = ({
  sujet,
  label = "topic",
  onDeleted,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!sujet?.id) {
    return null;
  }

  const closeModal = () => {
    if (loading) return;
    setConfirmOpen(false);
    setError(null);
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteSujet(sujet.id);
      setConfirmOpen(false);
      await onDeleted?.(sujet, result);
    } catch (err) {
      setError(getDeleteErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const title = sujet.titre || `Topic #${sujet.id}`;

  return (
    <>
      <button
        type="button"
        className="delete-action-button delete-sujet-button"
        onClick={(event) => {
          event.stopPropagation();
          setConfirmOpen(true);
        }}
        title={`Delete ${label}`}
        aria-label={`Delete ${label}`}
      >
        <Trash2 size={14} />
        Delete
      </button>

      {confirmOpen &&
        createPortal(
          <div className="status-modal-overlay" onClick={closeModal}>
            <div
              className="status-modal delete-action-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-sujet-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="status-modal-header">
                <div>
                  <h3 id="delete-sujet-title">Delete {label}?</h3>
                  <p>
                    Empty topics and subtopics are removed from active views.
                    Actions, child topics, and child subtopics are not cascaded.
                  </p>
                </div>
                <button
                  type="button"
                  className="status-modal-close"
                  onClick={closeModal}
                  disabled={loading}
                  aria-label="Close delete confirmation"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="delete-action-summary">
                <span>{label}</span>
                <strong>{title}</strong>
              </div>

              {error && <div className="status-modal-error">{error}</div>}

              <div className="status-modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="delete-confirm-button"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : `Delete ${label}`}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
