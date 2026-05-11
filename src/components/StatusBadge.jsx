import { Edit2, X, Upload } from "lucide-react";
import { useState } from "react";

export const StatusBadge = ({ status, onStatusChange, actionId, onMenuToggle }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const statusConfig = {
    blocked: { text: "Blocked", className: "blocked" },
    closed: { text: "Closed", className: "closed" },
    open: { text: "Open", className: "open" },
    overdue: { text: "Overdue", className: "overdue" },
    late: { text: "Late", className: "overdue" },
    in_progress: { text: "In progress", className: "open" },
  };

  const normalizedStatus = status ? status.toLowerCase() : "open";
  const config = statusConfig[normalizedStatus] || statusConfig.open;

  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const handleStatusClick = (e) => {
    e.stopPropagation();
    const next = !showMenu;
    setShowMenu(next);
    onMenuToggle?.(next);
  };

  const openModal = (newStatus, e) => {
    e.stopPropagation();
    setSelectedStatus(newStatus);
    setShowMenu(false);
    onMenuToggle?.(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStatus("");
    setComment("");
    setFile(null);
    setSaving(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStatus) return;

    try {
      setSaving(true);

      if (onStatusChange) {
        await onStatusChange(actionId, selectedStatus, {
          comment,
          created_by: loggedUser?.email || null,
          file,
        });
      }

      closeModal();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="status-dropdown" onClick={(e) => e.stopPropagation()}>
      <span className={`status-badge ${config.className}`} onClick={handleStatusClick}>
        <Edit2 size={12} />
        {config.text}
      </span>

      {showMenu && (
        <div className="status-menu">
          <div className="status-option" onClick={(e) => openModal("open", e)}>Open</div>
          <div className="status-option" onClick={(e) => openModal("closed", e)}>Closed</div>
          <div className="status-option" onClick={(e) => openModal("blocked", e)}>Blocked</div>
          <div className="status-option" onClick={(e) => openModal("overdue", e)}>Overdue</div>
        </div>
      )}

      {showModal && (
        <div className="status-modal-overlay" onClick={closeModal}>
          <form className="status-modal" onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
            <div className="status-modal-header">
              <div>
                <h3>Update action status</h3>
                <p>New status: <strong>{selectedStatus}</strong></p>
              </div>

              <button type="button" className="status-modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <label>Comment</label>
            <textarea
              placeholder="Add a comment about this status change..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />

            <label>Attachment optional</label>
            <div className="status-file-box">
              <Upload size={18} />
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {file && (
              <p className="selected-file">
                Selected file: <strong>{file.name}</strong>
              </p>
            )}

            <div className="status-modal-actions">
              <button type="button" className="cancel-button" onClick={closeModal}>
                Cancel
              </button>

              <button type="submit" className="save-button" disabled={saving}>
                {saving ? "Saving..." : "Save status"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};