import { Edit2, X, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const StatusBadge = ({ status, onStatusChange, actionId, onMenuToggle }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [comment, setComment] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [menuPosition, setMenuPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

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

  useEffect(() => {
    if (!showModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.classList.add("status-modal-open");
    document.body.style.overflow = "hidden";

    return () => {
      document.body.classList.remove("status-modal-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [showModal]);

  const closeMenu = useCallback(() => {
    setShowMenu(false);
    setMenuPosition(null);
    onMenuToggle?.(false);
  }, [onMenuToggle]);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = menuRef.current?.offsetWidth || 150;
    const menuHeight = menuRef.current?.offsetHeight || 160;
    const viewportPadding = 8;
    const gap = 8;
    const hasSpaceBelow = rect.bottom + gap + menuHeight <= window.innerHeight - viewportPadding;
    const top = hasSpaceBelow
      ? rect.bottom + gap
      : Math.max(viewportPadding, rect.top - menuHeight - gap);
    const maxLeft = window.innerWidth - menuWidth - viewportPadding;
    const left = Math.max(
      viewportPadding,
      Math.min(rect.left, maxLeft)
    );

    setMenuPosition({
      top,
      left,
      minWidth: Math.max(rect.width, 142),
    });
  }, []);

  useEffect(() => {
    if (!showMenu) return;

    updateMenuPosition();

    const handlePointerDown = (event) => {
      const target = event.target;

      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      closeMenu();
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [closeMenu, showMenu, updateMenuPosition]);

  const handleStatusClick = (e) => {
    e.stopPropagation();

    if (showMenu) {
      closeMenu();
      return;
    }

    setShowMenu(true);
    onMenuToggle?.(true);
  };

  const openModal = (newStatus, e) => {
    e.stopPropagation();
    setSelectedStatus(newStatus);
    closeMenu();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedStatus("");
    setComment("");
    setFile(null);
    setSaving(false);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStatus) return;

    try {
      setSaving(true);
      setError("");

      if (onStatusChange) {
        await onStatusChange(actionId, selectedStatus, {
          comment,
          created_by: loggedUser?.email || null,
          file,
        });
      }

      closeModal();
    } catch (err) {
      setError(err?.message || "Unable to save status change.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="status-dropdown" onClick={(e) => e.stopPropagation()}>
      <span
        ref={triggerRef}
        className={`status-badge ${config.className}`}
        onClick={handleStatusClick}
      >
        <Edit2 size={12} />
        {config.text}
      </span>

      {showMenu && createPortal(
        <div
          ref={menuRef}
          className="status-menu status-menu-portal"
          style={{
            top: menuPosition?.top ?? -9999,
            left: menuPosition?.left ?? -9999,
            minWidth: menuPosition?.minWidth,
          }}
        >
          <div className="status-option" onClick={(e) => openModal("open", e)}>Open</div>
          <div className="status-option" onClick={(e) => openModal("closed", e)}>Closed</div>
          <div className="status-option" onClick={(e) => openModal("blocked", e)}>Blocked</div>
          <div className="status-option" onClick={(e) => openModal("overdue", e)}>Overdue</div>
        </div>,
        document.body
      )}

      {showModal && createPortal(
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

            {error && (
              <div className="status-modal-error">
                {error}
              </div>
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
        </div>,
        document.body
      )}
    </div>
  );
};
