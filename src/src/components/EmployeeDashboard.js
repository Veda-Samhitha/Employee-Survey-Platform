import React, { useState, useEffect } from 'react';
import SurveyForm from './SurveyForm';
import { getSurveys } from '../services/api'; // Get surveys assigned to the user

const EmployeeDashboard = () => {
  const [availableSurveys, setAvailableSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      // API call to get surveys available to the logged-in employee
      const surveys = await getSurveys(); 
      setAvailableSurveys(surveys);
    } catch (error) {
      setMessage('Failed to load surveys.');
    }
  };
  
  const handleSurveySubmit = () => {
    setMessage('✅ Survey submitted successfully!');
    setSelectedSurvey(null);
    fetchSurveys(); // Refresh the list
  };

  if (selectedSurvey) {
    return (
      <SurveyForm 
        survey={selectedSurvey} 
        onSubmitted={handleSurveySubmit}
        onCancel={() => setSelectedSurvey(null)}
      />
    );
  }

  return (
    <div className="container">
      <h2>Employee Dashboard: Available Surveys</h2>
      {message && <p style={{color: 'var(--success-color)'}}>{message}</p>}
      
      {availableSurveys.length > 0 ? (
        <ul>
          {availableSurveys.map(survey => (
            <li key={survey.id} style={{padding: '10px 0', borderBottom: '1px solid #eee'}}>
              <strong>{survey.title}</strong>
              <button 
                onClick={() => setSelectedSurvey(survey)} 
                className="primary"
                style={{marginLeft: '20px', padding: '5px 10px'}}
              >
                Start Survey
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No surveys are currently assigned to you.</p>
      )}
    </div>
  );
};

export default EmployeeDashboard;