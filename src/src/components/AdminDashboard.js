// src/components/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { getSurveys, getSurveyResults } from '../services/api';
import SurveyManager from './SurveyManager';
import EmployeeManager from './EmployeeManager';
import AnalysisDashboard from './AnalysisDashboard';

// --- Survey Analysis Module (formerly SurveyResultsViewer) ---
const SurveyAnalysisModule = ({
  surveys,
  error,
  fetchResults,
  selectedSurveyId,
  setSelectedSurveyId,
  results,
  setError,
  setResults
}) => {
  const [showRawData, setShowRawData] = useState(false);

  const getSentimentClass = (sentiment) => {
    if (sentiment && sentiment.toLowerCase() === 'positive') return 'sentiment-positive';
    if (sentiment && sentiment.toLowerCase() === 'negative') return 'sentiment-negative';
    return '';
  };

  const getRiskClass = (risk) => {
    if (risk && risk.toLowerCase() === 'high') return 'risk-high';
    if (risk && risk.toLowerCase() === 'low') return 'risk-low';
    return '';
  };

  return (
    <div className="container">
      <h3>📊 Survey Analytics & Results</h3>

      {/* Survey Selector */}
      <div
        className="form-group"
        style={{
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <label htmlFor="survey-select" style={{ width: '200px', margin: '0' }}>
          Select Survey:
        </label>
        <select
          id="survey-select"
          value={selectedSurveyId}
          onChange={(e) => {
            setSelectedSurveyId(e.target.value);
            if (e.target.value) {
              fetchResults(e.target.value);
            } else {
              setResults([]);
            }
          }}
          style={{ flexGrow: 1 }}
        >
          <option value="">-- Choose Survey --</option>
          {surveys.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="message error">{error}</p>}

      {/* CONDITIONAL CONTENT */}
      {selectedSurveyId && results.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
            <button
              className="secondary"
              onClick={() => setShowRawData(!showRawData)}
              style={{ padding: '5px 10px', fontSize: '14px' }}
            >
              {showRawData ? '↩️ Back to Charts' : '🔍 View Raw Data Table'}
            </button>
          </div>

          {!showRawData ? (
            <AnalysisDashboard surveyId={selectedSurveyId} />
          ) : (
            <>
              <h4 style={{ marginTop: '20px' }}>Raw Responses ({results.length} Total)</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Sentiment</th>
                    <th>Burnout Risk</th>
                    <th>Answers (JSON Preview)</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id}>
                      <td>{r.user_id}</td>
                      <td className={getSentimentClass(r.sentiment)}>{r.sentiment || 'N/A'}</td>
                      <td className={getRiskClass(r.burnout_risk)}>{r.burnout_risk || 'N/A'}</td>
                      <td>{JSON.stringify(r.answers).substring(0, 100)}...</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}

      {results.length === 0 && selectedSurveyId && !error && (
        <p style={{ marginTop: '30px' }}>No responses found for the selected survey.</p>
      )}
    </div>
  );
};

// --- Main Admin Dashboard Container ---
const AdminDashboard = () => {
  const [activeView, setActiveView] = useState('analytics');
  const [surveys, setSurveys] = useState([]);
  const [selectedSurveyId, setSelectedSurveyId] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const surveyList = await getSurveys();
      setSurveys(surveyList);
      setError('');
    } catch (err) {
      setError('Failed to load surveys.');
    }
  };

  const fetchResults = async (surveyId) => {
    if (!surveyId) return;
    setError('');
    setResults([]);
    try {
      const analysisResults = await getSurveyResults(surveyId);
      setResults(analysisResults);
    } catch (err) {
      setError('Failed to fetch survey results.');
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'survey':
        return <SurveyManager surveys={surveys} refreshSurveys={fetchSurveys} />;
      case 'employee':
        return <EmployeeManager surveys={surveys} />;
      case 'analytics':
      default:
        return (
          <SurveyAnalysisModule
            surveys={surveys}
            error={error}
            fetchResults={fetchResults}
            selectedSurveyId={selectedSurveyId}
            setSelectedSurveyId={setSelectedSurveyId}
            results={results}
            setResults={setResults}
            setError={setError}
          />
        );
    }
  };

  return (
    <div className="admin-module">
      <h1 className="dashboard-title">Admin Control Panel</h1>
      <div className="dashboard-content">
        {/* --- Sidebar Navigation --- */}
        <nav className="sidebar">
          <button
            className={activeView === 'survey' ? 'active' : ''}
            onClick={() => setActiveView('survey')}
          >
            📋 Survey Management
          </button>
          <button
            className={activeView === 'employee' ? 'active' : ''}
            onClick={() => setActiveView('employee')}
          >
            🧑‍💼 Employee Management
          </button>
          <button
            className={activeView === 'analytics' ? 'active' : ''}
            onClick={() => setActiveView('analytics')}
          >
            📊 Survey Analytics
          </button>
        </nav>

        {/* --- Main Content Area --- */}
        <main className="main-panel">{renderContent()}</main>
      </div>
    </div>
  );
};

export default AdminDashboard;
