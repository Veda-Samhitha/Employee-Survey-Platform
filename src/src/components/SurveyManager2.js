// src/components/SurveyManager.js

import React, { useState } from 'react';
import { createSurvey } from '../services/api';

const SurveyManager = ({ surveys, refreshSurveys }) => {
    const [newSurveyTitle, setNewSurveyTitle] = useState('');
    const [questions, setQuestions] = useState([]); 
    const [statusMessage, setStatusMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Dynamic Question Management (Handlers remain the same) ---
    const addQuestion = () => { /* ... */ };
    const handleQuestionChange = (id, field, value) => { /* ... */ };
    const removeQuestion = (id) => { /* ... */ };
    const handleCreateSurvey = async (e) => { /* ... */ };
    
    return (
        <div className="container">
            <h2>📋 Survey Management</h2>
            
            {statusMessage && <p className={`message ${statusMessage.startsWith('Error') ? 'error' : 'success'}`}>{statusMessage}</p>}

            {/* Form to Create New Survey - Enclosed in a Card (Content remains largely the same) */}
            <div className="card form-card">
                <h4 className="card-header">Create New Survey Structure</h4>
                
                <form onSubmit={handleCreateSurvey} className="form-layout">
                    
                    {/* Survey Title */}
                    <div className="form-group">
                        <label className="form-label required">Survey Title</label>
                        <input /* ... */ />
                    </div>
                    
                    <hr className="form-divider" />

                    {/* --- Dynamic Question Section --- */}
                    <h4 className="section-header">Questions ({questions.length})</h4>
                    
                    {questions.map((q, index) => (
                        <div key={q.id} className="question-item-card">
                            <h5 className="question-header">Question {index + 1}</h5>
                            
                            <div className="form-group-grid">
                                <div className="form-group">
                                    <label className="form-label required">Question Text</label>
                                    <input /* ... */ />
                                </div>
                                
                                <div className="form-group">
                                    <label className="form-label">Question Type</label>
                                    <select /* ... */>
                                        <option value="text_input">Text Input (Long Answer)</option>
                                        <option value="rating_5">Rating (1-5 Scale)</option>
                                        <option value="yes_no">Yes/No</option>
                                    </select>
                                </div>
                            </div>
                            
                            <button 
                                type="button" 
                                onClick={() => removeQuestion(q.id)} 
                                className="danger-btn secondary-btn small-btn remove-btn"
                            >
                                Remove Question
                            </button>
                        </div>
                    ))}

                    <button 
                        type="button" 
                        onClick={addQuestion} 
                        className="secondary-btn add-btn" 
                        style={{marginTop: '10px', marginBottom: '20px'}}
                    >
                        + Add New Question
                    </button>
                    
                    <button 
                        type="submit" 
                        className="primary-btn submit-btn" 
                        disabled={isSubmitting || !newSurveyTitle || questions.length === 0}
                    >
                        {isSubmitting ? 'Creating Survey...' : 'Create Survey'}
                    </button>
                </form>
            </div>

            {/* List of Existing Surveys - Refined Classes */}
            <div className="card list-card" style={{marginTop: '20px'}}>
                <h4 className="card-header">Existing Surveys ({surveys.length})</h4>
                <ul className="clean-list survey-items-list">
                    {surveys.map(s => (
                        <li key={s.id} className="survey-list-item">
                            <span className="survey-title-text">{s.title}</span>
                            <span className="list-detail-badge">ID: ({s.id})</span>
                        </li>
                    ))}
                </ul>
                {surveys.length === 0 && <p className="message info">No surveys created yet.</p>}
            </div>
        </div>
    );
};

export default SurveyManager;