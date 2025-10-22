import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, CheckCircle2, Clock, AlertCircle, Calendar, User, FileText } from 'lucide-react';

const API_URL = 'http://ap-back.azurewebsites.net';

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
    background: linear-gradient(135deg, #e9d5ff 0%, #dbeafe 50%, #fce7f3 100%);
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }

  .header {
    margin-bottom: 2rem;
    text-align: center;
    animation: fadeIn 0.6s ease-out;
  }

  .header h1 {
    font-size: 3rem;
    font-weight: 900;
    background: linear-gradient(135deg, #9333ea, #ec4899, #6366f1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
    animation: pulse 2s infinite;
  }

  .header p {
    color: #4b5563;
    font-size: 1.125rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
    animation: slideIn 0.5s ease-out;
  }

  .stat-card {
    border-radius: 0.75rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    padding: 1.5rem;
    color: white;
    transition: transform 0.3s;
  }

  .stat-card:hover {
    transform: scale(1.05);
  }

  .stat-card-blue {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  .stat-card-green {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  .stat-card-yellow {
    background: linear-gradient(135deg, #f59e0b, #ea580c);
  }

  .stat-card-red {
    background: linear-gradient(135deg, #ef4444, #ec4899);
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
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    padding: 2rem;
  }

  .main-title {
    font-size: 1.875rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .main-title-icon {
    color: #9333ea;
  }

  .main-title-count {
    font-size: 1.125rem;
    font-weight: 400;
    color: #6b7280;
  }

  .item-card {
    margin-bottom: 1rem;
    animation: slideIn 0.5s ease-out;
  }

  .item-card-inner {
    background: linear-gradient(135deg, #ffffff, #f9fafb);
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    border-left: 4px solid;
    transition: all 0.3s;
  }

  .item-card-inner:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
    transform: translateX(4px);
  }

  .item-card-inner.is-sujet {
    border-left-color: #3b82f6;
  }

  .item-card-inner.is-action {
    border-left-color: #10b981;
  }

  .item-card-inner.priority-1 {
    border-left-color: #ef4444;
  }

  .item-card-inner.priority-2 {
    border-left-color: #f97316;
  }

  .item-card-inner.priority-3 {
    border-left-color: #eab308;
  }

  .item-card-inner.priority-4 {
    border-left-color: #3b82f6;
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
    background: linear-gradient(135deg, #faf5ff, #eef2ff);
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
    color: #3b82f6;
  }

  .item-icon.open {
    color: #f59e0b;
    animation: bounce 1s infinite;
  }

  .item-icon.action {
    color: #10b981;
  }

  .item-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: linear-gradient(135deg, #9333ea, #ec4899);
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
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }

  .item-info {
    flex: 1;
    min-width: 0;
  }

  .item-title {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 0.25rem;
    transition: color 0.3s;
  }

  .item-header:hover .item-title {
    color: #9333ea;
  }

  .item-description {
    color: #4b5563;
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
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

  .meta-item.responsable {
    font-weight: 500;
  }

  .meta-icon.user {
    color: #6366f1;
  }

  .meta-icon.calendar {
    color: #ec4899;
  }

  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    margin-top: 0.5rem;
  }

  .status-badge.nouveau {
    background: #3b82f6;
  }

  .status-badge.in_progress {
    background: #eab308;
  }

  .status-badge.completed {
    background: #10b981;
  }

  .status-badge.overdue {
    background: #ef4444;
  }

  .priority-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
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
    height: 12px;
    overflow: hidden;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-top: 0.5rem;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4ade80, #10b981);
    border-radius: 9999px;
    transition: width 0.7s;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    position: relative;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: white;
    opacity: 0.3;
    animation: pulse 2s infinite;
  }

  .item-toggle {
    color: #9333ea;
    background: none;
    border: none;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .item-toggle:hover {
    transform: scale(1.25);
  }

  .item-children {
    background: linear-gradient(135deg, #f8fafc, #dbeafe);
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
  }

  .children-title {
    font-size: 0.875rem;
    font-weight: 700;
    color: #7c3aed;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .nested-items {
    margin-left: 1.5rem;
  }

  .loading-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #e9d5ff 0%, #dbeafe 50%, #fce7f3 100%);
  }

  .loading-content {
    text-align: center;
  }

  .spinner {
    display: inline-block;
    width: 64px;
    height: 64px;
    border: 4px solid rgba(147, 51, 234, 0.1);
    border-top-color: #9333ea;
    border-bottom-color: #9333ea;
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

  .error-hint {
    font-size: 0.875rem;
    color: #6b7280;
    text-align: center;
  }

  .retry-button {
    margin-top: 1rem;
    width: 100%;
    background: linear-gradient(135deg, #9333ea, #6366f1);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: box-shadow 0.3s;
  }

  .retry-button:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
    font-size: 1.25rem;
  }

  .no-items {
    color: #6b7280;
    text-align: center;
    padding: 2rem 0;
    font-style: italic;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* ==== ACTIONS EN COLONNES (Nom, Responsable, Date, Statut) ==== */
  /* On masque l'ancien rendu (titre/desc/meta) des actions, MAIS PAS le badge */
  .item-card-inner.is-action .item-title,
  .item-card-inner.is-action .item-description,
  .item-card-inner.is-action .item-meta {
    display: none;
  }

  .action-row {
    display: grid;
    grid-template-columns: 1fr 220px 160px 140px; /* Nom | Resp. | Date | Statut */
    gap: 1rem;
    align-items: center;
    padding-top: 0.25rem;
  }

  .action-col {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .action-col.name {
    font-weight: 700;
    color: #111827;
  }

  .action-title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-desc {
    font-weight: 500;
    color: #6b7280;
    margin-left: 0.5rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* couleurs d'icônes restantes (user/date) */
  .action-col.resp .meta-icon.user { color: #6366f1; }
  .action-col.date .meta-icon.calendar { color: #ec4899; }

  /* Badge de statut dans la 4e colonne */
  .action-col.status .status-badge {
    display: inline-flex;
    margin-top: 0;
  }

  @media (max-width: 860px) {
    .action-row {
      grid-template-columns: 1fr 1fr;
      row-gap: .5rem;
    }
    .action-col.status { justify-content: flex-start; }
  }
`;

const StatusBadge = ({ status }) => {
  const statusConfig = {
    nouveau: { text: 'Nouveau', className: 'nouveau' },
    in_progress: { text: 'En cours', className: 'in_progress' },
    completed: { text: 'Terminé', className: 'completed' },
    overdue: { text: 'En retard', className: 'overdue' },
  };
  
  const config = statusConfig[status] || statusConfig.nouveau;
  
  return (
    <span className={`status-badge ${config.className}`}>
      {config.text}
    </span>
  );
};

// Composant unifié qui gère à la fois les sujets et les actions
const ItemCard = ({ item, type = 'sujet', depth = 0 }) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);

  const isSujet = type === 'sujet';
  const isAction = type === 'action';

  const fetchChildren = async () => {
    if (loading || children.length > 0) return;
    setLoading(true);
    
    try {
      if (isSujet) {
        // Pour un sujet: charger sous-sujets ET actions
        const [sousSujetsRes, actionsRes] = await Promise.all([
          fetch(`${API_URL}/sujets/${item.id}/sous-sujets`),
          fetch(`${API_URL}/sujets/${item.id}/actions`)
        ]);
        const sousSujets = await sousSujetsRes.json();
        const actions = await actionsRes.json();
        
        // Combiner sous-sujets et actions
        const allChildren = [
          ...sousSujets.map(s => ({ ...s, itemType: 'sujet' })),
          ...actions.map(a => ({ ...a, itemType: 'action' }))
        ];
        setChildren(allChildren);
      } else if (isAction) {
        // Pour une action: charger seulement les sous-actions
        const response = await fetch(`${API_URL}/actions/${item.id}/sous-actions`);
        const sousActions = await response.json();
        setChildren(sousActions.map(sa => ({ ...sa, itemType: 'action' })));
      }
    } catch (error) {
      console.error('Erreur:', error);
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

  const totalChildren = isSujet 
    ? (item.total_actions || 0) 
    : 0;

  const priorityClass = isAction && item.priorite ? `priority-${item.priorite}` : '';
  const typeClass = isSujet ? 'is-sujet' : 'is-action';

  return (
    <div className="item-card" style={{ marginLeft: `${depth * 20}px` }}>
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
                {totalChildren > 0 && (
                  <div className="item-badge">{totalChildren}</div>
                )}
              </div>
              
              <div className="item-info">
                {/* SUJET : titre/desc */}
                {isSujet && (
                  <>
                    <h3 className="item-title">{item.titre}</h3>
                    {item.description && (
                      <p className="item-description">{item.description}</p>
                    )}
                  </>
                )}

                {/* SUJET : stats */}
                {isSujet && item.total_actions > 0 && (
                  <div>
                    <div className="item-stats">
                      <span className="stat-item green">
                        <CheckCircle2 size={16} />
                        {item.completed_actions} / {item.total_actions} terminées
                      </span>
                      {item.overdue_actions > 0 && (
                        <span className="stat-item red">
                          <AlertCircle size={16} />
                          {item.overdue_actions} en retard
                        </span>
                      )}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}

                {/* ACTION : rendu en 4 colonnes */}
                {isAction && (
                  <div className="action-row">
                    {/* 1) Nom (sans icône) */}
                    <div className="action-col name">
                      <span className="action-title">{item.titre}</span>
                      {item.description && <span className="action-desc">— {item.description}</span>}
                    </div>

                    {/* 2) Responsable */}
                    <div className="action-col resp">
                      <User size={16} className="meta-icon user" />
                      <span>{item.responsable || '—'}</span>
                    </div>

                    {/* 3) Date */}
                    <div className="action-col date">
                      <Calendar size={16} className="meta-icon calendar" />
                      <span>
                        {item.due_date
                          ? new Date(item.due_date).toLocaleDateString('fr-FR')
                          : '—'}
                      </span>
                    </div>

                    {/* 4) Statut */}
                    <div className="action-col status">
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <button className="item-toggle" aria-label={expanded ? 'Réduire' : 'Développer'}>
              {expanded ? <ChevronDown size={28} /> : <ChevronRight size={28} />}
            </button>
          </div>
        </div>

        {expanded && children.length > 0 && (
          <div className="item-children">
            <h5 className="children-title">
              <ChevronRight size={16} />
              {isSujet ? `Contenu (${children.length})` : `Sous-actions (${children.length})`}
            </h5>
            <div className="nested-items">
              {children.map((child) => (
                <ItemCard 
                  key={`${child.itemType}-${child.id}`} 
                  item={child} 
                  type={child.itemType}
                  depth={0}
                />
              ))}
            </div>
          </div>
        )}

        {expanded && children.length === 0 && !loading && (
          <div className="item-children">
            <p className="no-items">
              {isSujet ? 'Aucun contenu' : 'Aucune sous-action'}
            </p>
          </div>
        )}

        {expanded && loading && (
          <div className="item-children">
            <p className="no-items">Chargement...</p>
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  const [sujets, setSujets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sujetsRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/sujets-racines`),
        fetch(`${API_URL}/statistiques`)
      ]);
      
      if (!sujetsRes.ok || !statsRes.ok) {
        throw new Error('Erreur de connexion à l\'API');
      }
      
      const sujetsData = await sujetsRes.json();
      const statsData = await statsRes.json();
      
      setSujets(sujetsData);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-container">
          <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Chargement...</p>
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
            <h2 className="error-title">Erreur de connexion</h2>
            <p className="error-message">{error}</p>
            <p className="error-hint">Vérifiez que l'API est démarrée sur http://localhost:5000</p>
            <button onClick={fetchData} className="retry-button">
              Réessayer
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
        <div className="container">
          <header className="header">
            <h1>📋 Action Plan Manager</h1>
            <p>Visualisez et gérez vos projets et actions</p>
          </header>

          {stats && (
            <div className="stats-grid">
              <div className="stat-card stat-card-blue">
                <div className="stat-card-content">
                  <div>
                    <p className="stat-label">Total Sujets</p>
                    <p className="stat-value">{stats.total_sujets}</p>
                  </div>
                  <Folder size={48} className="stat-icon" />
                </div>
              </div>
              
              <div className="stat-card stat-card-green">
                <div className="stat-card-content">
                  <div>
                    <p className="stat-label">Terminées</p>
                    <p className="stat-value">{stats.actions_completed}</p>
                  </div>
                  <CheckCircle2 size={48} className="stat-icon" />
                </div>
              </div>
              
              <div className="stat-card stat-card-yellow">
                <div className="stat-card-content">
                  <div>
                    <p className="stat-label">En cours</p>
                    <p className="stat-value">{stats.actions_in_progress}</p>
                  </div>
                  <Clock size={48} className="stat-icon" />
                </div>
              </div>
              
              <div className="stat-card stat-card-red">
                <div className="stat-card-content">
                  <div>
                    <p className="stat-label">En retard</p>
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
              Tous les Sujets
              <span className="main-title-count">({sujets.length})</span>
            </h2>
            
            {sujets.length > 0 ? (
              <div>
                {sujets.map((sujet) => (
                  <ItemCard key={sujet.id} item={sujet} type="sujet" />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Folder size={64} className="empty-icon" />
                <p className="empty-text">Aucun sujet trouvé</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
