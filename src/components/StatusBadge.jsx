import { Edit2 } from "lucide-react";
import { useState } from "react";

export const StatusBadge = ({ status, onStatusChange, actionId }) => {
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
}

