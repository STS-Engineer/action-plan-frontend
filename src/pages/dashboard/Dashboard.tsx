import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  Flame,
  RefreshCw,
  ShieldAlert,
  TrendingUp,
  Users,
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
  global: "Global",
};

const formatNumber = (value: any) => Number(value || 0).toLocaleString("en-GB");

export default function Dashboard() {
  const loggedUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [scope, setScope] = useState<"my" | "team" | "global">("my");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const supportedScopes = data?.supported_scopes || ["my", "team", "global"];

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
          <span>{loggedUser?.full_name || loggedUser?.email || "Current user"}</span>
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
          {(["my", "team", "global"] as const)
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
          <ParetoChart data={data?.people_late_pareto || []} barKey="overdue" barName="Late actions" />
        </ChartPanel>

        <ChartPanel title="Actions late vs in progress" icon={TrendingUp}>
          <StatusDistributionChart data={data?.status_distribution || []} />
        </ChartPanel>

        <ChartPanel title="Pareto - Urgency" icon={Flame}>
          <ParetoChart data={data?.urgency_pareto || []} barKey="count" barName="Actions" />
        </ChartPanel>

        <ChartPanel title="Priority distribution" icon={ShieldAlert}>
          <PriorityChart data={data?.priority_distribution || []} />
        </ChartPanel>

        <ChartPanel title="Departments with late actions" icon={BarChart3}>
          <SimpleBarChart data={data?.department_overdue || []} dataKey="overdue" />
        </ChartPanel>

        <ChartPanel title="Sites with late actions" icon={BarChart3}>
          <SimpleBarChart data={data?.site_overdue || []} dataKey="overdue" />
        </ChartPanel>
      </section>
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

function ParetoChart({ data, barKey, barName }: any) {
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
        <Bar yAxisId="left" dataKey={barKey} name={barName} fill={COLORS.blue} radius={[6, 6, 0, 0]} />
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

function StatusDistributionChart({ data }: any) {
  const visibleData = (data || []).filter((item: any) => item.value > 0);

  if (!visibleData.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={visibleData}
          dataKey="value"
          nameKey="name"
          innerRadius={46}
          outerRadius={74}
          paddingAngle={2}
          label={({ name, value }) => `${name}: ${value}`}
        >
          {visibleData.map((entry: any, index: number) => (
            <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function PriorityChart({ data }: any) {
  if (!data?.some((item: any) => item.count > 0)) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="count" name="Actions" radius={[6, 6, 0, 0]}>
          {data.map((entry: any, index: number) => (
            <Cell key={entry.name} fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function SimpleBarChart({ data, dataKey }: any) {
  if (!data?.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 6, right: 8, left: 34, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={88} tick={{ fontSize: 10 }} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey={dataKey} name="Late actions" fill={COLORS.orange} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
