import { useDispatch, useSelector } from 'react-redux';
import './Home.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getHomeSummary, getSujetsRacineList, getTeamSujetsRacineList } from '../../redux/sujet/sujet';
import { AlertCircle, CheckCircle2, Clock, Folder, FolderOpen, History, Search, X } from 'lucide-react';
import { ItemCard } from '../../components/ItemCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ActionHistoryModal } from '../../components/ActionHistoryModal';
import { ActionLatestHistoryCells } from '../../components/ActionLatestHistoryCells';
import { updateActionStatus } from '../../redux/action/action';
import { Sujet } from '../../redux/sujet/sujet-slice-types';
import Select from 'react-select';
import { getActionById, getEmails, smartSearchActions } from '../../redux/action/action';
import { getActionHomeStatusBucket } from '../../utils/actionHomeStatus';
import { clearTargetActionId, getStoredTargetActionId, storeTargetActionId } from '../../utils/actionDeepLink';
const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { homeSummary, sujetsRacineList = [] } = useSelector((state: any) => state.sujet);
  const { emailsList = [] } = useSelector((state: any) => state.action);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [smartResults, setSmartResults] = useState<any[]>([]);
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"my" | "team">("my");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [historyAction, setHistoryAction] = useState<any | null>(null);
  const [deepLinkedAction, setDeepLinkedAction] = useState<any | null>(null);
  const [deepLinkMessage, setDeepLinkMessage] = useState<string | null>(null);
  const [targetActionId, setTargetActionId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("actionId") || getStoredTargetActionId();
  });
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [email, setEmail] = useState<string | null>(loggedUser?.email || null);

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  window.location.href = "/login";
};

  const closeDeepLinkBanner = () => {
    clearTargetActionId();
    setTargetActionId(null);
    setDeepLinkedAction(null);
    setDeepLinkMessage(null);
  };

  const viewDeepLinkedAction = () => {
    if (!targetActionId && !deepLinkedAction) return;

    setStatusFilter(null);
    setSearchTerm(deepLinkedAction?.titre || String(targetActionId));

    window.setTimeout(() => {
      document.querySelector(".smart-search-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const fetchData = async () => {
    try {
        const isInitial = !sujetsRacineList.length && !homeSummary;
        if (isInitial) setInitialLoading(true);
        else setRefreshing(true);
        setError(null);
        const scope = viewMode === "team" ? "team" : "my";

        await Promise.all([
        viewMode === "team"
          ? getTeamSujetsRacineList(dispatch, loggedUser.email, statusFilter)
          : getSujetsRacineList(dispatch, loggedUser.email, statusFilter),        
        getHomeSummary(dispatch, loggedUser.email, scope),
        getEmails(dispatch),
        ]);
    } catch (err: any) {
        setError(err?.message || 'Failed to load data');
    } finally {
        setInitialLoading(false);
        setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dispatch, email, statusFilter, viewMode]);

  useEffect(() => {
    const actionIdFromUrl = new URLSearchParams(window.location.search).get("actionId");

    if (!actionIdFromUrl) {
      return;
    }

    storeTargetActionId(actionIdFromUrl);
    setTargetActionId(actionIdFromUrl);
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const loadDeepLinkedAction = async () => {
      if (!targetActionId) {
        return;
      }

      try {
        setStatusFilter(null);
        setSmartSearchLoading(true);

        const action = await getActionById(targetActionId);
        const actionTitle = action?.titre || `Action #${targetActionId}`;

        setDeepLinkedAction(action);
        setSearchTerm(action?.titre || String(targetActionId));
        setDeepLinkMessage(`Opened from email: ${actionTitle}`);
        clearTargetActionId();
      } catch {
        setDeepLinkedAction(null);
        setSearchTerm(String(targetActionId));
        setDeepLinkMessage(
          `Action #${targetActionId} requested from email. Use search or expand related topic to view it.`
        );
      } finally {
        setSmartSearchLoading(false);
      }
    };

    loadDeepLinkedAction();
  }, [targetActionId]);

  useEffect(() => {
  const runSmartSearch = async () => {
    if (!searchTerm.trim()) {
      setSmartResults([]);
      return;
    }

    setSmartSearchLoading(true);

    const results = await smartSearchActions(searchTerm);
    setSmartResults(results);

    setSmartSearchLoading(false);
  };

  const timeout = setTimeout(runSmartSearch, 400);

  return () => clearTimeout(timeout);
}, [searchTerm]);

  const filteredSujets = useMemo(() => {
    if (!searchTerm.trim()) return sujetsRacineList;

    const term = searchTerm.toLowerCase();

    return sujetsRacineList.filter((sujet: Sujet) =>
      sujet.titre?.toLowerCase().includes(term) ||
      sujet.description?.toLowerCase().includes(term)
    );
  }, [searchTerm, sujetsRacineList]);

  const smartResultsWithDeepLink = useMemo(() => {
    if (!deepLinkedAction) return smartResults;

    const hasDeepLinkedAction = smartResults.some(
      (action: any) => String(action.id) === String(deepLinkedAction.id)
    );

    return hasDeepLinkedAction ? smartResults : [deepLinkedAction, ...smartResults];
  }, [deepLinkedAction, smartResults]);

  const filteredSmartResults = useMemo(() => {
    return smartResultsWithDeepLink.filter((action: any) => {
      if (targetActionId && String(action.id) === String(targetActionId)) {
        return true;
      }

      const bucket = getActionHomeStatusBucket(action);

      if (!bucket) {
        return false;
      }

      if (statusFilter && bucket !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [smartResultsWithDeepLink, statusFilter, targetActionId]);

  useEffect(() => {
    if (!targetActionId || smartSearchLoading) return;

    const timeout = window.setTimeout(() => {
      const element = document.querySelector(`[data-action-id="${targetActionId}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [targetActionId, filteredSmartResults, smartSearchLoading]);

  if (initialLoading) {
    return (
        <div className="loading-container">
        <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">Loading…</p>
        </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-card">
          <AlertCircle size={48} className="error-icon" />
          <h2 className="error-title">Connection error</h2>
          <p className="error-message">{error}</p>
          <button onClick={fetchData} className="retry-button">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
  <>
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

        <div className="top-actions">
          <span className="logged-user">
            {loggedUser?.full_name || loggedUser?.email}
          </span>

          <a href="/dashboard" className="dashboard-link">
            Dashboard
          </a>

          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

    </div>

      <div className="container">
        <div className="view-tabs">
          <button
            className={viewMode === "my" ? "view-tab active" : "view-tab"}
            onClick={() => setViewMode("my")}
          >
            My Actions
          </button>

          <button
            className={viewMode === "team" ? "view-tab active" : "view-tab"}
            onClick={() => setViewMode("team")}
          >
            Team Actions
          </button>
        </div>

        <div className="search-section">
          <div className="search-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by topic, action, owner…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, maxWidth: 360 }}>
            <Select
                options={emailsList?.map((email: any) => ({
                    value: email,
                    label: email,
                }))}
                placeholder="Filter by email..."
                isClearable
                onChange={(e: any) => setEmail(e?.value || null)}
                />
            </div>
        </div>

        {homeSummary && (
          <div className="stats-grid">
            <div className="stat-card stat-card-blue">
              <div className="stat-card-content">
                <div>
                  <p className="stat-label">Total topics</p>
                  <p className="stat-value">{homeSummary.total_sujets}</p>
                </div>
                <Folder size={48} className="stat-icon" />
              </div>
            </div>

            <div
              className={`stat-card stat-card-green ${statusFilter === "closed" ? "active-filter-card" : ""}`}
              onClick={() => setStatusFilter(statusFilter === "closed" ? null : "closed")}
               >            
              <div className="stat-card-content">
                <div>
                  <p className="stat-label">Completed</p>
                  <p className="stat-value">{homeSummary.actions_completed}</p>
                </div>
                <CheckCircle2 size={48} className="stat-icon" />
              </div>
            </div>

           <div
                  className={`stat-card stat-card-orange ${statusFilter === "in_progress" ? "active-filter-card" : ""}`}
                  onClick={() => setStatusFilter(statusFilter === "in_progress" ? null : "in_progress")}
                >
              <div className="stat-card-content">
                <div>
                  <p className="stat-label">In progress</p>
                  <p className="stat-value">{homeSummary.actions_in_progress}</p>
                </div>
                <Clock size={48} className="stat-icon" />
              </div>
            </div>

            <div
              className={`stat-card stat-card-red ${statusFilter === "overdue" ? "active-filter-card" : ""}`}
              onClick={() => setStatusFilter(statusFilter === "overdue" ? null : "overdue")}
            >
              <div className="stat-card-content">
                <div>
                  <p className="stat-label">Overdue</p>
                  <p className="stat-value">{homeSummary.actions_overdue}</p>
                </div>
                <AlertCircle size={48} className="stat-icon" />
              </div>
            </div>
          </div>
        )}

        <div className="main-content">
          {deepLinkMessage && (
            <div className="action-deep-link-banner">
              <div>
                <strong>{deepLinkMessage}</strong>
                <span>
                  {deepLinkedAction?.description || `Action #${targetActionId}`}
                </span>
              </div>
              <div className="action-deep-link-actions">
                <button
                  type="button"
                  className="deep-link-view-button"
                  onClick={viewDeepLinkedAction}
                >
                  <Search size={14} />
                  View in Smart Search
                </button>
                <button
                  type="button"
                  className="deep-link-close-button"
                  aria-label="Close email action banner"
                  onClick={closeDeepLinkBanner}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {searchTerm.trim() && (
  <div className="smart-search-results">
    <h2 className="main-title">
      <Search className="main-title-icon" size={28} />
      Smart search results
      <span className="main-title-count">({filteredSmartResults.length})</span>
    </h2>

    {smartSearchLoading ? (
      <p className="loading-text">Searching...</p>
    ) : filteredSmartResults.length > 0 ? (
      <div className="actions-table-wrapper">
       <table className="actions-table">
          <thead>
           <tr>
                <th>Priority</th>
                <th>Action</th>
                <th>Description</th>
                <th>Responsable</th>
                <th>Due date</th>
                <th>Application</th>
                <th>Status</th>
                <th>Last comment</th>
                <th>Fichier joint</th>
                <th>History</th>
              </tr>
          </thead>

         <tbody>
  {filteredSmartResults.map((action: any) => (
    <tr
      key={action.id}
      data-action-id={action.id}
      className={String(action.id) === String(targetActionId) ? "deep-linked-action-row" : ""}
    >
          <td>
        <span className="priority-pill">
          {action.priority_index ?? action.priorite ?? '—'}
        </span>
    </td>
      <td className="action-table-title">
        {action.titre || '—'}
      </td>

      <td>{action.description || '—'}</td>

      <td>{action.responsable || '—'}</td>

      <td>{action.due_date || '—'}</td>

      <td>
        {action.rm_stock_app && (
          <a
            href="https://avocarbon-rm-stock.azurewebsites.net"
            className={`status-badge ${action.status?.toLowerCase() ?? 'open'}`}
            target="_blank"
            rel="noreferrer"
          >
            Raw material
          </a>
        )}

        {action.corrective_action_app && (
          <a
            href="https://avocarbon-customer-complaint.azurewebsites.net/complaints"
            className={`status-badge ${action.status?.toLowerCase() ?? 'open'}`}
            target="_blank"
            rel="noreferrer"
          >
            Corrective action
          </a>
        )}

        {!action.rm_stock_app &&
          !action.corrective_action_app &&
          '—'}
      </td>

      <td>
       <StatusBadge
  status={action.status}
  actionId={action.id}
  onMenuToggle={() => {}}
  onStatusChange={async (actionId: number, newStatus: string, options: any) => {
  await updateActionStatus(dispatch, actionId, newStatus, options);

    const results = await smartSearchActions(searchTerm);
    setSmartResults(results);
  }}
/>
      </td>
      <ActionLatestHistoryCells action={action} />
      <td className="history-cell">
        <button
          type="button"
          className="history-button"
          onClick={() => setHistoryAction(action)}
        >
          <History size={14} />
          History
        </button>
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>
    ) : (
      <div className="empty-state">
        <Search size={56} className="empty-icon" />
        <p className="empty-text">No smart search results found</p>
      </div>
    )}
  </div>
)}
         {!searchTerm.trim() && (
  <>
    <h2 className="main-title">
      <FolderOpen className="main-title-icon" size={32} />
      All topics
      <span className="main-title-count">({filteredSujets.length})</span>
    </h2>

    {filteredSujets.length > 0 ? (
      <div>
        {filteredSujets.map((sujet: Sujet) => (
         <ItemCard
            key={sujet.id}
            item={sujet}
            type="sujet"
            sujetDepth={0}
            actionDepth={0}
            statusFilter={statusFilter}
            targetActionId={targetActionId}
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
  </>
)}
        </div>
      </div>
    </div>
    {historyAction && (
      <ActionHistoryModal
        actionId={historyAction.id}
        actionTitle={historyAction.titre}
        onClose={() => setHistoryAction(null)}
      />
    )}
  </>
  );
};

export default Home;
