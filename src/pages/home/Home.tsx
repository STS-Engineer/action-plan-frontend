import { useDispatch, useSelector } from 'react-redux';
import './Home.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getHomeSummary, getSujetsRacineList, getTeamSujetsRacineList } from '../../redux/sujet/sujet';
import { AlertCircle, Ban, Bell, CheckCircle2, Clock, Eye, Folder, FolderOpen, History, Search, ShieldCheck, X } from 'lucide-react';
import { ItemCard } from '../../components/ItemCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ActionHistoryModal } from '../../components/ActionHistoryModal';
import { ActionLatestHistoryCells } from '../../components/ActionLatestHistoryCells';
import { ActionDeleteButton } from '../../components/ActionDeleteButton';
import { AiActionPlanAssistant } from '../../components/AiActionPlanAssistant';
import {
  actionMatchesFlatKpiFilter,
  FlatFilteredActionsTable,
} from '../../components/FlatFilteredActionsTable';
import {
  ActionTableFilterControl,
  createEmptyActionColumnFilters,
  filterActionsByColumnFilters,
  hasActiveActionColumnFilters,
} from '../../components/ActionTableFilters';
import { getFilteredActions, getMyEscalations, updateActionStatus, updateEscalationNotification } from '../../redux/action/action';
import { Sujet } from '../../redux/sujet/sujet-slice-types';
import { getActionAccess, smartSearchActions } from '../../redux/action/action';
import { getActionHomeStatusBucket } from '../../utils/actionHomeStatus';
import { clearTargetActionId, getStoredTargetActionId, storeTargetActionId } from '../../utils/actionDeepLink';
import { clearAuthTokens } from '../../services/axiosInstance';
import DescriptionCell from '../../components/DescriptionCell';

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || null;
type KpiFilter = "closed" | "in_progress" | "overdue" | "blocked";
type KpiClickFilter = KpiFilter | "total";
type HomeScope = "my" | "team" | "requested_by_me" | "all";
type HomePanel = "actions" | "escalations";
type AiCreatedPlanFocus = {
  rootSujetId: number | string | null;
  sujetIds: Array<number | string>;
  actionId: number | string | null;
} | null;

const KPI_FILTER_LABELS: Record<KpiFilter, string> = {
  closed: "Completed",
  in_progress: "In progress",
  overdue: "Overdue",
  blocked: "Blocked",
};
const KPI_FILTER_ORDER: KpiFilter[] = ["overdue", "blocked", "in_progress", "closed"];

const createEmptyActionsByKpi = (): Record<KpiFilter, any[]> => ({
  overdue: [],
  blocked: [],
  in_progress: [],
  closed: [],
});

const createLoadingByKpi = (value = false): Record<KpiFilter, boolean> => ({
  overdue: value,
  blocked: value,
  in_progress: value,
  closed: value,
});

const createEmptyErrorsByKpi = (): Record<KpiFilter, string | null> => ({
  overdue: null,
  blocked: null,
  in_progress: null,
  closed: null,
});

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { homeSummary, sujetsRacineList = [] } = useSelector((state: any) => state.sujet);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [smartResults, setSmartResults] = useState<any[]>([]);
  const [smartColumnFilters, setSmartColumnFilters] = useState(createEmptyActionColumnFilters);
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  const [viewMode, setViewMode] = useState<HomeScope>("my");
  const [activePanel, setActivePanel] = useState<HomePanel>(() => {
    return new URLSearchParams(window.location.search).get("tab") === "escalations"
      ? "escalations"
      : "actions";
  });
  const [selectedKpiFilters, setSelectedKpiFilters] = useState<KpiFilter[]>([]);
  const [filteredActionsByKpi, setFilteredActionsByKpi] = useState<Record<KpiFilter, any[]>>(
    createEmptyActionsByKpi
  );
  const [visibleKpiCounts, setVisibleKpiCounts] = useState<Record<KpiFilter, number>>(
    () => ({ overdue: 0, blocked: 0, in_progress: 0, closed: 0 })
  );
  const [loadingByKpi, setLoadingByKpi] = useState<Record<KpiFilter, boolean>>(
    () => createLoadingByKpi(false)
  );
  const [errorByKpi, setErrorByKpi] = useState<Record<KpiFilter, string | null>>(
    createEmptyErrorsByKpi
  );
  const [historyAction, setHistoryAction] = useState<any | null>(null);
  const [escalations, setEscalations] = useState<any[]>([]);
  const [escalationsLoading, setEscalationsLoading] = useState(false);
  const [escalationsError, setEscalationsError] = useState<string | null>(null);
  const [deepLinkedAction, setDeepLinkedAction] = useState<any | null>(null);
  const [deepLinkMessage, setDeepLinkMessage] = useState<string | null>(null);
  const [deepLinkAccessLoading, setDeepLinkAccessLoading] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiCreatedMessage, setAiCreatedMessage] = useState<string | null>(null);
  const [actionDeletedMessage, setActionDeletedMessage] = useState<string | null>(null);
  const [aiCreatedPlanFocus, setAiCreatedPlanFocus] = useState<AiCreatedPlanFocus>(null);
  const [targetActionId, setTargetActionId] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get("actionId") || getStoredTargetActionId();
  });
  const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const loggedUserEmail = normalizeEmail(loggedUser?.email);
  const isAdminUser = String(loggedUser?.role || "").trim().toLowerCase() === "admin";
  const hasUnresolvedDeepLink = Boolean(targetActionId) && !deepLinkMessage && !accessDeniedMessage;

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

    setSelectedKpiFilters([]);
    setSearchTerm(deepLinkedAction?.titre || String(targetActionId));

    window.setTimeout(() => {
      document.querySelector(".smart-search-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
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
        await Promise.all([
        viewMode === "team"
          ? getTeamSujetsRacineList(dispatch, loggedUserEmail)
          : getSujetsRacineList(dispatch, loggedUserEmail, null, viewMode),
        getHomeSummary(dispatch, loggedUserEmail, viewMode),
        ]);
    } catch (err: any) {
        setError(err?.message || 'Failed to load data');
    } finally {
        setInitialLoading(false);
        setRefreshing(false);
    }
  };

  const fetchFilteredActionsForKpi = async (filter: KpiFilter) => {
    if (!loggedUserEmail || hasUnresolvedDeepLink) {
      setFilteredActionsByKpi((current) => ({ ...current, [filter]: [] }));
      setErrorByKpi((current) => ({ ...current, [filter]: null }));
      setLoadingByKpi((current) => ({ ...current, [filter]: false }));
      return;
    }

    try {
      setLoadingByKpi((current) => ({ ...current, [filter]: true }));
      setErrorByKpi((current) => ({ ...current, [filter]: null }));

      const actions = await getFilteredActions({
        email: loggedUserEmail,
        scope: viewMode,
        status: filter,
      });

      setFilteredActionsByKpi((current) => ({ ...current, [filter]: actions || [] }));
    } catch (err: any) {
      setFilteredActionsByKpi((current) => ({ ...current, [filter]: [] }));
      setErrorByKpi((current) => ({
        ...current,
        [filter]: err?.response?.data?.detail || err?.message || "Unable to load filtered actions.",
      }));
    } finally {
      setLoadingByKpi((current) => ({ ...current, [filter]: false }));
    }
  };

  const fetchEscalations = async () => {
    if (!loggedUserEmail) {
      setEscalations([]);
      return;
    }

    try {
      setEscalationsLoading(true);
      setEscalationsError(null);
      const payload = await getMyEscalations({
        all: isAdminUser && viewMode === "all",
      });
      setEscalations(payload?.escalations || []);
    } catch (err: any) {
      setEscalations([]);
      setEscalationsError(
        err?.response?.data?.detail || err?.message || "Unable to load escalations."
      );
    } finally {
      setEscalationsLoading(false);
    }
  };

  const selectActionScope = (scope: HomeScope) => {
    setViewMode(scope);
    setActivePanel("actions");
    navigate("/", { replace: true });
  };

  const openEscalationsPanel = () => {
    setActivePanel("escalations");
    setSelectedKpiFilters([]);
    setSearchTerm('');
    setSmartResults([]);
    navigate("/home?tab=escalations", { replace: true });
  };

  const fetchSelectedKpiActions = async (filters = selectedKpiFilters) => {
    if (!filters.length || !loggedUserEmail || hasUnresolvedDeepLink) {
      return;
    }

    await Promise.all(filters.map((filter) => fetchFilteredActionsForKpi(filter)));
  };

  const handleKpiClick = (filter: KpiClickFilter) => {
    setActivePanel("actions");
    setSearchTerm('');
    setSmartResults([]);
    setSmartSearchLoading(false);

    if (filter === "total") {
      setSelectedKpiFilters([]);
      return;
    }

    setSelectedKpiFilters((current) =>
      current.includes(filter)
        ? current.filter((selectedFilter) => selectedFilter !== filter)
        : [...current, filter]
    );
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

    setSelectedKpiFilters([]);
    setSearchTerm('');
    setSmartResults([]);
    setDeepLinkedAction(null);
    setDeepLinkMessage(null);
    setAccessDeniedMessage(null);
    setAiCreatedMessage('IA Assistant action plan created successfully.');
    setAiCreatedPlanFocus({
      rootSujetId,
      sujetIds: createdSujetIds,
      actionId: firstActionId,
    });

    await fetchData();
  };

  useEffect(() => {
    if (!isAdminUser && viewMode === "all") {
      setViewMode("my");
    }
  }, [isAdminUser, viewMode]);

  const handleForceExpandConsumed = useCallback((sujetId: number | string) => {
    setAiCreatedPlanFocus((current) => {
      if (!current) return current;

      const remainingSujetIds = current.sujetIds.filter(
        (createdSujetId) => String(createdSujetId) !== String(sujetId)
      );

      if (remainingSujetIds.length === current.sujetIds.length) {
        return current;
      }

      return {
        ...current,
        sujetIds: remainingSujetIds,
      };
    });
  }, []);

  const refreshAfterStatusChange = async (options?: { refreshSmartSearch?: boolean }) => {
    await Promise.all([
      fetchData(),
      selectedKpiFilters.length ? fetchSelectedKpiActions() : Promise.resolve(),
      fetchEscalations(),
      options?.refreshSmartSearch && searchTerm.trim()
        ? smartSearchActions(searchTerm, {
            email: loggedUserEmail,
            scope: viewMode,
            scopedOnly: true,
          }).then(setSmartResults)
        : Promise.resolve(),
    ]);
  };

  const handleFlatStatusChange = async (actionId: number, newStatus: string, options: any) => {
    await updateActionStatus(dispatch, actionId, newStatus, options);
    await refreshAfterStatusChange();
  };

  const handleActionDeleted = async (deletedAction: any, result: any) => {
    const deletedIds = new Set(
      (result?.deleted_action_ids || [deletedAction.id]).map((id: any) => String(id))
    );

    setActionDeletedMessage('Action deleted.');
    setSmartResults((current) =>
      current.filter((action: any) => !deletedIds.has(String(action.id)))
    );
    setFilteredActionsByKpi((current) => {
      const next = { ...current };

      KPI_FILTER_ORDER.forEach((filter) => {
        next[filter] = (next[filter] || []).filter(
          (action: any) => !deletedIds.has(String(action.id))
        );
      });

      return next;
    });

    await Promise.all([
      fetchData(),
      selectedKpiFilters.length ? fetchSelectedKpiActions() : Promise.resolve(),
      fetchEscalations(),
    ]);
  };

  const handleEscalationStatusChange = async (
    escalationId: number | string,
    status: "seen" | "dismiss" | "resolve"
  ) => {
    await updateEscalationNotification(escalationId, status);
    await fetchEscalations();
  };

  const viewEscalationAction = (escalation: any) => {
    setActivePanel("actions");
    setSelectedKpiFilters([]);
    setSearchTerm(escalation.action_title || String(escalation.action_id || ""));
    navigate("/", { replace: true });

    window.setTimeout(() => {
      document.querySelector(".smart-search-results")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  };

  useEffect(() => {
    fetchData();
  }, [
    accessDeniedMessage,
    deepLinkMessage,
    dispatch,
    hasUnresolvedDeepLink,
    loggedUserEmail,
    targetActionId,
    viewMode,
  ]);

  useEffect(() => {
    fetchEscalations();
  }, [loggedUserEmail, isAdminUser, viewMode]);

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(window.location.search).get("tab");

    if (tabFromUrl === "escalations") {
      setActivePanel("escalations");
      setSelectedKpiFilters([]);
      setSearchTerm('');
      setSmartResults([]);
    }
  }, []);

  useEffect(() => {
    fetchSelectedKpiActions();
  }, [
    hasUnresolvedDeepLink,
    loggedUserEmail,
    selectedKpiFilters,
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
        setSelectedKpiFilters([]);
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

        const nextScope: HomeScope = access.scope === 'team'
          ? 'team'
          : access.scope === 'global' || access.scope === 'all'
            ? (isAdminUser ? 'all' : 'my')
          : access.scope === 'requester' || access.scope === 'requested_by_me'
            ? 'requested_by_me'
            : 'my';
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
  }, [targetActionId, loggedUserEmail, isAdminUser]);

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

      return true;
    });
  }, [smartResultsWithDeepLink, targetActionId]);
  const visibleSmartResults = useMemo(() => {
    return filterActionsByColumnFilters(filteredSmartResults, smartColumnFilters);
  }, [filteredSmartResults, smartColumnFilters]);
  const updateSmartColumnFilter = (field: string, value: string) => {
    setSmartColumnFilters((current: any) => ({ ...current, [field]: value }));
  };
  const clearSmartColumnFilters = () => setSmartColumnFilters(createEmptyActionColumnFilters());

  const activeKpiFilters = useMemo(() => {
    return KPI_FILTER_ORDER.filter((filter) => selectedKpiFilters.includes(filter));
  }, [selectedKpiFilters]);

  const visibleFilteredActionsByKpi = useMemo(() => {
    const visibleActions = createEmptyActionsByKpi();

    KPI_FILTER_ORDER.forEach((filter) => {
      visibleActions[filter] = (filteredActionsByKpi[filter] || []).filter((action: any) =>
        actionMatchesFlatKpiFilter(action, filter)
      );
    });

    return visibleActions;
  }, [filteredActionsByKpi]);

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
            {isAdminUser && <span className="admin-role-badge">Admin</span>}
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
              className={activePanel === "actions" && viewMode === "my" ? "view-tab active" : "view-tab"}
              onClick={() => selectActionScope("my")}
            >
              My Actions
            </button>

            <button
              className={activePanel === "actions" && viewMode === "team" ? "view-tab active" : "view-tab"}
              onClick={() => selectActionScope("team")}
            >
              Team Actions
            </button>

            <button
              className={activePanel === "actions" && viewMode === "requested_by_me" ? "view-tab active" : "view-tab"}
              onClick={() => selectActionScope("requested_by_me")}
            >
              Requested by Me
            </button>

            {isAdminUser && (
              <button
                className={activePanel === "actions" && viewMode === "all" ? "view-tab active" : "view-tab"}
                onClick={() => selectActionScope("all")}
              >
                All Actions
              </button>
            )}

            <button
              className={activePanel === "escalations" ? "view-tab active escalation-tab-button" : "view-tab escalation-tab-button"}
              onClick={openEscalationsPanel}
            >
              Escalations
              {escalations.length > 0 && (
                <span className="view-tab-badge">{escalations.length}</span>
              )}
            </button>
          </div>

          <div className="home-toolbar-right">
            {homeSummary && (
              <div className="toolbar-kpis" aria-label="Action filters">
                <button
                  type="button"
                  className={`stat-card stat-card-blue ${selectedKpiFilters.length === 0 ? "active-filter-card" : ""}`}
                  onClick={() => handleKpiClick("total")}
                >
                  <div className="stat-card-content">
                    <div>
                      <p className="stat-label">Total Topics</p>
                      <p className="stat-value">{homeSummary.total_sujets}</p>
                    </div>
                    <Folder size={18} className="stat-icon" />
                  </div>
                </button>

                <button
                  type="button"
                  className={`stat-card stat-card-green ${selectedKpiFilters.includes("closed") ? "active-filter-card" : ""}`}
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
                  className={`stat-card stat-card-orange ${selectedKpiFilters.includes("in_progress") ? "active-filter-card" : ""}`}
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
                  className={`stat-card stat-card-red ${selectedKpiFilters.includes("overdue") ? "active-filter-card" : ""}`}
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

                <button
                  type="button"
                  className={`stat-card stat-card-blocked ${selectedKpiFilters.includes("blocked") ? "active-filter-card" : ""}`}
                  onClick={() => handleKpiClick("blocked")}
                >
                  <div className="stat-card-content">
                    <div>
                      <p className="stat-label">Blocked</p>
                      <p className="stat-value">{homeSummary.actions_blocked}</p>
                    </div>
                    <Ban size={18} className="stat-icon" />
                  </div>
                </button>
              </div>
            )}

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
              onChange={(e) => {
                const nextValue = e.target.value;
                setSearchTerm(nextValue);

                if (nextValue.trim()) {
                  setActivePanel("actions");
                  setSelectedKpiFilters([]);
                }
              }}
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
                  aria-label="Close IA Assistant created plan banner"
                  onClick={() => setAiCreatedMessage(null)}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {actionDeletedMessage && (
            <div className="action-deep-link-banner action-deleted-banner">
              <div>
                <strong>{actionDeletedMessage}</strong>
                <span>The action was removed from active views. History and attachments are kept for audit.</span>
              </div>
              <div className="action-deep-link-actions">
                <button
                  type="button"
                  className="deep-link-close-button"
                  aria-label="Close action deleted banner"
                  onClick={() => setActionDeletedMessage(null)}
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

          {activePanel === "escalations" && (
            <div className="escalations-panel">
              <h2 className="main-title">
                <Bell className="main-title-icon" size={28} />
                Pending escalations
                <span className="main-title-count">({escalations.length})</span>
              </h2>

              {escalationsLoading ? (
                <p className="loading-text">Loading escalations...</p>
              ) : escalationsError ? (
                <div className="empty-state">
                  <AlertCircle size={56} className="empty-icon" />
                  <p className="empty-text">{escalationsError}</p>
                </div>
              ) : escalations.length > 0 ? (
                <div className="actions-table-wrapper escalations-table-wrapper">
                  <table className="actions-table escalations-table">
                    <thead>
                      <tr>
                        <th>Escalation level</th>
                        <th>Priority</th>
                        <th>Topic</th>
                        <th>Action title</th>
                        <th className="description-column">Description</th>
                        <th>Responsible</th>
                        <th>Requester</th>
                        <th>Due date</th>
                        <th>Status</th>
                        <th>Created at</th>
                        <th>History/action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {escalations.map((escalation: any) => (
                        <tr key={escalation.id} data-action-id={escalation.action_id}>
                          <td>
                            <span className="escalation-level-pill">
                              L{escalation.escalation_level ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span className="priority-pill">
                              {escalation.priority_index ?? '—'}
                            </span>
                          </td>
                          <td className="topic-path-cell">
                            {escalation.topic_path || escalation.topic || '—'}
                          </td>
                          <td className="action-table-title">
                            {escalation.action_title || '—'}
                          </td>
                          <td className="description-column">
                            <DescriptionCell text={escalation.description} />
                          </td>
                          <td>
                            <div className="person-cell">
                              <strong>{escalation.responsible || '—'}</strong>
                              <span>{escalation.email_responsable || ''}</span>
                            </div>
                          </td>
                          <td>
                            <div className="person-cell">
                              <strong>{escalation.requester || '—'}</strong>
                              <span>{escalation.email_demandeur || ''}</span>
                            </div>
                          </td>
                          <td>{escalation.due_date || '—'}</td>
                          <td>{escalation.status || '—'}</td>
                          <td>{escalation.created_at ? new Date(escalation.created_at).toLocaleString() : '—'}</td>
                          <td className="history-cell escalation-action-cell">
                            <button
                              type="button"
                              className="history-button"
                              onClick={() => setHistoryAction({
                                id: escalation.action_id,
                                titre: escalation.action_title,
                              })}
                            >
                              <History size={14} />
                              History
                            </button>
                            <button
                              type="button"
                              className="history-button"
                              onClick={() => viewEscalationAction(escalation)}
                            >
                              <Eye size={14} />
                              View
                            </button>
                            <button
                              type="button"
                              className="escalation-state-button"
                              onClick={() => handleEscalationStatusChange(escalation.id, "seen")}
                            >
                              Seen
                            </button>
                            <button
                              type="button"
                              className="escalation-state-button"
                              onClick={() => handleEscalationStatusChange(escalation.id, "dismiss")}
                            >
                              Dismiss
                            </button>
                            <button
                              type="button"
                              className="escalation-state-button resolve"
                              onClick={() => handleEscalationStatusChange(escalation.id, "resolve")}
                            >
                              <ShieldCheck size={14} />
                              Resolve
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <Bell size={56} className="empty-icon" />
                  <p className="empty-text">No pending escalations.</p>
                </div>
              )}
            </div>
          )}

          {activePanel === "actions" && selectedKpiFilters.length === 0 && searchTerm.trim() && (
  <div className="smart-search-results">
    <h2 className="main-title">
      <Search className="main-title-icon" size={28} />
      Smart search results
      <span className="main-title-count">({visibleSmartResults.length})</span>
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
                <th className="description-column">Description</th>
                <th>Responsable</th>
                <th>Requester</th>
                <th>Due date</th>
                <th>Application</th>
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
                    filters={smartColumnFilters}
                    onChange={updateSmartColumnFilter}
                    placeholder="#"
                  />
                </th>
                <th />
                <th className="description-column" />
                <th>
                  <ActionTableFilterControl
                    field="responsable"
                    filters={smartColumnFilters}
                    onChange={updateSmartColumnFilter}
                    placeholder="Responsible"
                  />
                </th>
                <th>
                  <ActionTableFilterControl
                    field="demandeur"
                    filters={smartColumnFilters}
                    onChange={updateSmartColumnFilter}
                    placeholder="Requester"
                  />
                </th>
                <th>
                  <ActionTableFilterControl
                    field="due_date"
                    filters={smartColumnFilters}
                    onChange={updateSmartColumnFilter}
                  />
                </th>
                <th />
                <th>
                  <ActionTableFilterControl
                    field="status"
                    filters={smartColumnFilters}
                    onChange={updateSmartColumnFilter}
                  />
                </th>
                <th>
                  <ActionTableFilterControl
                    field="urgency"
                    filters={smartColumnFilters}
                    onChange={updateSmartColumnFilter}
                  />
                </th>
                <th>
                  <ActionTableFilterControl
                    field="importance"
                    filters={smartColumnFilters}
                    onChange={updateSmartColumnFilter}
                  />
                </th>
                <th />
                <th />
                <th />
                <th>
                  {hasActiveActionColumnFilters(smartColumnFilters) && (
                    <button type="button" className="table-filter-clear" onClick={clearSmartColumnFilters}>
                      Clear
                    </button>
                  )}
                </th>
              </tr>
          </thead>

         <tbody>
  {visibleSmartResults.length === 0 && (
    <tr>
      <td colSpan={14} className="empty-filter-row">
        No actions match these column filters.
      </td>
    </tr>
  )}
  {visibleSmartResults.map((action: any) => (
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

      <td className="description-column">
        <span className="table-description-text" title={action.description || ''}>
          {action.description || '—'}
        </span>
      </td>

      <td>{action.responsable || '—'}</td>

      <td>
        <div className="person-cell">
          <strong>{action.demandeur || '—'}</strong>
          <span>{action.email_demandeur || ''}</span>
        </div>
      </td>

      <td>{action.due_date || '—'}</td>

      <td>
        {action.source_application && (
          <span className={`status-badge ${action.status?.toLowerCase() ?? 'open'}`}>
            {action.source_application}
          </span>
        )}

        {!action.source_application && action.rm_stock_app && (
          <a
            href="https://avocarbon-rm-stock.azurewebsites.net"
            className={`status-badge ${action.status?.toLowerCase() ?? 'open'}`}
            target="_blank"
            rel="noreferrer"
          >
            Raw material
          </a>
        )}

        {!action.source_application && action.corrective_action_app && (
          <a
            href="https://avocarbon-customer-complaint.azurewebsites.net/complaints"
            className={`status-badge ${action.status?.toLowerCase() ?? 'open'}`}
            target="_blank"
            rel="noreferrer"
          >
            Corrective action
          </a>
        )}

        {!action.source_application &&
          !action.rm_stock_app &&
          !action.corrective_action_app &&
          '-'}
      </td>

      <td>
       <StatusBadge
  status={action.status}
  actionId={action.id}
  onMenuToggle={() => {}}
  onStatusChange={async (actionId: number, newStatus: string, options: any) => {
    await updateActionStatus(dispatch, actionId, newStatus, options);
    await refreshAfterStatusChange({ refreshSmartSearch: true });
  }}
/>
      </td>
      <td>{action.urgency || '—'}</td>
      <td>{action.importance || '—'}</td>
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
      <td className="history-cell">
        <ActionDeleteButton
          action={action}
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
    ) : (
      <div className="empty-state">
        <Search size={56} className="empty-icon" />
        <p className="empty-text">No smart search results found</p>
      </div>
    )}
  </div>
)}
         {activePanel === "actions" && activeKpiFilters.length > 0 && (
  <div className="kpi-filtered-sections">
    {activeKpiFilters.map((filter) => (
      <section className="kpi-filtered-section" key={filter}>
    <h2 className="main-title">
      <FolderOpen className="main-title-icon" size={32} />
      {KPI_FILTER_LABELS[filter]} actions
      <span className="main-title-count">({visibleKpiCounts[filter] ?? visibleFilteredActionsByKpi[filter].length})</span>
    </h2>

    <FlatFilteredActionsTable
      actions={filteredActionsByKpi[filter]}
      loading={loadingByKpi[filter]}
      error={errorByKpi[filter]}
      filter={filter}
      onOpenHistory={setHistoryAction}
      onStatusChange={handleFlatStatusChange}
      onActionDeleted={handleActionDeleted}
      currentUserEmail={loggedUserEmail}
      viewMode={viewMode}
      showRequester={true}
      onVisibleCountChange={(count: number) => {
        setVisibleKpiCounts((current) => ({ ...current, [filter]: count }));
      }}
    />
      </section>
    ))}
  </div>
)}
         {activePanel === "actions" && !searchTerm.trim() && activeKpiFilters.length === 0 && (
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
            onForceExpandConsumed={handleForceExpandConsumed}
            onActionDeleted={handleActionDeleted}
            onActionStatusChanged={() => refreshAfterStatusChange()}
            loggedUserEmail={loggedUserEmail}
            viewMode={viewMode}
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
      scope={viewMode === "team" ? "team" : "my"}
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
