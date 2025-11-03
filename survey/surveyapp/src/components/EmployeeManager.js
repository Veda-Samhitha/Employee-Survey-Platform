// src/components/EmployeeManager.js

import React, { useState, useEffect } from 'react';
import { registerUser, assignSurvey, fetchAllEmployees } from '../services/api';

const EmployeeManager = ({ surveys }) => {
    // State to control which tab is visible: 'register' or 'assign'
    const [activeTab, setActiveTab] = useState('register'); 
    
    // --- Registration States ---
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regStatus, setRegStatus] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const [employees, setEmployees] = useState([]);
    const [employeeListStatus, setEmployeeListStatus] = useState('Loading employees...');
    // --- Assignment States ---
    const [assignSurveyId, setAssignSurveyId] = useState('');
    const [assignUserIds, setAssignUserIds] = useState('');
    const [assignStatus, setAssignStatus] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

        const loadEmployees = async () => {
            try {
                setEmployeeListStatus('Loading employees...');
                const data = await fetchAllEmployees();
                setEmployees(data);
                setEmployeeListStatus(data.length > 0 ? '' : 'No employees registered yet.');
            } catch (err) {
                setEmployeeListStatus(`Error loading employees: ${err.message}`);
            }
        }

        useEffect(() => {
	loadEmployees();
    }, []);
    // --- 1. Employee Registration Handler ---
    const handleRegister = async (e) => {
    e.preventDefault();
    setRegStatus('');
    setIsRegistering(true);
    try {
        // 1. CALL API & CAPTURE NEW USER DATA
        const newUser = await registerUser(regUsername, regPassword, 'employee');
        
        setRegStatus(`Employee ${regUsername} registered successfully!`);
        
        // 2. STATE UPDATE: Add the new user to the existing list
        //setEmployees(prev => [...prev, newUser]); // 👈 THIS IS THE REFRESH
       loadEmployees();
        setRegUsername('');
        setRegPassword('');
    } catch (err) {
        setRegStatus(`Error registering employee: ${err.message || 'API request failed'}`);
    } finally {
        setIsRegistering(false);
    }
};


    // --- 2. Survey Assignment Handler ---
    const handleAssign = async (e) => {
        e.preventDefault();
        setAssignStatus('');
        setIsAssigning(true);
        
        const userIdsArray = assignUserIds.split(',').map(id => id.trim()).filter(id => id);
        
        if (!assignSurveyId || userIdsArray.length === 0) {
            setAssignStatus("Error: Please select a survey and enter at least one User ID.");
            setIsAssigning(false);
            return;
        }

        try {
            // NOTE: assignSurvey expects surveyId to be an integer (as per original code)
            await assignSurvey(parseInt(assignSurveyId), userIdsArray);
            setAssignStatus(`Survey ID ${assignSurveyId} assigned to ${userIdsArray.length} user(s).`);
            setAssignUserIds('');
            setAssignSurveyId('');
        } catch (err) {
            setAssignStatus(`Error assigning survey: ${err.message || 'API request failed'}`);
        } finally {
            setIsAssigning(false);
        }
    };

    // Helper to determine the class for status messages
    const getStatusClass = (status) => status && (status.startsWith('Error') || status.startsWith('Please select') ? 'error' : 'success');

    // --- Component UI ---
    return (
        <div className="container">
            <h3>🧑‍💼 Employee Management</h3>
            
            {/* --- Tab Navigation --- */}
            <div className="tab-navigation">
                <button 
                    className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
                    onClick={() => setActiveTab('register')}
                >
                    Register New Employee
                </button>
                <button 
                    className={`tab-button ${activeTab === 'assign' ? 'active' : ''}`}
                    onClick={() => setActiveTab('assign')}
                >
                    Assign Survey
                </button>
            </div>

            {activeTab === 'register' && (
                <div className="content-panel">
                    {/* Registration Form */}
                    <form onSubmit={handleRegister} >
                        <h4>Register New Employee</h4>
                        <div className="form-group">
                            <label>Username (Employee ID)</label>
                            <input type="text" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
                        </div>
                        <button type="submit" className="primary" disabled={isRegistering}>
                            {isRegistering ? 'Registering...' : 'Register Employee'}
                        </button>
                        {regStatus && <p className={`message ${getStatusClass(regStatus)}`}>{regStatus}</p>}
                    </form>

                    {/* --- Employee List Display --- */}
                    <hr />
                    <h4>Registered Employees ({employees.length})</h4>
                    
                    {employeeListStatus && !employees.length && (
                        <p className={`message ${employeeListStatus.startsWith('Error') ? 'error' : 'info'}`}>
                            {employeeListStatus}
                        </p>
                    )}

                    {employees.length > 0 && (
                        <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                            {employees.map(emp => (
                                <li key={emp.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                                    <strong>{emp.username}</strong> (ID: {emp.id})
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            {/* --- Tab Content: Assign Survey --- */}
            {activeTab === 'assign' && (
                <form onSubmit={handleAssign} className="content-panel">
                    <h4>Assign Survey</h4>
                    <div className="form-group">
                        <label>Select Survey</label>
                        <select 
                            value={assignSurveyId} 
                            onChange={(e) => setAssignSurveyId(e.target.value)}
                            required
                        >
                            <option value="">-- Choose Survey --</option>
                            {/* Ensure surveys array is not empty before mapping */}
                            {surveys.length > 0 ? (
                                surveys.map(s => (
                                    <option key={s.id} value={s.id}>{s.title} (ID: {s.id})</option>
                                ))
                            ) : (
                                <option disabled>No surveys available</option>
                            )}
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
                    <button type="submit" className="primary" disabled={isAssigning}>
                        {isAssigning ? 'Assigning...' : 'Assign Survey'}
                    </button>
                    {assignStatus && <p className={`message ${getStatusClass(assignStatus)}`}>{assignStatus}</p>}
                </form>
            )}
        </div>
    );
};

export default EmployeeManager;