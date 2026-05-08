import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, BarChart3, CheckCircle2, Clock, Flame, Users } from "lucide-react";
import axiosInstance from "../../services/axiosInstance";
import "./Dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get("/api/dashboard/overview");
      setData(response.data);
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-loading">
        <AlertCircle size={48} />
        <p>{error}</p>
        <button onClick={fetchDashboard}>Retry</button>
      </div>
    );
  }

  const global = data?.global || {};

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>VP Activity Dashboard</h1>
          <p>Executive overview of action plan performance</p>
        </div>

        <a href="/" className="back-button">
          <ArrowLeft size={18} />
          Back to action plan
        </a>
      </div>

      <div className="dashboard-kpis">
        <div className="dashboard-card blue">
          <div>
            <p>Total actions</p>
            <h2>{global.total || 0}</h2>
          </div>
          <BarChart3 size={38} />
        </div>

        <div className="dashboard-card orange">
          <div>
            <p>Open actions</p>
            <h2>{global.open || 0}</h2>
          </div>
          <Clock size={38} />
        </div>

        <div className="dashboard-card green">
          <div>
            <p>Closed actions</p>
            <h2>{global.closed || 0}</h2>
          </div>
          <CheckCircle2 size={38} />
        </div>

        <div className="dashboard-card red">
          <div>
            <p>Late actions</p>
            <h2>{global.late || 0}</h2>
          </div>
          <AlertCircle size={38} />
        </div>

        <div className="dashboard-card purple">
          <div>
            <p>Escalation ready</p>
            <h2>{global.escalation_ready || 0}</h2>
          </div>
          <Flame size={38} />
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardTable
          title="Top responsables with late actions"
          columns={["Name", "Total", "Open", "Late", "Escalation"]}
          rows={(data?.top_responsables || []).map((item: any) => [
            item.name,
            item.total,
            item.open,
            item.late,
            item.escalation_ready,
          ])}
        />

        <DashboardTable
          title="Top sites"
          columns={["Site", "Total", "Open", "Late", "Escalation"]}
          rows={(data?.top_sites || []).map((item: any) => [
            item.site,
            item.total,
            item.open,
            item.late,
            item.escalation_ready,
          ])}
        />

        <DashboardTable
          title="Top departments"
          columns={["Department", "Total", "Open", "Late", "Escalation"]}
          rows={(data?.top_departments || []).map((item: any) => [
            item.department,
            item.total,
            item.open,
            item.late,
            item.escalation_ready,
          ])}
        />

        <div className="dashboard-panel">
          <div className="panel-title">
            <Users size={20} />
            Urgency / Importance
          </div>

          <div className="mini-grid">
            <MiniStats title="By urgency" data={data?.by_urgency || {}} />
            <MiniStats title="By importance" data={data?.by_importance || {}} />
          </div>
        </div>
      </div>

      <div className="dashboard-panel full-width">
        <div className="panel-title">
          <Flame size={20} />
          Critical late actions
        </div>

        <div className="table-wrapper">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Action</th>
                <th>Responsable</th>
                <th>Due date</th>
                <th>Site</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {(data?.top_late_actions || []).map((action: any) => (
                <tr key={action.id}>
                  <td>{action.priority_index || "—"}</td>
                  <td className="strong">{action.titre || "—"}</td>
                  <td>{action.responsable || "—"}</td>
                  <td>{action.due_date || "—"}</td>
                  <td>{action.site || "—"}</td>
                  <td>{action.department || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function DashboardTable({ title, columns, rows }: any) {
  return (
    <div className="dashboard-panel">
      <div className="panel-title">
        <BarChart3 size={20} />
        {title}
      </div>

      <div className="table-wrapper">
        <table className="dashboard-table">
          <thead>
            <tr>
              {columns.map((column: string) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row: any[], index: number) => (
              <tr key={index}>
                {row.map((cell: any, cellIndex: number) => (
                  <td key={cellIndex} className={cellIndex === 0 ? "strong" : ""}>
                    {cell ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MiniStats({ title, data }: any) {
  return (
    <div className="mini-card">
      <h3>{title}</h3>

      {Object.entries(data).map(([key, value]: any) => (
        <div className="mini-row" key={key}>
          <span>{key}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}