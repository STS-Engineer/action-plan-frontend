import { AlertCircle, Download, FileText, History, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getActionAttachmentDownloadUrl,
  getActionAttachments,
  getActionStatusComments,
} from "../redux/action/action";
import "./ActionHistoryModal.css";

const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatStatus = (value) => {
  if (!value) return "-";

  return String(value).replace(/_/g, " ");
};

export const ActionHistoryModal = ({ actionId, actionTitle, onClose }) => {
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const [statusComments, actionAttachments] = await Promise.all([
          getActionStatusComments(actionId),
          getActionAttachments(actionId),
        ]);

        if (!isMounted) return;

        setComments(statusComments || []);
        setAttachments(actionAttachments || []);
      } catch {
        if (!isMounted) return;

        setError("Unable to load action history. Please try again.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, [actionId]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="history-modal-overlay" onClick={onClose}>
      <section
        className="history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="history-modal-header">
          <div className="history-modal-title-group">
            <div className="history-modal-icon">
              <History size={22} />
            </div>
            <div>
              <h3 id="history-modal-title">Action history</h3>
              <p>{actionTitle || `Action #${actionId}`}</p>
            </div>
          </div>

          <button
            type="button"
            className="history-modal-close"
            onClick={onClose}
            aria-label="Close history modal"
          >
            <X size={20} />
          </button>
        </header>

        {loading && (
          <div className="history-modal-loading">
            <div className="history-modal-spinner" />
            <span>Loading history...</span>
          </div>
        )}

        {!loading && error && (
          <div className="history-modal-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && (
          <div className="history-modal-body">
            <section className="history-section">
              <div className="history-section-heading">
                <History size={18} />
                <h4>Status changes</h4>
              </div>

              {comments.length > 0 ? (
                <div className="history-timeline">
                  {comments.map((entry) => (
                    <article className="history-timeline-item" key={entry.id}>
                      <div className="history-timeline-marker" />
                      <div className="history-timeline-content">
                        <div className="history-status-line">
                          <span>{formatStatus(entry.old_status)}</span>
                          <span className="history-status-arrow" aria-hidden="true">
                            &rarr;
                          </span>
                          <span>{formatStatus(entry.new_status)}</span>
                        </div>

                        {entry.comment ? (
                          <p className="history-comment">{entry.comment}</p>
                        ) : (
                          <p className="history-comment is-empty">No comment provided.</p>
                        )}

                        <div className="history-meta">
                          <span>{entry.created_by || "Unknown user"}</span>
                          <span>{formatDateTime(entry.created_at)}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="history-empty">No status history yet</p>
              )}
            </section>

            <section className="history-section">
              <div className="history-section-heading">
                <FileText size={18} />
                <h4>Attachments</h4>
              </div>

              {attachments.length > 0 ? (
                <div className="history-attachments">
                  {attachments.map((attachment) => (
                    <article className="history-attachment" key={attachment.id}>
                      <div className="history-attachment-icon">
                        <FileText size={20} />
                      </div>

                      <div className="history-attachment-info">
                        <strong>{attachment.file_name}</strong>
                        <span>
                          {attachment.uploaded_by || "Unknown user"} -{" "}
                          {formatDateTime(attachment.created_at)}
                        </span>
                      </div>

                      <a
                        className="history-download-link"
                        href={getActionAttachmentDownloadUrl(attachment.id)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Download size={16} />
                        Download
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="history-empty">No attachments yet</p>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
};
