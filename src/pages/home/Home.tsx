import { useDispatch, useSelector } from 'react-redux';
import './Home.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getHomeSummary, getSujetsRacineList, getTeamSujetsRacineList } from '../../redux/sujet/sujet';
import { AlertCircle, Bot, CheckCircle2, Clock, Folder, FolderOpen, History, Search, X } from 'lucide-react';
import { ItemCard } from '../../components/ItemCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ActionHistoryModal } from '../../components/ActionHistoryModal';
import { ActionLatestHistoryCells } from '../../components/ActionLatestHistoryCells';
import { AiActionPlanAssistant } from '../../components/AiActionPlanAssistant';
import {
  actionMatchesFlatKpiFilter,
  FlatFilteredActionsTable,
} from '../../components/FlatFilteredActionsTable';
import { getFilteredActions, updateActionStatus } from '../../redux/action/action';
import { Sujet } from '../../redux/sujet/sujet-slice-types';
import Select from 'react-select';
import { getActionAccess, getEmails, smartSearchActions } from '../../redux/action/action';
import { getActionHomeStatusBucket } from '../../utils/actionHomeStatus';
import { clearTargetActionId, getStoredTargetActionId, storeTargetActionId } from '../../utils/actionDeepLink';
import { clearAuthTokens } from '../../services/axiosInstance';

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || null;
type KpiFilter = "closed" | "in_progress" | "overdue";
type AiCreatedPlanFocus = {
  rootSujetId: number | string | null;
  sujetIds: Array<number | string>;
  actionId: number | string | null;
} | null;

const KPI_FILTER_LABELS: Record<KpiFilter, string> = {
  closed: "Completed",
  in_progress: "In progress",
  overdue: "Overdue",
};

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
  const [selectedKpiFilter, setSelectedKpiFilter] = useState<KpiFilter | null>(null);
  const [filteredActions, setFilteredActions] = useState<any[]>([]);
  const [filteredActionsLoading, setFilteredActionsLoading] = useState(false);
  const [filteredActionsError, setFilteredActionsError] = useState<string | null>(null);
  const [historyAction, setHistoryAction] = useState<any | null>(null);
  const [deepLinkedAction, setDeepLinkedAction] = useState<any | null>(null);
  const [deepLinkMessage, setDeepLinkMessage] = useState<string | null>(null);
  const [deepLinkAccessLoading, setDeepLinkAccessLoading] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiCreatedMessage, setAiCreatedMessage] = useState<string | null>(null);
  const [aiCreatedPlanFocus, setAiCreatedPlanFocus] = useState<AiCreatedPlanFocus>(null);
  const [targetActionId, setTargetActionId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("actionId") || getStoredTargetActionId();
  });
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const loggedUserEmail = normalizeEmail(loggedUser?.email);
  const hasUnresolvedDeepLink = Boolean(targetActionId) && !deepLinkMessage && !accessDeniedMessage;

  const [email, setEmail] = useState<string | null>(loggedUser?.email || null);

const handleLogout = () => {
  clearAuthTokens();

  window.location.href = "/login";
};

  const closeDeepLinkBanner = () => {
    clearTargetActionId();
    setTargetActionId(null);
    setDeepLinkedAction(null);
    setDeepLinkMessage(null);
    setAccessDeniedMessage(null);
  };

  const viewDeepLinkedAction = () => {
    if (!targetActionId && !deepLinkedAction) return;

    setSelectedKpiFilter(null);
    setSearchTerm(deepLinkedAction?.titre || String(targetActionId));

    window.setTimeout(() => {
      document.querySelector(".smart-search-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  const openAiModal = () => {
    setAiModalOpen(true);
  };

  const closeAiModal = () => {
    setAiModalOpen(false);
  };

  const fetchData = async () => {
    try {
        if (hasUnresolvedDeepLink) {
          return;
        }

        if (!loggedUserEmail) {
          setInitialLoading(false);
          return;
        }

        const isInitial = !sujetsRacineList.length && !homeSummary;
        if (isInitial) setInitialLoading(true);
        else setRefreshing(true);
        setError(null);
        const scope = viewMode === "team" ? "team" : "my";

        await Promise.all([
        viewMode === "team"
          ? getTeamSujetsRacineList(dispatch, loggedUserEmail)
          : getSujetsRacineList(dispatch, loggedUserEmail),
        getHomeSummary(dispatch, loggedUserEmail, scope),
        getEmails(dispatch),
        ]);
    } catch (err: any) {
        setError(err?.message || 'Failed to load data');
    } finally {
        setInitialLoading(false);
        setRefreshing(false);
    }
  };

  const fetchFilteredActions = async () => {
    if (!selectedKpiFilter || !loggedUserEmail || hasUnresolvedDeepLink) {
      setFilteredActions([]);
      setFilteredActionsError(null);
      setFilteredActionsLoading(false);
      return;
    }

    try {
      setFilteredActionsLoading(true);
      setFilteredActionsError(null);

      const actions = await getFilteredActions({
        email: loggedUserEmail,
        scope: viewMode,
        status: selectedKpiFilter,
      });

      setFilteredActions(actions || []);
    } catch (err: any) {
      setFilteredActions([]);
      setFilteredActionsError(
        err?.response?.data?.detail || err?.message || "Unable to load filtered actions."
      );
    } finally {
      setFilteredActionsLoading(false);
    }
  };

  const handleKpiClick = (filter: KpiFilter | null) => {
    if (!filter) {
      setSelectedKpiFilter(null);
      return;
    }

    setSelectedKpiFilter((current) => current === filter ? null : filter);
  };

  const handleAiPlanCreated = async (result: any, draft: any) => {
    const rootSujetId = result?.root_sujet_id || result?.root_sujet_ids?.[0] || null;
    const createdSujetIds = [
      ...new Set([
        ...(result?.root_sujet_ids || []),
        ...(result?.created_sujet_ids || []),
      ]),
    ];
    const firstActionId = result?.created_action_ids?.[0] || null;

    setSelectedKpiFilter(null);
    setSearchTerm('');
    setSmartResults([]);
    setDeepLinkedAction(null);
    setDeepLinkMessage(null);
    setAccessDeniedMessage(null);
    setAiCreatedMessage('AI action plan created successfully.');
    setAiCreatedPlanFocus({
      rootSujetId,
      sujetIds: createdSujetIds,
      actionId: firstActionId,
    });

    await fetchData();
  };

  const handleFlatStatusChange = async (actionId: number, newStatus: string, options: any) => {
    await updateActionStatus(dispatch, actionId, newStatus, options);

    await Promise.all([
      fetchFilteredActions(),
      loggedUserEmail
        ? getHomeSummary(dispatch, loggedUserEmail, viewMode)
        : Promise.resolve(false),
    ]);
  };

  useEffect(() => {
    fetchData();
  }, [
    accessDeniedMessage,
    deepLinkMessage,
    dispatch,
    email,
    hasUnresolvedDeepLink,
    loggedUserEmail,
    targetActionId,
    viewMode,
  ]);

  useEffect(() => {
    fetchFilteredActions();
  }, [
    hasUnresolvedDeepLink,
    loggedUserEmail,
    selectedKpiFilter,
    viewMode,
  ]);

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

      if (!loggedUserEmail) {
        setInitialLoading(false);
        return;
      }

      try {
        setSelectedKpiFilter(null);
        setSearchTerm('');
        setSmartResults([]);
        setDeepLinkedAction(null);
        setDeepLinkMessage(null);
        setAccessDeniedMessage(null);
        setDeepLinkAccessLoading(true);

        const access = await getActionAccess(targetActionId, loggedUserEmail);

        if (!access?.allowed) {
          clearTargetActionId();
          setTargetActionId(null);
          setAccessDeniedMessage('You do not have access to this action.');
          return;
        }

        const nextScope = access.scope === 'team' ? 'team' : 'my';
        const action = access.action;
        const actionTitle = action?.titre || `Action #${targetActionId}`;

        setViewMode(nextScope);
        setDeepLinkedAction(action);
        setSearchTerm(action?.titre || String(targetActionId));
        setDeepLinkMessage(`Opened from email: ${actionTitle}`);
        clearTargetActionId();
      } catch {
        setDeepLinkedAction(null);
        setSearchTerm('');
        setSmartResults([]);
        setDeepLinkMessage(null);
        setAccessDeniedMessage('You do not have access to this action.');
        clearTargetActionId();
        setTargetActionId(null);
      } finally {
        setDeepLinkAccessLoading(false);
      }
    };

    loadDeepLinkedAction();
  }, [targetActionId, loggedUserEmail]);

  useEffect(() => {
  const runSmartSearch = async () => {
    if (!searchTerm.trim()) {
      setSmartResults([]);
      return;
    }

    if (!loggedUserEmail) {
      setSmartResults([]);
      return;
    }

    setSmartSearchLoading(true);

    const results = await smartSearchActions(searchTerm, {
      email: loggedUserEmail,
      scope: viewMode,
      scopedOnly: true,
    });
    setSmartResults(results);

    setSmartSearchLoading(false);
  };

  const timeout = setTimeout(runSmartSearch, 400);

  return () => clearTimeout(timeout);
}, [searchTerm, loggedUserEmail, viewMode]);

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

      if (!getActionHomeStatusBucket(action)) {
        return false;
      }

      if (!actionMatchesFlatKpiFilter(action, selectedKpiFilter)) {
        return false;
      }

      return true;
    });
  }, [smartResultsWithDeepLink, selectedKpiFilter, targetActionId]);

  const visibleFilteredActions = useMemo(() => {
    return filteredActions.filter((action: any) =>
      actionMatchesFlatKpiFilter(action, selectedKpiFilter)
    );
  }, [filteredActions, selectedKpiFilter]);

  useEffect(() => {
    if (!targetActionId || smartSearchLoading) return;

    const timeout = window.setTimeout(() => {
      const element = document.querySelector(`[data-action-id="${targetActionId}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [targetActionId, filteredSmartResults, smartSearchLoading]);

  useEffect(() => {
    if (!aiCreatedPlanFocus?.rootSujetId && !aiCreatedPlanFocus?.actionId) return;

    const timeout = window.setTimeout(() => {
      const actionElement = aiCreatedPlanFocus.actionId
        ? document.querySelector(`[data-action-id="${aiCreatedPlanFocus.actionId}"]`)
        : null;
      const sujetElement = aiCreatedPlanFocus.rootSujetId
        ? document.querySelector(`[data-sujet-id="${aiCreatedPlanFocus.rootSujetId}"]`)
        : null;

      (actionElement || sujetElement)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [aiCreatedPlanFocus, sujetsRacineList]);

  if (initialLoading) {
    return (
        <div className="loading-container">
        <div className="loading-content">
            <div className="spinner"></div>
            <p className="loading-text">
              {targetActionId ? 'Opening action from email...' : 'Loading...'}
            </p>
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
        <div className="home-toolbar">
          <div className="view-tab-group">
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

          <div className="home-toolbar-right">
            {homeSummary && (
              <div className="toolbar-kpis" aria-label="Action filters">
                <button
                  type="button"
                  className={`stat-card stat-card-blue ${!selectedKpiFilter ? "active-filter-card" : ""}`}
                  onClick={() => handleKpiClick(null)}
                >
                  <div className="stat-card-content">
                    <div>
                      <p className="stat-label">Total</p>
                      <p className="stat-value">{homeSummary.total_sujets}</p>
                    </div>
                    <Folder size={18} className="stat-icon" />
                  </div>
                </button>

                <button
                  type="button"
                  className={`stat-card stat-card-green ${selectedKpiFilter === "closed" ? "active-filter-card" : ""}`}
                  onClick={() => handleKpiClick("closed")}
                >
                  <div className="stat-card-content">
                    <div>
                      <p className="stat-label">Completed</p>
                      <p className="stat-value">{homeSummary.actions_completed}</p>
                    </div>
                    <CheckCircle2 size={18} className="stat-icon" />
                  </div>
                </button>

                <button
                  type="button"
                  className={`stat-card stat-card-orange ${selectedKpiFilter === "in_progress" ? "active-filter-card" : ""}`}
                  onClick={() => handleKpiClick("in_progress")}
                >
                  <div className="stat-card-content">
                    <div>
                      <p className="stat-label">In progress</p>
                      <p className="stat-value">{homeSummary.actions_in_progress}</p>
                    </div>
                    <Clock size={18} className="stat-icon" />
                  </div>
                </button>

                <button
                  type="button"
                  className={`stat-card stat-card-red ${selectedKpiFilter === "overdue" ? "active-filter-card" : ""}`}
                  onClick={() => handleKpiClick("overdue")}
                >
                  <div className="stat-card-content">
                    <div>
                      <p className="stat-label">Overdue</p>
                      <p className="stat-value">{homeSummary.actions_overdue}</p>
                    </div>
                    <AlertCircle size={18} className="stat-icon" />
                  </div>
                </button>
              </div>
            )}

            <button
              type="button"
              className="ai-create-button"
              onClick={openAiModal}
            >
              <Bot size={16} />
              Create with AI
            </button>
          </div>
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

        <div className="main-content">
          {aiCreatedMessage && (
            <div className="action-deep-link-banner ai-created-plan-banner">
              <div>
                <strong>{aiCreatedMessage}</strong>
                <span>The new action plan has been added to your Home tree.</span>
              </div>
              <div className="action-deep-link-actions">
                <button
                  type="button"
                  className="deep-link-close-button"
                  aria-label="Close AI created plan banner"
                  onClick={() => setAiCreatedMessage(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {deepLinkAccessLoading && (
            <div className="action-deep-link-banner action-deep-link-loading">
              <div>
                <strong>Opening action from email...</strong>
                <span>Checking access before loading the action.</span>
              </div>
            </div>
          )}

          {accessDeniedMessage && (
            <div className="action-deep-link-banner action-deep-link-denied">
              <div>
                <strong>{accessDeniedMessage}</strong>
                <span>The email link was not opened because it is outside your allowed scope.</span>
              </div>
              <div className="action-deep-link-actions">
                <button
                  type="button"
                  className="deep-link-close-button"
                  aria-label="Close access denied banner"
                  onClick={closeDeepLinkBanner}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

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

    const results = await smartSearchActions(searchTerm, {
      email: loggedUserEmail,
      scope: viewMode,
      scopedOnly: true,
    });
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
         {!searchTerm.trim() && selectedKpiFilter && (
  <>
    <h2 className="main-title">
      <FolderOpen className="main-title-icon" size={32} />
      {KPI_FILTER_LABELS[selectedKpiFilter]} actions
      <span className="main-title-count">({visibleFilteredActions.length})</span>
    </h2>

    <FlatFilteredActionsTable
      actions={filteredActions}
      loading={filteredActionsLoading}
      error={filteredActionsError}
      filter={selectedKpiFilter}
      onOpenHistory={setHistoryAction}
      onStatusChange={handleFlatStatusChange}
    />
  </>
)}
         {!searchTerm.trim() && !selectedKpiFilter && (
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
            statusFilter={null}
            targetActionId={targetActionId}
            highlightActionId={aiCreatedPlanFocus?.actionId}
            forceExpandedSujetIds={aiCreatedPlanFocus?.sujetIds || []}
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
    <AiActionPlanAssistant
      open={aiModalOpen}
      onClose={closeAiModal}
      loggedUserEmail={loggedUserEmail}
      scope={viewMode}
      onCreated={handleAiPlanCreated}
    />
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
