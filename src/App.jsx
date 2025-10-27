import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, CheckCircle2, Clock, AlertCircle, Calendar, User, FileText, Search, Edit2, Save, X } from 'lucide-react';

const API_URL = 'https://ap-back.azurewebsites.net/api';

const styles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .app-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #f0f4f8 0%, #e6f0f5 50%, #f5f7fa 100%);
  }

  .header-top {
    background: linear-gradient(135deg, #006ba6 0%, #0080c8 100%);
    padding: 1rem 0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo-section {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .logo {
    height: 60px;
    width: auto;
    background: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
  }

  .header-title {
    color: white;
  }

  .header-title h1 {
    font-size: 1.875rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }

  .header-title p {
    font-size: 0.875rem;
    opacity: 0.9;
  }

  .container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  .search-section {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .search-wrapper {
    position: relative;
    max-width: 600px;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #6b7280;
  }

  .search-input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 3rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: all 0.3s;
  }

  .search-input:focus {
    outline: none;
    border-color: #006ba6;
    box-shadow: 0 0 0 3px rgba(0, 107, 166, 0.1);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    color: white;
    transition: transform 0.3s;
  }

  .stat-card:hover {
    transform: translateY(-4px);
  }

  .stat-card-blue {
    background: linear-gradient(135deg, #006ba6, #0080c8);
  }

  .stat-card-green {
    background: linear-gradient(135deg, #059669, #10b981);
  }

  .stat-card-orange {
    background: linear-gradient(135deg, #ea580c, #f97316);
  }

  .stat-card-red {
    background: linear-gradient(135deg, #dc2626, #ef4444);
  }

  .stat-card-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stat-label {
    font-size: 0.875rem;
    font-weight: 600;
    opacity: 0.9;
  }

  .stat-value {
    font-size: 2.25rem;
    font-weight: 900;
  }

  .stat-icon {
    opacity: 0.5;
  }

  .main-content {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .main-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .main-title-icon {
    color: #006ba6;
  }

  .main-title-count {
    font-size: 1rem;
    font-weight: 400;
    color: #6b7280;
  }

  .item-card {
    margin-bottom: 1rem;
  }

  .item-card-inner {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    border-left: 4px solid;
    transition: all 0.3s;
  }

  .item-card-inner:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    transform: translateX(4px);
  }

  .item-card-inner.is-topic {
    border-left-color: #006ba6;
  }

  .item-card-inner.is-action {
    border-left-color: #10b981;
  }

  .item-card-inner.priority-1 {
    border-left-color: #dc2626;
  }

  .item-card-inner.priority-2 {
    border-left-color: #ea580c;
  }

  .item-card-inner.priority-3 {
    border-left-color: #f59e0b;
  }

  .item-card-inner.priority-4 {
    border-left-color: #006ba6;
  }

  .item-card-inner.priority-5 {
    border-left-color: #6b7280;
  }

  .item-header {
    padding: 1.5rem;
    cursor: pointer;
    transition: background 0.3s;
  }

  .item-header:hover {
    background: #f9fafb;
  }

  .item-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .item-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .item-icon-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .item-icon {
    color: #006ba6;
  }

  .item-icon.open {
    color: #0080c8;
  }

  .item-icon.action {
    color: #10b981;
  }

  .item-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: linear-gradient(135deg, #006ba6, #0080c8);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 9999px;
    min-width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .item-info {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-size: 1.125rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
    transition: color 0.3s;
  }

  .item-header:hover .item-title {
    color: #006ba6;
  }

  .item-description {
    color: #4b5563;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
    max-height: 80px;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .item-description::-webkit-scrollbar {
    width: 6px;
  }

  .item-description::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .item-description::-webkit-scrollbar-thumb {
    background: #006ba6;
    border-radius: 3px;
  }

  .item-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    color: #374151;
  }

  .meta-icon.user {
    color: #006ba6;
  }

  .meta-icon.calendar {
    color: #10b981;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.875rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    transition: all 0.2s;
  }

  .status-badge:hover {
    transform: scale(1.05);
  }

  .status-badge.blocked {
    background: #dc2626;
  }

  .status-badge.closed {
    background: #374151;
  }

  .status-badge.open {
    background: #006ba6;
  }

  .status-badge.overdue {
    background: #ea580c;
  }

  .status-dropdown {
    position: relative;
    display: inline-block;
  }

  .status-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 0.5rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    min-width: 150px;
    z-index: 1000;
    overflow: hidden;
  }

  .status-option {
    padding: 0.75rem 1rem;
    cursor: pointer;
    transition: background 0.2s;
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .status-option:hover {
    background: #f3f4f6;
  }

  .item-stats {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-weight: 600;
  }

  .stat-item.green {
    color: #10b981;
  }

  .stat-item.red {
    color: #ef4444;
  }

  .progress-bar {
    width: 100%;
    background: #e5e7eb;
    border-radius: 9999px;
    height: 10px;
    overflow: hidden;
    margin-top: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 9999px;
    transition: width 0.5s;
  }

  .item-toggle {
    color: #006ba6;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .item-toggle:hover {
    transform: scale(1.2);
  }

  .item-children {
    background: #f9fafb;
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .children-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: #006ba6;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nested-items {
    margin-left: 1.5rem;
  }

  /* Styles for actions table */
  .actions-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .actions-table th {
    background: #f8fafc;
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    color: #374151;
    border-bottom: 2px solid #e5e7eb;
    font-size: 0.875rem;
  }

  .actions-table td {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }

  .actions-table tr:hover {
    background: #f9fafb;
  }

  .action-title-container {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .action-title {
    font-weight: 700;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .action-desc {
    color: #6b7280;
    font-size: 0.875rem;
    max-height: 60px;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  .action-desc::-webkit-scrollbar {
    width: 4px;
  }

  .action-desc::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }

  .action-desc::-webkit-scrollbar-thumb {
    background: #006ba6;
    border-radius: 2px;
  }

  .closed-date-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    color: #6b7280;
    margin-top: 0.5rem;
    padding: 0.25rem 0.5rem;
    background: #f3f4f6;
    border-radius: 0.25rem;
  }

  .loading-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #f0f4f8 0%, #e6f0f5 50%, #f5f7fa 100%);
  }

  .loading-content {
    text-align: center;
  }

  .spinner {
    display: inline-block;
    width: 64px;
    height: 64px;
    border: 4px solid rgba(0, 107, 166, 0.1);
    border-top-color: #006ba6;
    border-bottom-color: #006ba6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .loading-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
  }

  .error-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #fee2e2, #fce7f3);
    padding: 1rem;
  }

  .error-card {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    padding: 2rem;
    max-width: 28rem;
  }

  .error-icon {
    color: #ef4444;
    margin: 0 auto 1rem;
    display: block;
  }

  .error-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.5rem;
    text-align: center;
  }

  .error-message {
    color: #4b5563;
    text-align: center;
    margin-bottom: 1rem;
  }

  .retry-button {
    margin-top: 1rem;
    width: 100%;
    background: linear-gradient(135deg, #006ba6, #0080c8);
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
  }

  .retry-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 107, 166, 0.3);
  }

  .empty-state {
    text-align: center;
    padding: 4rem 0;
  }

  .empty-icon {
    color: #d1d5db;
    margin: 0 auto 1rem;
  }

  .empty-text {
    color: #6b7280;
    font-size: 1.125rem;
  }

  .no-items {
    color: #6b7280;
    text-align: center;
    padding: 2rem 0;
    font-style: italic;
  }

  @keyframes spin { 
    to { transform: rotate(360deg); } 
  }

  @media (max-width: 1024px) {
    .actions-table {
      font-size: 0.875rem;
    }
    
    .actions-table th,
    .actions-table td {
      padding: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .actions-table-container {
      overflow-x: auto;
    }
    
    .actions-table {
      min-width: 800px;
    }
  }
`;

const StatusBadge = ({ status, onStatusChange, actionId }) => {
  const [showMenu, setShowMenu] = useState(false);
  
  const statusConfig = {
    blocked: { text: 'Blocked', className: 'blocked' },
    closed: { text: 'Closed', className: 'closed' },
    open: { text: 'Open', className: 'open' },
    overdue: { text: 'Overdue', className: 'overdue' },
  };
  
  const normalizedStatus = status ? status.toLowerCase() : 'open';
  const config = statusConfig[normalizedStatus] || statusConfig.open;
  
  const handleStatusClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleStatusSelect = async (newStatus, e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (onStatusChange) {
      await onStatusChange(actionId, newStatus);
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
          <div className="status-option" onClick={(e) => handleStatusSelect('open', e)}>
            Open
          </div>
          <div className="status-option" onClick={(e) => handleStatusSelect('closed', e)}>
            Closed
          </div>
          <div className="status-option" onClick={(e) => handleStatusSelect('blocked', e)}>
            Blocked
          </div>
          <div className="status-option" onClick={(e) => handleStatusSelect('overdue', e)}>
            Overdue
          </div>
        </div>
      )}
    </div>
  );
};

const ActionsTable = ({ actions, onStatusChange }) => {
  if (!actions || actions.length === 0) {
    return <p className="no-items">No actions found</p>;
  }

  return (
    <div className="actions-table-container">
      <table className="actions-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Responsible</th>
            <th>Due Date</th>
            <th>Closed Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((action) => (
            <tr key={action.id}>
              <td>
                <div className="action-title-container">
                  <span className="action-title">{action.title}</span>
                  {action.description && (
                    <div className="action-desc">{action.description}</div>
                  )}
                </div>
              </td>
              <td>
                <div className="meta-item">
                  <User size={16} className="meta-icon user" />
                  <span>{action.responsible || '—'}</span>
                </div>
              </td>
              <td>
                <div className="meta-item">
                  <Calendar size={16} className="meta-icon calendar" />
                  <span>
                    {action.due_date
                      ? new Date(action.due_date).toLocaleDateString('en-US')
                      : '—'}
                  </span>
                </div>
              </td>
              <td>
                <div className="meta-item">
                  <Calendar size={16} className="meta-icon calendar" />
                  <span>
                    {action.closed_date
                      ? new Date(action.closed_date).toLocaleDateString('en-US')
                      : '—'}
                  </span>
                </div>
              </td>
              <td>
                <StatusBadge 
                  status={action.status} 
                  actionId={action.id}
                  onStatusChange={onStatusChange}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ItemCard = ({ item, type = 'topic', depth = 0, topicDepth = 0, actionDepth = 0, onStatusChange, refreshData }) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  const isTopic = type === 'topic';
  const isAction = type === 'action';

  const fetchChildren = async () => {
    if (loading || children.length > 0) return;
    setLoading(true);
    
    try {
      if (isTopic) {
        const [subTopicsRes, actionsRes] = await Promise.all([
          fetch(`${API_URL}/topics/${item.id}/sub-topics`),
          fetch(`${API_URL}/topics/${item.id}/actions`)
        ]);
        const subTopics = await subTopicsRes.json();
        const actions = await actionsRes.json();
        
        const allChildren = [
          ...subTopics.map(s => ({ ...s, itemType: 'topic' })),
          ...actions.map(a => ({ ...a, itemType: 'action' }))
        ];
        setChildren(allChildren);
      } else if (isAction) {
        const response = await fetch(`${API_URL}/actions/${item.id}/sub-actions`);
        const subActions = await response.json();
        setChildren(subActions.map(sa => ({ ...sa, itemType: 'action' })));
      }
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleToggle = () => {
    if (!expanded) {
      fetchChildren();
    }
    setExpanded(!expanded);
  };

  const progressPercent = item.total_actions > 0
    ? Math.round((item.completed_actions / item.total_actions) * 100)
    : 0;

  const totalChildren = isTopic ? (item.total_actions || 0) : 0;
  const priorityClass = isAction && item.priority ? `priority-${item.priority}` : '';
  const typeClass = isTopic ? 'is-topic' : 'is-action';

  const getTopicLabel = (depth) => {
    const labels = ['Topic', 'Sub-topic', 'Sub-sub-topic', 'Sub-sub-sub-topic'];
    return labels[Math.min(depth, labels.length - 1)];
  };

  const getActionLabel = (depth) => {
    const labels = ['Action', 'Sub-action', 'Sub-sub-action', 'Sub-sub-sub-action'];
    return labels[Math.min(depth, labels.length - 1)];
  };

  const topicChildren = children.filter(c => c.itemType === 'topic');
  const actionChildren = children.filter(c => c.itemType === 'action');

  return (
    <div className="item-card" style={{ marginLeft: `${depth * 20}px` }}>
      <div className={`item-card-inner ${typeClass} ${priorityClass}`}>
        <div className="item-header" onClick={handleToggle}>
          <div className="item-header-content">
            <div className="item-left">
              <div className="item-icon-wrapper">
                {isTopic ? (
                  expanded ? (
                    <FolderOpen size={32} className="item-icon open" />
                  ) : (
                    <Folder size={32} className="item-icon" />
                  )
                ) : (
                  <FileText size={28} className="item-icon action" />
                )}
                {totalChildren > 0 && (
                  <div className="item-badge">{totalChildren}</div>
                )}
              </div>
              
              <div className="item-info">
                {isTopic && (
                  <>
                    <h3 className="item-title">{item.title}</h3>
                    {item.description && (
                      <p className="item-description">{item.description}</p>
                    )}
                  </>
                )}

                {isTopic && item.total_actions > 0 && (
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
                    <span className="action-title">{item.title}</span>
                    {item.description && (
                      <div className="action-desc">{item.description}</div>
                    )}
                    <div className="item-meta">
                      <div className="meta-item">
                        <User size={16} className="meta-icon user" />
                        <span>{item.responsible || '—'}</span>
                      </div>
                      <div className="meta-item">
                        <Calendar size={16} className="meta-icon calendar" />
                        <span>
                          {item.due_date
                            ? new Date(item.due_date).toLocaleDateString('en-US')
                            : '—'}
                        </span>
                      </div>
                      <div className="meta-item">
                        <StatusBadge 
                          status={item.status} 
                          actionId={item.id}
                          onStatusChange={onStatusChange}
                        />
                      </div>
                    </div>
                    {item.closed_date && item.status === 'closed' && (
                      <div className="closed-date-info">
                        <Clock size={14} />
                        <span>Closed on: {new Date(item.closed_date).toLocaleDateString('en-US')}</span>
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

        {expanded && children.length > 0 && (
          <div className="item-children">
            {topicChildren.length > 0 && (
              <>
                <h5 className="children-title">
                  <ChevronRight size={16} />
                  {getTopicLabel(topicDepth + 1)} ({topicChildren.length})
                </h5>
                <div className="nested-items">
                  {topicChildren.map((child) => (
                    <ItemCard 
                      key={`${child.itemType}-${child.id}`} 
                      item={child} 
                      type={child.itemType}
                      depth={0}
                      topicDepth={topicDepth + 1}
                      actionDepth={0}
                      onStatusChange={onStatusChange}
                      refreshData={refreshData}
                    />
                  ))}
                </div>
              </>
            )}
            
            {actionChildren.length > 0 && (
              <>
                <h5 className="children-title" style={topicChildren.length > 0 ? { marginTop: '1rem' } : {}}>
                  <ChevronRight size={16} />
                  {getActionLabel(actionDepth)} ({actionChildren.length})
                </h5>
                <div className="nested-items">
                  <ActionsTable 
                    actions={actionChildren} 
                    onStatusChange={onStatusChange}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {expanded && children.length === 0 && !loading && (
          <div className="item-children">
            <p className="no-items">
              {isTopic ? 'No content' : 'No sub-actions'}
            </p>
          </div>
        )}

        {expanded && loading && (
          <div className="item-children">
            <p className="no-items">Loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [topicsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/root-topics`),
        fetch(`${API_URL}/statistics`)
      ]);
      
      if (!topicsRes.ok || !statsRes.ok) {
        throw new Error('API connection error');
      }
      
      const topicsData = await topicsRes.json();
      const statsData = await statsRes.json();
      
      setTopics(topicsData);
      setFilteredTopics(topicsData);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTopics(topics);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = topics.filter(topic => 
        topic.title.toLowerCase().includes(term) ||
        (topic.description && topic.description.toLowerCase().includes(term))
      );
      setFilteredTopics(filtered);
    }
  }, [searchTerm, topics]);

  const handleStatusChange = async (actionId, newStatus) => {
    try {
      const updateData = {
        status: newStatus
      };
      
      if (newStatus === 'closed') {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        updateData.closed_date = today;
      } else {
        updateData.closed_date = null;
      }

      const response = await fetch(`${API_URL}/actions/${actionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        // Force refresh all data
        setRefreshTrigger(prev => prev + 1);
      } else {
        console.error('Error updating status:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{styles}</style>
        <div className="error-container">
          <div className="error-card">
            <AlertCircle size={48} className="error-icon" />
            <h2 className="error-title">Connection Error</h2>
            <p className="error-message">{error}</p>
            <button onClick={fetchData} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app-container">
        <div className="header-top">
          <div className="header-content">
            <div className="logo-section">
              <img 
                src="https://avocarbon-action-plan.azurewebsites.net/assets/favicon-32-removebg-preview.png" 
                alt="AvoCarbon Group" 
                className="logo"
              />
              <div className="header-title">
                <h1>Action Plan Management</h1>
                <p>Manage and track your projects and actions</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container">
          <div className="search-section">
            <div className="search-wrapper">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search by topic name, action, responsible..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {stats && (
            <div className="stats-grid">
              <div className="stat-card stat-card-blue">
                <div className="stat-card-content">
                  <div>
                    <p className="stat-label">Total Topics</p>
                    <p className="stat-value">{stats.total_topics}</p>
                  </div>
                  <Folder size={48} className="stat-icon" />
                </div>
              </div>
              
              <div className="stat-card stat-card-green">
                <div className="stat-card-content">
                  <div>
                    <p className="stat-label">Completed</p>
                    <p className="stat-value">{stats.actions_completed}</p>
                  </div>
                  <CheckCircle2 size={48} className="stat-icon" />
                </div>
              </div>
              
              <div className="stat-card stat-card-orange">
                <div className="stat-card-content">
                  <div>
                    <p className="stat-label">In Progress</p>
                    <p className="stat-value">{stats.actions_in_progress}</p>
                  </div>
                  <Clock size={48} className="stat-icon" />
                </div>
              </div>
              
              <div className="stat-card stat-card-red">
                <div className="stat-card-content">
                  <div>
                    <p className="stat-label">Overdue</p>
                    <p className="stat-value">{stats.actions_overdue}</p>
                  </div>
                  <AlertCircle size={48} className="stat-icon" />
                </div>
              </div>
            </div>
          )}

          <div className="main-content">
            <h2 className="main-title">
              <FolderOpen className="main-title-icon" size={32} />
              All Topics
              <span className="main-title-count">({filteredTopics.length})</span>
            </h2>
            
            {filteredTopics.length > 0 ? (
              <div>
                {filteredTopics.map((topic) => (
                  <ItemCard 
                    key={topic.id} 
                    item={topic} 
                    type="topic" 
                    topicDepth={0} 
                    actionDepth={0}
                    onStatusChange={handleStatusChange}
                    refreshData={refreshData}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Folder size={64} className="empty-icon" />
                <p className="empty-text">
                  {searchTerm ? 'No results found' : 'No topics found'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
