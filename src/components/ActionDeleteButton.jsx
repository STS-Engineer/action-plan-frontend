import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import { deleteAction } from "../redux/action/action";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const getForbiddenMessage = (error) => {
  const status = error?.response?.status;

  if (status === 403) {
    return "You can only delete actions you own or manage.";
  }

  return (
    error?.response?.data?.detail ||
    error?.message ||
    "Unable to delete action."
  );
};

export const ActionDeleteButton = ({
  action,
  currentUserEmail,
  viewMode = "my",
  onDeleted,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canShowDelete = useMemo(() => {
    const user = (() => {
      try {
        return JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        return {};
      }
    })();
    const role = String(user?.role || "").trim().toLowerCase();
    const email = normalizeEmail(currentUserEmail || user?.email);
    const ownerEmail = normalizeEmail(action?.email_responsable);
    const requesterEmail = normalizeEmail(action?.email_demandeur);

    return (
      role === "admin" ||
      role === "global" ||
      role === "superadmin" ||
      role === "super_admin" ||
      (email && email === ownerEmail) ||
      (email && email === requesterEmail) ||
      viewMode === "team"
    );
  }, [action?.email_demandeur, action?.email_responsable, currentUserEmail, viewMode]);

  if (!action?.id || !canShowDelete) {
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
      const result = await deleteAction(action.id);
      setConfirmOpen(false);
      await onDeleted?.(action, result);
    } catch (err) {
      setError(getForbiddenMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="delete-action-button"
        onClick={(event) => {
          event.stopPropagation();
          setConfirmOpen(true);
        }}
        title="Delete action"
        aria-label="Delete action"
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
              aria-labelledby="delete-action-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="status-modal-header">
                <div>
                  <h3 id="delete-action-title">Delete action?</h3>
                  <p>
                    This will remove the action from active views. History and attachments
                    will be kept for audit.
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
                <span>Action</span>
                <strong>{action.titre || `Action #${action.id}`}</strong>
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
                  {loading ? "Deleting..." : "Delete action"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
