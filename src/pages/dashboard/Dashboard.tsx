import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  ExternalLink,
  Flame,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axiosInstance from "../../services/axiosInstance";
import { buildActionDeepLink } from "../../utils/actionDeepLink";
import "./Dashboard.css";

const COLORS = {
  blue: "#2563eb",
  green: "#059669",
  orange: "#ea580c",
  red: "#dc2626",
  amber: "#d97706",
  slate: "#475569",
  teal: "#0f766e",
  violet: "#7c3aed",
};

const STATUS_COLORS = [COLORS.blue, COLORS.red, COLORS.green];
const PRIORITY_COLORS = [COLORS.red, COLORS.orange, COLORS.amber, COLORS.green, COLORS.slate];

const scopeLabels: Record<string, string> = {
  my: "My Actions",
  team: "Team Actions",
  all: "All Actions",
  global: "Global",
};

const formatNumber = (value: any) => Number(value || 0).toLocaleString("en-GB");

const formatEmpty = (value: any) => (
  value === null || value === undefined || value === "" ? "-" : value
);

const getChartBucket = (entry: any) => entry?.name || entry?.payload?.name;

const getDisplayBucket = (chart: string, bucket: string) => {
  if (chart === "late_vs_in_progress") {
    const normalizedBucket = String(bucket || "").trim().toLowerCase();

    if (normalizedBucket === "overdue" || normalizedBucket === "late") {
      return "Late";
    }

    if (normalizedBucket === "in progress" || normalizedBucket === "in_progress") {
      return "In progress";
    }
  }

  return bucket;
};

const getDrilldownTitle = (chart: string, bucket: string) => {
  const displayBucket = getDisplayBucket(chart, bucket);

  switch (chart) {
    case "priority_distribution":
      return `Priority: ${displayBucket} actions`;
    case "urgency_pareto":
      return `Urgency: ${displayBucket} actions`;
    case "people_late_pareto":
      return `Late actions for ${displayBucket}`;
    case "department_overdue":
      return `Late actions in ${displayBucket}`;
    case "site_overdue":
      return `Late actions at ${displayBucket}`;
    case "late_vs_in_progress":
    case "status_distribution":
      return `${displayBucket} actions`;
    default:
      return `${displayBucket} actions`;
  }
};

export default function Dashboard() {
  const loggedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);
  const isAdminUser = String(loggedUser?.role || "").trim().toLowerCase() === "admin";

  const [scope, setScope] = useState<"my" | "team" | "all">(
    isAdminUser ? "all" : "my"
  );
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drilldown, setDrilldown] = useState<any>({
    open: false,
    loading: false,
    error: null,
    chart: null,
    bucket: null,
    title: "",
    count: 0,
    actions: [],
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get("/api/dashboard/overview", {
        params: {
          email: loggedUser?.email || undefined,
          scope,
        },
      });

      setData(response.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [scope]);

  useEffect(() => {
    if (!isAdminUser && scope === "all") {
      setScope("my");
    }
  }, [isAdminUser, scope]);

  const supportedScopes = data?.supported_scopes || ["my", "team"];

  const openDrilldown = async (chart: string, bucket: string) => {
    if (!chart || !bucket) return;

    setDrilldown({
      open: true,
      loading: true,
      error: null,
      chart,
      bucket,
      title: getDrilldownTitle(chart, bucket),
      count: 0,
      actions: [],
    });

    try {
      const response = await axiosInstance.get("/api/dashboard/drilldown", {
        params: {
          email: loggedUser?.email || undefined,
          scope,
          chart,
          bucket,
        },
      });

      setDrilldown((current: any) => ({
        ...current,
        loading: false,
        error: null,
        count: response.data?.count || 0,
        actions: response.data?.actions || [],
      }));
    } catch (err: any) {
      setDrilldown((current: any) => ({
        ...current,
        loading: false,
        error: err?.response?.data?.detail || err?.message || "Unable to load actions.",
      }));
    }
  };

  const closeDrilldown = () => {
    setDrilldown((current: any) => ({
      ...current,
      open: false,
      loading: false,
      error: null,
    }));
  };

  if (loading && !data) {
    return (
      <div className="dashboard-loading">
        <div>
          <div className="dashboard-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-error-state">
          <AlertCircle size={44} />
          <p>{error}</p>
          <button type="button" onClick={fetchDashboard}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">Executive overview</p>
          <h1>Action Plan Dashboard</h1>
          <span>
            {loggedUser?.full_name || loggedUser?.email || "Current user"}
            {isAdminUser && <span className="dashboard-admin-badge">Admin</span>}
          </span>
        </div>

        <div className="dashboard-header-actions">
          <a href="/" className="dashboard-back-button">
            <ArrowLeft size={18} />
            Back
          </a>

          <button
            type="button"
            className="dashboard-refresh-button"
            onClick={fetchDashboard}
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? "is-spinning" : ""} />
            Refresh
          </button>
        </div>
      </header>

      <section className="dashboard-toolbar">
        <div className="dashboard-scope-tabs" aria-label="Dashboard scope">
          {(["my", "team", "all"] as const)
            .filter((item) => supportedScopes.includes(item))
            .map((item) => (
              <button
                key={item}
                type="button"
                className={scope === item ? "active" : ""}
                onClick={() => setScope(item)}
              >
                {scopeLabels[item]}
              </button>
            ))}
        </div>

        {error && <span className="dashboard-inline-error">{error}</span>}
      </section>

      <section className="dashboard-chart-grid">
        <ChartPanel title="Pareto - People with late actions" icon={Users} large>
          <ParetoChart
            data={data?.people_late_pareto || []}
            barKey="overdue"
            barName="Late actions"
            chartKey="people_late_pareto"
            onDrilldown={openDrilldown}
          />
        </ChartPanel>

        <ChartPanel title="Actions late vs in progress" icon={TrendingUp}>
          <StatusDistributionChart
            data={data?.status_distribution || []}
            chartKey="late_vs_in_progress"
            onDrilldown={openDrilldown}
          />
        </ChartPanel>

        <ChartPanel title="Pareto - Urgency" icon={Flame}>
          <ParetoChart
            data={data?.urgency_pareto || []}
            barKey="count"
            barName="Actions"
            chartKey="urgency_pareto"
            onDrilldown={openDrilldown}
          />
        </ChartPanel>

        <ChartPanel title="Priority distribution" icon={ShieldAlert}>
          <PriorityChart
            data={data?.priority_distribution || []}
            onDrilldown={openDrilldown}
          />
        </ChartPanel>

        <ChartPanel title="Departments with late actions" icon={BarChart3}>
          <SimpleBarChart
            data={data?.department_overdue || []}
            dataKey="overdue"
            chartKey="department_overdue"
            onDrilldown={openDrilldown}
          />
        </ChartPanel>

        <ChartPanel title="Sites with late actions" icon={BarChart3}>
          <SimpleBarChart
            data={data?.site_overdue || []}
            dataKey="overdue"
            chartKey="site_overdue"
            onDrilldown={openDrilldown}
          />
        </ChartPanel>
      </section>

      {drilldown.open && (
        <DrilldownModal
          drilldown={drilldown}
          onClose={closeDrilldown}
        />
      )}
    </div>
  );
}

function ChartPanel({ title, icon: Icon, large = false, children }: any) {
  return (
    <article className={`dashboard-chart-panel ${large ? "large" : ""}`}>
      <div className="chart-panel-title">
        <Icon size={16} />
        <h2>{title}</h2>
      </div>
      <div className="chart-frame">{children}</div>
    </article>
  );
}

function EmptyChart() {
  return <div className="dashboard-empty">No data available.</div>;
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((entry: any) => (
        <span key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}: {formatNumber(entry.value)}
          {entry.dataKey === "cumulative_percent" ? "%" : ""}
        </span>
      ))}
    </div>
  );
}

function ParetoChart({ data, barKey, barName, chartKey, onDrilldown }: any) {
  if (!data?.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={46} />
        <YAxis yAxisId="left" tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Bar
          yAxisId="left"
          dataKey={barKey}
          name={barName}
          fill={COLORS.blue}
          radius={[6, 6, 0, 0]}
          cursor="pointer"
          onClick={(entry: any) => onDrilldown?.(chartKey, getChartBucket(entry))}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="cumulative_percent"
          name="Cumulative %"
          stroke={COLORS.red}
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

function StatusDistributionChart({ data, chartKey, onDrilldown }: any) {
  const visibleData = (data || []).filter((item: any) => item.value > 0);

  if (!visibleData.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart margin={{ top: 2, right: 2, bottom: 18, left: 2 }}>
        <Pie
          data={visibleData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="42%"
          innerRadius={40}
          outerRadius={64}
          paddingAngle={2}
          labelLine={false}
          label={({ value }) => `${value}`}
          onClick={(entry: any) => onDrilldown?.(chartKey, getChartBucket(entry))}
          cursor="pointer"
        >
          {visibleData.map((entry: any, index: number) => (
            <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          verticalAlign="bottom"
          align="center"
          iconSize={8}
          wrapperStyle={{ bottom: 0, fontSize: 10, lineHeight: "14px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PriorityChart({ data, onDrilldown }: any) {
  if (!data?.some((item: any) => item.count > 0)) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar
          dataKey="count"
          name="Actions"
          radius={[6, 6, 0, 0]}
          cursor="pointer"
          onClick={(entry: any) => onDrilldown?.("priority_distribution", getChartBucket(entry))}
        >
          {data.map((entry: any, index: number) => (
            <Cell key={entry.name} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SimpleBarChart({ data, dataKey, chartKey, onDrilldown }: any) {
  if (!data?.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 6, right: 8, left: 34, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        <Bar
          dataKey={dataKey}
          name="Late actions"
          fill={COLORS.orange}
          radius={[0, 6, 6, 0]}
          cursor="pointer"
          onClick={(entry: any) => onDrilldown?.(chartKey, getChartBucket(entry))}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DrilldownModal({ drilldown, onClose }: any) {
  return (
    <div className="drilldown-modal-overlay" onClick={onClose}>
      <section
        className="drilldown-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drilldown-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="drilldown-modal-header">
          <div>
            <h3 id="drilldown-modal-title">{drilldown.title}</h3>
            <span>{formatNumber(drilldown.count)} actions</span>
          </div>

          <button
            type="button"
            className="drilldown-close-button"
            onClick={onClose}
            aria-label="Close drilldown"
          >
            <X size={18} />
          </button>
        </header>

        {drilldown.loading && (
          <div className="drilldown-state">Loading actions...</div>
        )}

        {!drilldown.loading && drilldown.error && (
          <div className="drilldown-error">{drilldown.error}</div>
        )}

        {!drilldown.loading && !drilldown.error && drilldown.actions.length === 0 && (
          <div className="drilldown-state">No actions found for this chart segment.</div>
        )}

        {!drilldown.loading && !drilldown.error && drilldown.actions.length > 0 && (
          <div className="drilldown-table-wrapper">
            <table className="drilldown-table">
              <thead>
                <tr>
                  <th>Priority</th>
                  <th>Topic</th>
                  <th>Action</th>
                  <th>Responsible</th>
                  <th>Requester</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th>Urgency</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {drilldown.actions.map((action: any) => (
                  <tr key={action.id}>
                    <td>
                      <span className="drilldown-priority-pill">
                        {formatEmpty(action.priority_index)}
                      </span>
                    </td>
                    <td>{formatEmpty(action.topic_path)}</td>
                    <td className="drilldown-action-title">{formatEmpty(action.titre)}</td>
                    <td>
                      <div className="drilldown-person">
                        <strong>{formatEmpty(action.responsable)}</strong>
                        <span>{formatEmpty(action.email_responsable)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="drilldown-person">
                        <strong>{formatEmpty(action.demandeur)}</strong>
                        <span>{formatEmpty(action.email_demandeur)}</span>
                      </div>
                    </td>
                    <td>{formatEmpty(action.due_date)}</td>
                    <td>
                      <span className={`drilldown-status ${action.canonical_status || "unknown"}`}>
                        {formatEmpty(action.status || action.canonical_status)}
                      </span>
                    </td>
                    <td>{formatEmpty(action.urgency)}</td>
                    <td>
                      <a
                        className="drilldown-view-link"
                        href={buildActionDeepLink(action.id)}
                      >
                        <ExternalLink size={13} />
                        View action
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
