

export const ActionsTable = ({ actions, onStatusChange }) => {
  if (!actions || actions.length === 0) {
    return <p className="no-items">No actions found</p>;
  }

  return (
    <div className="actions-table-container">
      <table className="actions-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Owner</th>
            <th>Due date</th>
            <th>Closed date</th>
            <th>Status</th>
            <th>Raw material application</th>
          </tr>
        </thead>
        <tbody>
          {actions.map((action) => (
            <tr key={action.id}>
              <td>
                <div className="action-title-container">
                  <span className="action-title">{action.titre}</span> 
                  {action.description && (
                    <div className="action-desc">{action.description}</div>
                  )}
                </div>
              </td>
              <td>
                <div className="meta-item">
                  <User size={16} className="meta-icon user" />
                  <span>{action.responsable || '—'}</span>
                </div>
              </td>
              <td>
                <div className="meta-item">
                  <Calendar size={16} className="meta-icon calendar" />
                  <span>
                    {action.due_date
                      ? new Date(action.due_date).toLocaleDateString('en-GB')
                      : '—'}
                  </span>
                </div>
              </td>
              <td>
                <div className="meta-item">
                  <Calendar size={16} className="meta-icon calendar" />
                  <span>
                    {action.closed_date
                      ? new Date(action.closed_date).toLocaleDateString('en-GB')
                      : '—'}
                  </span>
                </div>
              </td>
              <td>
                <StatusBadge 
                  status={action.status} 
                  actionId={action.id}
                  onStatusChange={onStatusChange}
                  actionTitle={action.titre}
                />
              </td>
              <td>
                <Link 
                  to="https://avocarbon-rm-stock.azurewebsites.net" 
                  className={`status-badge ${config.className}`} 
                  onClick={handleStatusClick}
                  target="_blank"
                >
                  Raw material application
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
