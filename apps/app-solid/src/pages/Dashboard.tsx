import { microAppSDK } from '@micro-fe/fragment-elements/sdk';
import { Component, createSignal, onMount } from 'solid-js';

const Dashboard: Component = () => {
  const [stats, setStats] = createSignal({
    totalUsers: 0,
    activeProjects: 0,
    revenue: 0,
  });

  onMount(() => {
    const mockStats = {
      activeProjects: 12,
      revenue: 45230.5,
      totalUsers: 1543,
    };

    setTimeout(() => {
      setStats(mockStats);
      microAppSDK.notifyStateChange({ page: 'dashboard', stats: mockStats });
    }, 500);
  });

  const refreshData = () => {
    const updated = {
      activeProjects: stats().activeProjects + Math.floor(Math.random() * 5),
      revenue: stats().revenue + Math.random() * 1000,
      totalUsers: stats().totalUsers + Math.floor(Math.random() * 50),
    };

    setStats(updated);
    microAppSDK.notifyStateChange({ page: 'dashboard', stats: updated });
    microAppSDK.emit('dashboard-updated', updated);
  };

  return (
    <div class="page">
      <h2>Dashboard</h2>
      <p>Real-time metrics and analytics</p>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">{stats().totalUsers.toLocaleString()}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Active Projects</div>
          <div class="stat-value">{stats().activeProjects}</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Revenue</div>
          <div class="stat-value">${stats().revenue.toLocaleString()}</div>
        </div>
      </div>

      <div class="card">
        <h3>Actions</h3>
        <button onClick={refreshData} class="btn">
          Refresh Data
        </button>
      </div>

      <style>
        {`
          .page {
            max-width: 1000px;
            margin: 0 auto;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
          }

          .stat-card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            text-align: center;
          }

          .stat-label {
            color: #718096;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 0.5rem;
          }

          .stat-value {
            color: #2c7a7b;
            font-size: 2rem;
            font-weight: bold;
          }

          .card {
            background: white;
            border-radius: 8px;
            padding: 1.5rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .card h3 {
            margin-top: 0;
            color: #2c7a7b;
          }

          .btn {
            background: #2c7a7b;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.2s;
          }

          .btn:hover {
            background: #234e52;
          }

          .btn:active {
            transform: translateY(1px);
          }
        `}
      </style>
    </div>
  );
};

export default Dashboard;
