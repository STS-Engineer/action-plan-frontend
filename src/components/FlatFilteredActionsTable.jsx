import { History } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { ActionLatestHistoryCells } from "./ActionLatestHistoryCells";
import { getActionHomeStatusBucket } from "../utils/actionHomeStatus";
import { ActionDeleteButton } from "./ActionDeleteButton";

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-GB");
};

const normalizeStatus = (value) => String(value || "").trim().toLowerCase();

export const getFlatActionCanonicalStatus = (action) => {
  const backendCanonicalStatus = normalizeStatus(action?.canonical_status);

  if (backendCanonicalStatus) {
    return backendCanonicalStatus;
  }

  const computedHomeBucket = getActionHomeStatusBucket(action);
  const homeBucket = normalizeStatus(action?.status_bucket) || computedHomeBucket;

  if (!homeBucket) {
    return null;
  }

  if (homeBucket === "overdue" || homeBucket === "closed") {
    return homeBucket;
  }

  const rawStatus = normalizeStatus(action?.status);

  if (rawStatus === "open" || rawStatus === "blocked") {
    return rawStatus;
  }

  return homeBucket || rawStatus || "open";
};

export const actionMatchesFlatKpiFilter = (action, filter) => {
  if (!filter) {
    return true;
  }

  const canonicalStatus = getFlatActionCanonicalStatus(action);

  if (filter === "overdue") {
    return canonicalStatus === "overdue";
  }

  if (filter === "closed") {
    return canonicalStatus === "closed";
  }

  if (filter === "in_progress") {
    return canonicalStatus === "open" || canonicalStatus === "blocked";
  }

  return true;
};

export const FlatFilteredActionsTable = ({
  actions,
  loading,
  error,
  filter,
  onOpenHistory,
  onStatusChange,
  onActionDeleted,
  currentUserEmail,
  viewMode,
}) => {
  const visibleActions = (actions || []).filter((action) =>
    actionMatchesFlatKpiFilter(action, filter)
  );

  if (loading) {
    return <p className="loading-text">Loading actions...</p>;
  }

  if (error) {
    return <div className="status-modal-error">{error}</div>;
  }

  if (visibleActions.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-text">No actions found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="actions-table-wrapper flat-actions-table-wrapper">
      <table className="actions-table flat-actions-table">
        <thead>
          <tr>
            <th>Priority</th>
            <th>Topic / Sujet</th>
            <th>Action title</th>
            <th>Description</th>
            <th>Responsible</th>
            <th>Due date</th>
            <th>Status</th>
            <th>Last comment</th>
            <th>Fichier joint</th>
            <th>History</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {visibleActions.map((action) => (
            <tr key={action.id}>
              <td>
                <span className="priority-pill">
                  {action.priority_index ?? action.priorite ?? "-"}
                </span>
              </td>
              <td className="topic-path-cell">
                {action.topic_path ||
                  action.sujet_title ||
                  action.root_sujet_title ||
                  "-"}
              </td>
              <td className="action-table-title">{action.titre || "-"}</td>
              <td>{action.description || "-"}</td>
              <td>{action.responsable || "-"}</td>
              <td>{formatDate(action.due_date)}</td>
              <td>
                <StatusBadge
                  status={getFlatActionCanonicalStatus(action)}
                  actionId={action.id}
                  onMenuToggle={() => {}}
                  onStatusChange={onStatusChange}
                />
              </td>
              <ActionLatestHistoryCells action={action} />
              <td className="history-cell">
                <button
                  type="button"
                  className="history-button"
                  onClick={() => onOpenHistory(action)}
                >
                  <History size={14} />
                  History
                </button>
              </td>
              <td className="history-cell">
                <ActionDeleteButton
                  action={action}
                  currentUserEmail={currentUserEmail}
                  viewMode={viewMode}
                  onDeleted={onActionDeleted}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
