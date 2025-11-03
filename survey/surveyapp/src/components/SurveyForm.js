import React, { useState } from 'react';
import { submitResponse } from '../services/api'; // Import the submission function

const SurveyForm = ({ survey, onSubmitted, onCancel }) => {
  // Initialize state to hold answers, where keys are question indices or keys
  const initialAnswers = survey.questions.reduce((acc, question, index) => {
    // Use a simple key format like 'q1', 'q2', etc.
    const key = `q${index + 1}`;
    acc[key] = ''; 
    return acc;
  }, {});

  const [answers, setAnswers] = useState(initialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setAnswers({
      ...answers,
      [key]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Basic validation: ensure all questions have been answered
    const allAnswered = Object.values(answers).every(answer => answer.trim() !== '');
    if (!allAnswered) {
      setError('Please ensure all questions are answered before submitting.');
      setIsSubmitting(false);
      return;
    }

    try {
      // API call to submit the response
      await submitResponse(survey.id, answers);
      
      // Notify the parent component (EmployeeDashboard) of successful submission
      onSubmitted(); 
      
    } catch (err) {
      console.error('Submission Error:', err);
      // Display a user-friendly error message
      setError(`Failed to submit survey: ${err.message || 'Server error.'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{maxWidth: '800px', backgroundColor: '#ffffff'}}>
      <div className="header">
        <h1>{survey.title}</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        {survey.questions.map((question, index) => {
          const key = `q${index + 1}`;
          
          return (
            <div key={key} className="form-group">
              <label htmlFor={key}>{index + 1}. {question}</label>
              <textarea
                id={key}
                rows="3"
                value={answers[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          );
        })}

        {error && <p className="message error">{error}</p>}

        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
          <button 
            type="submit" 
            className="primary" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Survey'}
          </button>
          
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SurveyForm;