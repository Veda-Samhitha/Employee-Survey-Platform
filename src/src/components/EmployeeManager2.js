// src/components/EmployeeManager.js

import React, { useState } from 'react';
import { registerUser, assignSurvey } from '../services/api';

const EmployeeManager = ({ surveys }) => {
    // State for registration form
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regStatus, setRegStatus] = useState('');

    // State for assignment form
    const [assignSurveyId, setAssignSurveyId] = useState('');
    const [assignUserIds, setAssignUserIds] = useState('');
    const [assignStatus, setAssignStatus] = useState('');


    // --- 1. Employee Registration Handler ---
    const handleRegister = async (e) => {
        e.preventDefault();
        setRegStatus('');
        try {
            // Note: role is hardcoded to 'employee'
            await registerUser(regUsername, regPassword, 'employee');
            setRegStatus(`Employee ${regUsername} registered successfully!`);
            setRegUsername('');
            setRegPassword('');
        } catch (err) {
            setRegStatus(`Error registering employee: ${err.message}`);
        }
    };

    // --- 2. Survey Assignment Handler ---
    const handleAssign = async (e) => {
        e.preventDefault();
        setAssignStatus('');
        const userIdsArray = assignUserIds.split(',').map(id => id.trim()).filter(id => id);
        
        if (!assignSurveyId || userIdsArray.length === 0) {
            setAssignStatus("Please select a survey and enter at least one User ID.");
            return;
        }

        try {
            await assignSurvey(parseInt(assignSurveyId), userIdsArray);
            setAssignStatus(`Survey ID ${assignSurveyId} assigned to ${userIdsArray.length} user(s).`);
            setAssignUserIds('');
        } catch (err) {
            setAssignStatus(`Error assigning survey: ${err.message}`);
        }
    };

    return (
        <div className="employee-manager">
            <h3>🧑‍💼 Employee Management</h3>
            
            {/* --- New Employee Registration Form --- */}
            <form onSubmit={handleRegister} className="content-panel">
                <h4>Register New Employee</h4>
                <div className="form-group">
                    <label>Username (Employee ID)</label>
                    <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                </div>
                <button type="submit" className="primary">Register Employee</button>
                {regStatus && <p className={`message ${regStatus.startsWith('Error') ? 'error' : 'success'}`}>{regStatus}</p>}
            </form>

            {/* --- Survey Assignment Tool --- */}
            <form onSubmit={handleAssign} className="content-panel" style={{marginTop: '20px'}}>
                <h4>Assign Survey</h4>
                <div className="form-group">
                    <label>Select Survey</label>
                    <select 
                        value={assignSurveyId} 
                        onChange={(e) => setAssignSurveyId(e.target.value)}
                        required
                    >
                        <option value="">-- Choose Survey --</option>
                        {surveys.map(s => (
                            <option key={s.id} value={s.id}>{s.title} (ID: {s.id})</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Employee IDs (Comma separated)</label>
                    <textarea 
                        rows="3"
                        value={assignUserIds} 
                        onChange={(e) => setAssignUserIds(e.target.value)} 
                        placeholder="e.g., user1, user2, 1003"
                        required
                    />
                </div>
                <button type="submit" className="primary">Assign Survey</button>
                {assignStatus && <p className={`message ${assignStatus.startsWith('Error') ? 'error' : 'success'}`}>{assignStatus}</p>}
            </form>
        </div>
    );
};

export default EmployeeManager;