// src/components/SurveyManager.js

import React, { useState } from 'react';
import { createSurvey } from '../services/api';

const SurveyManager = ({ surveys, refreshSurveys }) => {
    const [newSurveyTitle, setNewSurveyTitle] = useState('');
    const [questions, setQuestions] = useState([]); // Array to hold dynamically added questions
    const [statusMessage, setStatusMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Dynamic Question Management ---
    const addQuestion = () => {
        // Use a simple timestamp/random number for a unique ID in the UI
        const newId = Date.now(); 
        setQuestions([...questions, { 
            id: newId, 
            text: '', 
            type: 'text_input' 
        }]);
    };

    const handleQuestionChange = (id, field, value) => {
        setQuestions(questions.map(q => 
            q.id === id ? { ...q, [field]: value } : q
        ));
    };

    const removeQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };

    // --- Submission to Backend ---
    const handleCreateSurvey = async (e) => {
        e.preventDefault();
        setStatusMessage('');
        setIsSubmitting(true);

        if (questions.length === 0) {
            setStatusMessage("Error: A survey must have at least one question.");
            setIsSubmitting(false);
            return;
        }

        try {
            // The backend needs a clean list of questions without the temporary UI 'id'
            const submissionQuestions = questions.map(q => ({
                text: q.text,
                type: q.type
                // FastAPI backend will assign the final question ID
            }));

            await createSurvey(newSurveyTitle, submissionQuestions);
            
            setStatusMessage(`Survey "${newSurveyTitle}" created successfully!`);
            
            // Reset form fields
            setNewSurveyTitle('');
            setQuestions([]);
            
            refreshSurveys(); // Refresh the list in the AdminDashboard
        } catch (err) {
            setStatusMessage(`Error creating survey: ${err.message || 'API request failed'}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- UI Rendering ---
    return (
        <div className="container">
            <h3>📋 Survey Management</h3>
            
            {statusMessage && <p className={`message ${statusMessage.startsWith('Error') ? 'error' : 'success'}`}>{statusMessage}</p>}
               <div className="card form-card">
            {/* Form to Create New Survey */}
            <form onSubmit={handleCreateSurvey} className="content-panel">
                <h4 className="card-header">Create New Survey</h4>
                
                {/* Survey Title */}
                <div className="form-group">
                    <label>Survey Title</label>
                    <input 
                        type="text" 
                        value={newSurveyTitle} 
                        onChange={(e) => setNewSurveyTitle(e.target.value)} 
                        required 
                        placeholder="e.g., Q3 Employee Well-being Check"
                    />
                </div>
                
                <hr style={{margin: '20px 0'}} />

                {/* --- Dynamic Question Section --- */}
                <h4>Survey Questions ({questions.length})</h4>
                
                {questions.map((q, index) => (
                    <div key={q.id} className="question-item">
                        <h5>Question {index + 1}</h5>
                        <div className="form-group">
                            <label>Question Text</label>
                            <input 
                                type="text" 
                                value={q.text} 
                                onChange={(e) => handleQuestionChange(q.id, 'text', e.target.value)}
                                required
                                placeholder="e.g., How stressed have you felt this past month?"
                            />
                        </div>
                        
                        <div className="form-group" style={{maxWidth: '300px'}}>
                            <label>Question Type</label>
                            <select 
                                value={q.type} 
                                onChange={(e) => handleQuestionChange(q.id, 'type', e.target.value)}
                            >
                                <option value="text_input">Text Input (Long Answer)</option>
                                <option value="rating_5">Rating (1-5)</option>
                                <option value="yes_no">Yes/No</option>
                            </select>
                        </div>

                        <button 
                            type="button" 
                            onClick={() => removeQuestion(q.id)} 
                            className="secondary small danger-button"
                        >
                            Remove Question
                        </button>
                        <hr />
                    </div>
                ))}

                <button 
                    type="button" 
                    onClick={addQuestion} 
                    className="secondary" 
                    style={{marginBottom: '20px'}}
                >
                    + Add New Question
                </button>
                
                <button type="submit" className="primary" disabled={isSubmitting || !newSurveyTitle || questions.length === 0}>
                    {isSubmitting ? 'Creating Survey...' : 'Submit Final Survey Structure'}
                </button>
            </form>
           </div>
            {/* List of Existing Surveys */}
            <div className="card list-card" style={{marginTop: '20px'}}>
                <h4>Existing Surveys ({surveys.length})</h4>
                <ul className="survey-list">
                    {surveys.map(s => <li key={s.id}>{s.title} (ID: {s.id})</li>)}
                </ul>
            </div>
        </div>
    );
};

export default SurveyManager;