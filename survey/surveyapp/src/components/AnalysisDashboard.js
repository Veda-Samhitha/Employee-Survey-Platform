// components/AnalysisDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LineChart from './Charts/LineChart';
import AreaChart from './Charts/AreaChart';
import BarChart from './Charts/BarChart';
import PieChart from './Charts/PieChart';

const API_BASE_URL = "https://employee-survey-platform.onrender.com";

const AnalysisDashboard = ({ surveyId }) => {
  const [sentimentData, setSentimentData] = useState({ labels: [], data: [] });
  const [burnoutRiskData, setBurnoutRiskData] = useState({ labels: [], data: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('userToken'); // Get token from localStorage
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch distribution data
        const distributionRes = await axios.get(
          `${API_BASE_URL}/analysis/survey/${surveyId}/distribution`,
          { headers }
        );

        // Process sentiment distribution for Pie/Bar chart
        const sentimentLabels = distributionRes.data.sentiment_distribution.map(item => item.label);
        const sentimentValues = distributionRes.data.sentiment_distribution.map(item => item.value);
        setSentimentData({ labels: sentimentLabels, data: sentimentValues });

        // Process burnout risk distribution for Pie/Bar chart
        const burnoutLabels = distributionRes.data.burnout_risk_distribution.map(item => item.label);
        const burnoutValues = distributionRes.data.burnout_risk_distribution.map(item => item.value);
        setBurnoutRiskData({ labels: burnoutLabels, data: burnoutValues });

        // --- You would fetch data for other charts/tables here similarly ---
        // For example, if you had a Line Chart for responses over time, you'd have another endpoint
        // For demonstration, let's create dummy data for Line/Area charts.
        const dummyLineLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const dummyLineData = [65, 59, 80, 81, 56, 55];
        // For a real scenario, this would come from an endpoint providing time-series data.

      } catch (err) {
        console.error("Error fetching analysis data:", err);
        setError("Failed to load analysis data.");
      } finally {
        setLoading(false);
      }
    };

    if (surveyId) {
      fetchData();
    }
  }, [surveyId]);

  if (loading) return <div>Loading charts...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  // Define some color palettes for consistency
  const sentimentColors = {
    Positive: 'rgba(75, 192, 192, 0.7)',
    Neutral: 'rgba(255, 206, 86, 0.7)',
    Negative: 'rgba(255, 99, 132, 0.7)',
    Unknown: 'rgba(128, 128, 128, 0.7)', // Grey for unknown
  };

  const burnoutColors = {
    Low: 'rgba(75, 192, 192, 0.7)',
    Medium: 'rgba(255, 159, 64, 0.7)',
    High: 'rgba(255, 99, 132, 0.7)',
    Unknown: 'rgba(128, 128, 128, 0.7)',
  };

  const getBackgroundColor = (labels, palette) => {
    return labels.map(label => palette[label] || 'rgba(0, 0, 0, 0.5)');
  };


  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Analysis Dashboard for Survey ID: {surveyId}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <PieChart
            title="Sentiment Distribution"
            labels={sentimentData.labels}
            data={sentimentData.data}
            backgroundColor={getBackgroundColor(sentimentData.labels, sentimentColors)}
          />
        </div>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <BarChart
            title="Burnout Risk Distribution"
            labels={burnoutRiskData.labels}
            data={burnoutRiskData.data}
            backgroundColor={getBackgroundColor(burnoutRiskData.labels, burnoutColors)}
          />
        </div>
        {/* Placeholder for Line and Area charts - you'd fetch real data for these */}
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <LineChart
            title="Responses Over Time (Example)"
            labels={['Week 1', 'Week 2', 'Week 3', 'Week 4']}
            data={[10, 15, 7, 20]}
            borderColor="rgb(54, 162, 235)"
            backgroundColor="rgba(54, 162, 235, 0.2)"
          />
        </div>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <AreaChart
            title="Employee Engagement Trend (Example)"
            labels={['Q1', 'Q2', 'Q3', 'Q4']}
            data={[80, 85, 78, 90]}
            borderColor="rgb(255, 99, 132)"
            backgroundColor="rgba(255, 99, 132, 0.2)"
          />
        </div>
      </div>
      {/* You would also render your report table and word cloud here */}
      {/* For the report table, you'd fetch data from /analysis/survey/{surveyId}/report-table */}
      {/* For the word cloud, you'd fetch data from /analysis/survey/{surveyId}/text-data */}
    </div>
  );
};

export default AnalysisDashboard;