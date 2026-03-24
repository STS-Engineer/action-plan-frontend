import { useDispatch, useSelector } from 'react-redux';
import './Home.css';
import { useEffect, useMemo, useState } from 'react';
import { getStatistics, getSujetsRacineList } from '../../redux/sujet/sujet';
import { AlertCircle, CheckCircle2, Clock, Folder, FolderOpen, Search } from 'lucide-react';
import { ItemCard } from '../../components/ItemCard';
import { Sujet } from '../../redux/sujet/sujet-slice-types';
import Select from 'react-select';
import { getEmails } from '../../redux/action/action';

const Home = () => {
  const dispatch = useDispatch();
  const { sujetsRacineList = [], statistics } = useSelector((state: any) => state.sujet);
  const { emailsList = [] } = useSelector((state: any) => state.action);

  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [email, setEmail] = useState<string | null>(null);

  const fetchData = async () => {
    try {
        const isInitial = !sujetsRacineList.length && !statistics;
        if (isInitial) setInitialLoading(true);
        else setRefreshing(true);
        setError(null);

        await Promise.all([
        getSujetsRacineList(dispatch, email),
        getStatistics(dispatch),
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
  }, [dispatch, email]);

  const filteredSujets = useMemo(() => {
    if (!searchTerm.trim()) return sujetsRacineList;

    const term = searchTerm.toLowerCase();

    return sujetsRacineList.filter((sujet: Sujet) =>
      sujet.titre?.toLowerCase().includes(term) ||
      sujet.description?.toLowerCase().includes(term)
    );
  }, [searchTerm, sujetsRacineList]);

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

        {statistics && (
          <div className="stats-grid">
            <div className="stat-card stat-card-blue">
              <div className="stat-card-content">
                <div>
                  <p className="stat-label">Total topics</p>
                  <p className="stat-value">{statistics.total_sujets}</p>
                </div>
                <Folder size={48} className="stat-icon" />
              </div>
            </div>

            <div className="stat-card stat-card-green">
              <div className="stat-card-content">
                <div>
                  <p className="stat-label">Completed</p>
                  <p className="stat-value">{statistics.actions_completed}</p>
                </div>
                <CheckCircle2 size={48} className="stat-icon" />
              </div>
            </div>

            <div className="stat-card stat-card-orange">
              <div className="stat-card-content">
                <div>
                  <p className="stat-label">In progress</p>
                  <p className="stat-value">{statistics.actions_in_progress}</p>
                </div>
                <Clock size={48} className="stat-icon" />
              </div>
            </div>

            <div className="stat-card stat-card-red">
              <div className="stat-card-content">
                <div>
                  <p className="stat-label">Overdue</p>
                  <p className="stat-value">{statistics.actions_overdue}</p>
                </div>
                <AlertCircle size={48} className="stat-icon" />
              </div>
            </div>
          </div>
        )}

        <div className="main-content">
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
  );
};

export default Home;
