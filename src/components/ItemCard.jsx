import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileText,
  Folder,
  FolderOpen,
  User,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from './StatusBadge';
import { getSujetSousSujets } from '../redux/sujet/sujet';
import { getActions, updateActionStatus } from '../redux/action/action';
import { Link } from 'react-router';

const SUJET_LABELS = ['Topic', 'Subtopic', 'Sub-subtopic', 'Nested subtopic'];
const ACTION_LABELS = ['Action', 'Sub-action', 'Sub-sub-action', 'Nested action'];

const getLabel = (labels, depth) => labels[Math.min(depth, labels.length - 1)];

export const ItemCard = ({
  item,
  type = 'sujet',
  depth = 0,
  sujetDepth = 0,
  actionDepth = 0
}) => {
  const dispatch = useDispatch();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState([]);
  const [error, setError] = useState(null);
  const [loadedItemId, setLoadedItemId] = useState(null);
  const [localStatus, setLocalStatus] = useState(item.status);
  const [menuOpen, setMenuOpen] = useState(false);

  const isSujet = type === 'sujet';
  const isAction = type === 'action';

  const progressPercent =
    item.total_actions > 0
      ? Math.round((item.completed_actions / item.total_actions) * 100)
      : 0;

  const totalChildren = isSujet ? item.total_actions || 0 : 0;
  const priorityClass = isAction && item.priorite ? `priority-${item.priorite}` : '';
  const typeClass = isSujet ? 'is-sujet' : 'is-action';

  const fetchChildren = async () => {
    if (loading) return;
    if (expanded && loadedItemId === item.id && children.length > 0) return;

    setLoading(true);
    setError(null);

    try {
      if (isSujet) {
        const [sousSujets, actions] = await Promise.all([
          getSujetSousSujets(dispatch, item.id),
          getActions(dispatch, item.id),
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

  const actionChildren = useMemo(
    () => children.filter((child) => child.itemType === 'action'),
    [children],
  );

  const onStatusChange = async (actionId, newStatus) => {
    const success = await updateActionStatus(dispatch, actionId, newStatus);

    if (!success) return;

    if (item.id === actionId) {
      setLocalStatus(newStatus);
    }

    setChildren((prev) =>
      prev.map((child) =>
        child.id === actionId
          ? {
              ...child,
              status: newStatus,
              closed_date: newStatus === 'closed' ? new Date().toISOString() : null,
            }
          : child
      )
    );
  };

  useEffect(() => {
    setLocalStatus(item.status);
  }, [item.status]);

  return (
    <div className={`item-card ${menuOpen ? 'item-card-menu-open' : ''}`} style={{ marginLeft: `${depth * 20}px` }}>
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
                <div className="nested-items">
                  {actionChildren.map((child) => (
                    <ItemCard
                      key={`${child.itemType}-${child.id}`}
                      item={child}
                      type={child.itemType}
                      depth={0}
                      sujetDepth={sujetDepth}
                      actionDepth={actionDepth + 1}
                      onStatusChange={onStatusChange}
                    />
                  ))}
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
  );
};