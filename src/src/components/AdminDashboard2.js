import React, { useState, useEffect } from 'react';
import { getSurveys, getSurveyResults } from '../services/api'; 

const AdminDashboard = () => {
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
    } catch (err) {
      setError('Failed to load surveys.');
    }
  };

  const fetchResults = async () => {
    if (!selectedSurveyId) return;
    setError('');
    setResults([]);
    try {
      const analysisResults = await getSurveyResults(selectedSurveyId);
      setResults(analysisResults);
    } catch (err) {
      setError('Failed to fetch survey results. Check console for details.');
    }
  };

  const getSentimentClass = (sentiment) => {
    if (sentiment === 'positive') return 'sentiment-positive';
    if (sentiment === 'negative') return 'sentiment-negative';
    return '';
  };
  
  const getRiskClass = (risk) => {
    if (risk === 'high') return 'risk-high';
    if (risk === 'low') return 'risk-low';
    return '';
  };

  return (
    <div className="container">
      <h2>Admin Dashboard: Survey Analytics</h2>
      
      <div className="form-group" style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
        <label htmlFor="survey-select" style={{width: '200px', margin: '0'}}>Select Survey for Analysis:</label>
        <select 
          id="survey-select" 
          value={selectedSurveyId} 
          onChange={(e) => setSelectedSurveyId(e.target.value)}
          style={{flexGrow: 1}}
        >
          <option value="">-- Choose Survey --</option>
          {surveys.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
        <button onClick={fetchResults} className="primary" disabled={!selectedSurveyId}>
          View Results
        </button>
      </div>

      {error && <p className="message error">{error}</p>}
      
      {results.length > 0 && (
        <>
          <h3 style={{marginTop: '30px'}}>Results for Survey ID: {selectedSurveyId} ({results.length} Responses)</h3>
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Sentiment</th>
                <th>Burnout Risk</th>
                <th>Answers (JSON)</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
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
      {results.length === 0 && selectedSurveyId && !error && (
        <p style={{marginTop: '30px'}}>No responses found for this survey.</p>
      )}
    </div>
  );
};

export default AdminDashboard;