// src/components/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { getSurveys, getSurveyResults } from '../services/api'; 
import SurveyManager from './SurveyManager';
import EmployeeManager from './EmployeeManager';

// -----------------------------------------------------------------
// A. SurveyResultsViewer (Extracted for Dashboard Content)
// -----------------------------------------------------------------
const SurveyResultsViewer = ({ 
    surveys, 
    error, 
    fetchResults, 
    selectedSurveyId, 
    setSelectedSurveyId, 
    results, 
    setError 
}) => {
    
    // Helper function for display (You'll style these classes in CSS)
    const getSentimentClass = (sentiment) => {
        if (sentiment === 'positive') return 'sentiment-positive';
        if (sentiment === 'negative') return 'sentiment-negative';
        return 'sentiment-neutral';
    };
    
    const getRiskClass = (risk) => {
        if (risk === 'high') return 'risk-high';
        if (risk === 'low') return 'risk-low';
        return 'risk-medium';
    };

    return (
        <div className="admin-module">
            <h2>📊 Survey Results & Analytics</h2>
            
            <div className="card filter-card">
                <h4 className="card-header">Select Survey for Analysis</h4>
                <div className="form-group-inline">
                    <select 
                        id="survey-select" 
                        className="form-control"
                        value={selectedSurveyId} 
                        onChange={(e) => setSelectedSurveyId(e.target.value)}
                    >
                        <option value="">-- Choose Survey --</option>
                        {surveys.map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                    <button 
                        onClick={fetchResults} 
                        className="primary-btn small-btn" 
                        disabled={!selectedSurveyId}
                    >
                        Analyze Results
                    </button>
                </div>
            </div>

            {error && <p className="message error">{error}</p>}
            
            {/* Results Table Card */}
            {results.length > 0 && (
                <div className="card result-card">
                    <h4 className="card-header">Results Summary (Total Responses: {results.length})</h4>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User ID</th>
                                <th>Sentiment</th>
                                <th>Burnout Risk</th>
                                <th>Response Snippet</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map(r => (
                                <tr key={r.id} className="data-row">
                                    <td>{r.user_id}</td>
                                    <td className={`data-cell ${getSentimentClass(r.sentiment)}`}>{r.sentiment || 'N/A'}</td>
                                    <td className={`data-cell ${getRiskClass(r.burnout_risk)}`}>{r.burnout_risk || 'N/A'}</td>
                                    <td>
                                        <span title={JSON.stringify(r.answers)}>
                                            {JSON.stringify(r.answers).substring(0, 50)}...
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {results.length === 0 && selectedSurveyId && !error && (
                <p className="message info no-results">No responses found for this survey yet.</p>
            )}
        </div>
    );
};

// -----------------------------------------------------------------
// B. Main Admin Dashboard Container
// -----------------------------------------------------------------
const AdminDashboard = () => {
    const [activeView, setActiveView] = useState('results'); 
    const [surveys, setSurveys] = useState([]);
    const [selectedSurveyId, setSelectedSurveyId] = useState('');
    const [results, setResults] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSurveys();
    }, []);

    const fetchSurveys = async () => { /* ... (Logic remains the same) ... */ };
    const fetchResults = async () => { /* ... (Logic remains the same) ... */ };

    const renderContent = () => {
        switch (activeView) {
            case 'survey':
                return <SurveyManager surveys={surveys} refreshSurveys={fetchSurveys} />; 
            case 'employee':
                return <EmployeeManager surveys={surveys} />;
            case 'results':
            default:
                return (
                    <SurveyResultsViewer 
                        surveys={surveys}
                        error={error}
                        fetchResults={fetchResults}
                        selectedSurveyId={selectedSurveyId}
                        setSelectedSurveyId={setSelectedSurveyId}
                        results={results}
                        setError={setError}
                    />
                );
        }
    };

    return (
        <div className="admin-layout-wrapper">
            <h1 className="dashboard-header">Admin Control Panel ⚙️</h1>
            <div className="dashboard-content-grid">
                
                {/* --- PROFESSIONAL NAVIGATION SIDEBAR --- */}
                <nav className="admin-sidebar card">
                    <h4 className="sidebar-title">Management Tools</h4>
                    
                    <button 
                        className={`sidebar-link ${activeView === 'survey' ? 'active' : ''}`}
                        onClick={() => setActiveView('survey')}>
                        📋 Survey Management
                    </button>
                    
                    <button 
                        className={`sidebar-link ${activeView === 'employee' ? 'active' : ''}`}
                        onClick={() => setActiveView('employee')}>
                        🧑‍💼 Employee Management
                    </button>
                    
                    <button 
                        className={`sidebar-link ${activeView === 'results' ? 'active' : ''}`}
                        onClick={() => setActiveView('results')}>
                        📊 View Survey Results
                    </button>
                    
                    <div className="sidebar-separator"></div>

                    
                </nav>

                {/* --- MAIN CONTENT AREA --- */}
                <main className="main-content-area">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;