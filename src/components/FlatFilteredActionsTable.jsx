import { History } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { ActionLatestHistoryCells } from "./ActionLatestHistoryCells";
import { getActionHomeStatusBucket } from "../utils/actionHomeStatus";
import { ActionDeleteButton } from "./ActionDeleteButton";
import {
  ActionTableFilterControl,
  createEmptyActionColumnFilters,
  filterActionsByColumnFilters,
  hasActiveActionColumnFilters,
} from "./ActionTableFilters";

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

  if (filter === "blocked") {
    return canonicalStatus === "blocked";
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
  showRequester = false,
  onVisibleCountChange,
}) => {
  const [columnFilters, setColumnFilters] = useState(createEmptyActionColumnFilters);
  const kpiMatchedActions = useMemo(
    () => (actions || []).filter((action) => actionMatchesFlatKpiFilter(action, filter)),
    [actions, filter]
  );
  const visibleActions = useMemo(
    () => filterActionsByColumnFilters(kpiMatchedActions, columnFilters),
    [kpiMatchedActions, columnFilters]
  );
  const updateColumnFilter = (field, value) => {
    setColumnFilters((current) => ({ ...current, [field]: value }));
  };
  const clearColumnFilters = () => setColumnFilters(createEmptyActionColumnFilters());

  useEffect(() => {
    onVisibleCountChange?.(visibleActions.length);
  }, [visibleActions.length]);

  if (loading) {
    return <p className="loading-text">Loading actions...</p>;
  }

  if (error) {
    return <div className="status-modal-error">{error}</div>;
  }

  if (kpiMatchedActions.length === 0) {
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
            <th className="description-column">Description</th>
            <th>Responsible</th>
            {showRequester && <th>Requester</th>}
            <th>Due date</th>
            <th>Status</th>
            <th>Urgency</th>
            <th>Importance</th>
            <th>Last comment</th>
            <th>Fichier joint</th>
            <th>History</th>
            <th>Delete</th>
          </tr>
          <tr className="action-table-filter-row">
            <th>
              <ActionTableFilterControl
                field="priority_index"
                filters={columnFilters}
                onChange={updateColumnFilter}
                placeholder="#"
              />
            </th>
            <th />
            <th />
            <th className="description-column" />
            <th>
              <ActionTableFilterControl
                field="responsable"
                filters={columnFilters}
                onChange={updateColumnFilter}
                placeholder="Responsible"
              />
            </th>
            {showRequester && (
              <th>
                <ActionTableFilterControl
                  field="demandeur"
                  filters={columnFilters}
                  onChange={updateColumnFilter}
                  placeholder="Requester"
                />
              </th>
            )}
            <th>
              <ActionTableFilterControl
                field="due_date"
                filters={columnFilters}
                onChange={updateColumnFilter}
              />
            </th>
            <th>
              <ActionTableFilterControl
                field="status"
                filters={columnFilters}
                onChange={updateColumnFilter}
              />
            </th>
            <th>
              <ActionTableFilterControl
                field="urgency"
                filters={columnFilters}
                onChange={updateColumnFilter}
              />
            </th>
            <th>
              <ActionTableFilterControl
                field="importance"
                filters={columnFilters}
                onChange={updateColumnFilter}
              />
            </th>
            <th />
            <th />
            <th />
            <th>
              {hasActiveActionColumnFilters(columnFilters) && (
                <button type="button" className="table-filter-clear" onClick={clearColumnFilters}>
                  Clear
                </button>
              )}
            </th>
          </tr>
        </thead>

        <tbody>
          {visibleActions.length === 0 && (
            <tr>
              <td colSpan={showRequester ? 14 : 13} className="empty-filter-row">
                No actions match these column filters.
              </td>
            </tr>
          )}
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
              <td className="description-column">
                <span className="table-description-text" title={action.description || ""}>
                  {action.description || "-"}
                </span>
              </td>
              <td>{action.responsable || "-"}</td>
              {showRequester && (
                <td>
                  <div className="person-cell">
                    <strong>{action.demandeur || "-"}</strong>
                    <span>{action.email_demandeur || ""}</span>
                  </div>
                </td>
              )}
              <td>{formatDate(action.due_date)}</td>
              <td>
                <StatusBadge
                  status={getFlatActionCanonicalStatus(action)}
                  actionId={action.id}
                  onMenuToggle={() => {}}
                  onStatusChange={onStatusChange}
                />
              </td>
              <td>{action.urgency || "-"}</td>
              <td>{action.importance || "-"}</td>
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
