import {
  AlertCircle,
  Ban,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Folder,
  FolderOpen,
  History,
  User,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { getSujetSousSujets } from '../redux/sujet/sujet';
import { getActions, updateActionStatus } from '../redux/action/action';
import { Link } from 'react-router';
import { getActionHomeStatusBucket } from '../utils/actionHomeStatus';
import { ActionHistoryModal } from './ActionHistoryModal';
import { ActionLatestHistoryCells } from './ActionLatestHistoryCells';
import { ActionDeleteButton } from './ActionDeleteButton';

const SUJET_LABELS = ['Topic', 'Subtopic', 'Sub-subtopic', 'Nested subtopic'];
const ACTION_LABELS = ['Action', 'Sub-action', 'Sub-sub-action', 'Nested action'];

const getLabel = (labels, depth) => labels[Math.min(depth, labels.length - 1)];

export const ItemCard = (props) => {
  const {
    item,
    type = 'sujet',
    depth = 0,
    sujetDepth = 0,
    actionDepth = 0,
    statusFilter = null,
    targetActionId = null,
    highlightActionId = null,
    forceExpandedSujetIds = [],
    onForceExpandConsumed = null,
    onActionDeleted = null,
    onActionStatusChanged = null,
    loggedUserEmail = null,
    viewMode = 'my',
  } = props;
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [loadedItemId, setLoadedItemId] = useState(null);
  const [localStatus, setLocalStatus] = useState(item.status);
  const [menuOpen, setMenuOpen] = useState(false);
  const [historyAction, setHistoryAction] = useState(null);

  const isSujet = type === 'sujet';
  const isAction = type === 'action';
  const effectiveTargetActionId = highlightActionId || targetActionId;
  const isTargetAction = isAction && String(item.id) === String(effectiveTargetActionId);
  const isForcedExpandedSujet = isSujet && forceExpandedSujetIds.some(
    (sujetId) => String(sujetId) === String(item.id)
  );

  const progressPercent =
    item.total_actions > 0
      ? Math.round((item.completed_actions / item.total_actions) * 100)
      : 0;

  const totalChildren = isSujet ? item.total_actions || 0 : 0;
  const priorityClass = isAction && item.priorite ? `priority-${item.priorite}` : '';
  const typeClass = isSujet ? 'is-sujet' : 'is-action';

  const fetchChildren = async (force = false) => {
    if (loading) return;
    if (!force && expanded && loadedItemId === item.id && children.length > 0) return;

    setLoading(true);
    setError(null);

    try {
      if (isSujet) {
        const [sousSujets, actions] = await Promise.all([
          getSujetSousSujets(dispatch, item.id, {
            email: loggedUserEmail,
            scope: viewMode,
            status: statusFilter,
          }),
          getActions(dispatch, item.id, {
            email: loggedUserEmail,
            scope: viewMode,
            status: statusFilter,
          }),
        ]);

        const mappedSousSujets = (sousSujets || []).map((s) => ({ ...s, itemType: 'sujet' }));
        const mappedActions = (actions || []).map((a) => ({ ...a, itemType: 'action' }));

        setChildren([...mappedSousSujets, ...mappedActions]);
      } else {
        setChildren([]);
      }

      setLoadedItemId(item.id);
    } catch (err) {
      setError(err?.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!expanded) {
      await fetchChildren();
      setExpanded(true);
      return;
    }
    setExpanded(false);
  };

  const sujetChildren = useMemo(
    () => children.filter((child) => child.itemType === 'sujet'),
    [children],
  );

  const actionChildren = useMemo(() => {
    return children.filter((child) => {
      if (child.itemType !== 'action') {
        return false;
      }

      const bucket = getActionHomeStatusBucket(child);

      if (!bucket) {
        return false;
      }

      if (statusFilter === 'blocked') {
        return String(child.status || '').trim().toLowerCase() === 'blocked';
      }

      if (statusFilter && bucket !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [children, statusFilter]);

  const onStatusChange = async (actionId, newStatus, options) => {
    const result = await updateActionStatus(dispatch, actionId, newStatus, options);

    if (!result) return;

    const updatedAction = result.action || {};
    const effectiveStatus = updatedAction.status || newStatus;

    if (item.id === actionId) {
      setLocalStatus(effectiveStatus);
    }

    const latestHistoryPatch = {
      last_status_comment: options?.comment || null,
      last_status_comment_by: options?.created_by || null,
      last_status_comment_at: new Date().toISOString(),
      ...(result.attachment
        ? {
            last_attachment_id: result.attachment.id,
            last_attachment_name: result.attachment.file_name,
            last_attachment_uploaded_by: result.attachment.uploaded_by,
            last_attachment_created_at: result.attachment.created_at,
          }
        : {}),
    };

    setChildren((prev) =>
      prev.map((child) =>
        child.id === actionId
          ? {
              ...child,
              ...updatedAction,
              status: effectiveStatus,
              closed_date: effectiveStatus === 'closed'
                ? (updatedAction.closed_date || new Date().toISOString())
                : null,
              ...latestHistoryPatch,
            }
          : child
      )
    );

    await onActionStatusChanged?.(updatedAction, {
      actionId,
      status: effectiveStatus,
      source: 'tree',
    });

    if (isSujet && expanded) {
      await fetchChildren(true);
    }
  };

  useEffect(() => {
    setLocalStatus(item.status);
  }, [item.status]);

  useEffect(() => {
    if (!isForcedExpandedSujet) return;

    if (expanded) {
      onForceExpandConsumed?.(item.id);
      return;
    }

    if (loading) return;

    const expandCreatedSujet = async () => {
      await fetchChildren();
      setExpanded(true);
      onForceExpandConsumed?.(item.id);
    };

    expandCreatedSujet();
  }, [isForcedExpandedSujet, expanded, loading, item.id, onForceExpandConsumed]);

  const openHistory = (action, event) => {
    event.stopPropagation();
    setHistoryAction(action);
  };

  const closeHistory = () => {
    setHistoryAction(null);
  };

  const handleActionDeleted = (deletedAction, result) => {
    const deletedIds = new Set(
      (result?.deleted_action_ids || [deletedAction.id]).map((id) => String(id))
    );

    setChildren((prev) =>
      prev.filter((child) => !deletedIds.has(String(child.id)))
    );
    onActionDeleted?.(deletedAction, result);
  };

  return (
    <>
    <div
      className={`item-card ${menuOpen ? 'item-card-menu-open' : ''} ${isTargetAction ? 'deep-linked-action-card' : ''}`}
      data-sujet-id={isSujet ? item.id : undefined}
      data-action-id={isAction ? item.id : undefined}
      style={{ marginLeft: `${depth * 20}px`, marginTop: '0.5rem' }}
    >
      <div className={`item-card-inner ${typeClass} ${priorityClass}`}>
        <div className="item-header" onClick={handleToggle}>
          <div className="item-header-content">
            <div className="item-left">
              <div className="item-icon-wrapper">
                {isSujet ? (
                  expanded ? (
                    <FolderOpen size={32} className="item-icon open" />
                  ) : (
                    <Folder size={32} className="item-icon" />
                  )
                ) : (
                  <FileText size={28} className="item-icon action" />
                )}

                {totalChildren > 0 && <div className="item-badge">{totalChildren}</div>}
              </div>

              <div className="item-info">
                {isSujet && (
                  <>
                    <h3 className="item-title">{item.titre}</h3>
                    {item.description && <p className="item-description">{item.description}</p>}
                  </>
                )}

                {isSujet && item.total_actions > 0 && (
                  <div>
                    <div className="item-stats">
                      <span className="stat-item green">
                        <CheckCircle2 size={16} />
                        {item.completed_actions} / {item.total_actions} completed
                      </span>

                      {item.overdue_actions > 0 && (
                        <span className="stat-item red">
                          <AlertCircle size={16} />
                          {item.overdue_actions} overdue
                        </span>
                      )}

                      {item.blocked_actions > 0 && (
                        <span className="stat-item blocked">
                          <Ban size={16} />
                          {item.blocked_actions} blocked
                        </span>
                      )}
                    </div>

                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}

                {isAction && (
                  <div className="action-title-container">
                    <div className="action-status-top" onClick={(e) => e.stopPropagation()}>
                      <StatusBadge
                        status={localStatus}
                        actionId={item.id}
                        onStatusChange={onStatusChange}
                        onMenuToggle={setMenuOpen}
                      />
                      <button
                        type="button"
                        className="history-button"
                        onClick={(event) => openHistory(item, event)}
                      >
                        <History size={14} />
                        History
                      </button>
                      <ActionDeleteButton
                        action={item}
                        currentUserEmail={loggedUserEmail}
                        viewMode={viewMode}
                        onDeleted={handleActionDeleted}
                      />
                    </div>
                    <span className="action-title">{item.titre}</span>

                    {item.description && <div className="action-desc">{item.description}</div>}

                    <div className="item-meta">
                      <div className="meta-item">
                        <User size={16} className="meta-icon user" />
                        <span>{item.responsable || '—'}</span>
                      </div>

                      <div className="meta-item">
                        <Calendar size={16} className="meta-icon calendar" />
                        <span>
                          {item.due_date
                            ? new Date(item.due_date).toLocaleDateString('en-GB')
                            : '—'}
                        </span>
                      </div>

                      {item.rm_stock_app && (
                        <div className="meta-item">
                          <Link
                            to="https://avocarbon-rm-stock.azurewebsites.net"
                            className={`status-badge ${localStatus?.toLowerCase() ?? 'open'}`}
                            target="_blank"
                          >
                            Raw material application
                          </Link>
                        </div>
                      )}
                      {item.corrective_action_app && (
                        <div className="meta-item">
                          <Link
                            to="https://avocarbon-customer-complaint.azurewebsites.net/complaints"
                            className={`status-badge ${localStatus?.toLowerCase() ?? 'open'}`}
                            target="_blank"
                          >
                            Corrective action application
                          </Link>
                        </div>
                      )}
                    </div>

                    {item.closed_date && localStatus === 'closed' && (
                      <div className="closed-date-info">
                        <Clock size={14} />
                        <span>
                          Closed on: {new Date(item.closed_date).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button className="item-toggle" aria-label={expanded ? 'Collapse' : 'Expand'}>
              {expanded ? <ChevronDown size={28} /> : <ChevronRight size={28} />}
            </button>
          </div>
        </div>

        {expanded && loading && (
          <div className="item-children">
            <p className="no-items">Loading…</p>
          </div>
        )}

        {expanded && error && !loading && (
          <div className="item-children">
            <p className="no-items">{error}</p>
          </div>
        )}

        {expanded && !loading && !error && children.length > 0 && (
          <div className="item-children">
            {sujetChildren.length > 0 && (
              <>
                <h5 className="children-title">
                  <ChevronRight size={16} />
                  {getLabel(SUJET_LABELS, sujetDepth + 1)} ({sujetChildren.length})
                </h5>
                <div className="nested-items">
                  {sujetChildren.map((child) => (
                    <ItemCard
                      key={`${child.itemType}-${child.id}`}
                      item={child}
                      type={child.itemType}
                      depth={0}
                      sujetDepth={sujetDepth + 1}
                      actionDepth={0}
                      statusFilter={statusFilter}
                      targetActionId={targetActionId}
                      highlightActionId={highlightActionId}
                      forceExpandedSujetIds={forceExpandedSujetIds}
                      onForceExpandConsumed={onForceExpandConsumed}
                      onActionDeleted={onActionDeleted}
                      onActionStatusChanged={onActionStatusChanged}
                      loggedUserEmail={loggedUserEmail}
                      viewMode={viewMode}
                      onStatusChange={onStatusChange}
                    />
                  ))}
                </div>
              </>
            )}

            {actionChildren.length > 0 && (
  <>
    <h5
      className="children-title"
      style={sujetChildren.length > 0 ? { marginTop: '1rem' } : {}}
    >
      <ChevronRight size={16} />
      {getLabel(ACTION_LABELS, actionDepth)} ({actionChildren.length})
    </h5>

    <div className="actions-table-wrapper">
      <table className="actions-table">
        <thead>
             <tr>
              <th>Priority</th>
              <th>Action</th>
              <th>Description</th>
              <th>Responsable</th>
              {viewMode === 'all' && <th>Requester</th>}
              <th>Due date</th>
              <th>Application</th>
              <th>Status</th>
              <th>Last comment</th>
              <th>Fichier joint</th>
              <th>History</th>
              <th>Delete</th>
</tr>
        </thead>

        <tbody>
          {actionChildren.map((child) => (
           <tr
            key={`${child.itemType}-${child.id}`}
            data-action-id={child.id}
            className={String(child.id) === String(effectiveTargetActionId) ? 'deep-linked-action-row' : ''}
           >
  <td>
    <span className="priority-pill">
      {child.priority_index ?? child.priorite ?? '—'}
    </span>
  </td>
  <td className="action-table-title">
    {child.titre || '—'}
  </td>

  <td>{child.description || '—'}</td>

  <td>{child.responsable || '—'}</td>

  {viewMode === 'all' && (
    <td>
      <div className="person-cell">
        <strong>{child.demandeur || '—'}</strong>
        <span>{child.email_demandeur || ''}</span>
      </div>
    </td>
  )}

  <td>
    {child.due_date
      ? new Date(child.due_date).toLocaleDateString('en-GB')
      : '—'}
  </td>

  <td>
    {child.rm_stock_app && (
      <Link
        to="https://avocarbon-rm-stock.azurewebsites.net"
        className={`status-badge ${child.status?.toLowerCase() ?? 'open'}`}
        target="_blank"
      >
        Raw material
      </Link>
    )}

    {child.corrective_action_app && (
      <Link
        to="https://avocarbon-customer-complaint.azurewebsites.net/complaints"
        className={`status-badge ${child.status?.toLowerCase() ?? 'open'}`}
        target="_blank"
      >
        Corrective action
      </Link>
    )}

    {!child.rm_stock_app && !child.corrective_action_app && '—'}
  </td>

  <td>
    <StatusBadge
      status={child.status}
      actionId={child.id}
      onStatusChange={onStatusChange}
      onMenuToggle={setMenuOpen}
    />
  </td>
  <ActionLatestHistoryCells action={child} />
  <td className="history-cell">
    <button
      type="button"
      className="history-button"
      onClick={(event) => openHistory(child, event)}
    >
      <History size={14} />
      History
    </button>
  </td>
  <td className="history-cell">
    <ActionDeleteButton
      action={child}
      currentUserEmail={loggedUserEmail}
      viewMode={viewMode}
      onDeleted={handleActionDeleted}
    />
  </td>
</tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)}
          </div>
        )}

        {expanded && !loading && !error && children.length === 0 && (
          <div className="item-children">
            <p className="no-items">{isSujet ? 'No content' : 'No sub-actions'}</p>
          </div>
        )}
      </div>
    </div>
    {historyAction && (
      <ActionHistoryModal
        actionId={historyAction.id}
        actionTitle={historyAction.titre}
        onClose={closeHistory}
      />
    )}
    </>
  );
};
