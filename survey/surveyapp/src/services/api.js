// Base URL for the FastAPI backend
const API_BASE_URL = "http://localhost:8000";

// --- Token Management ---
// Simple token storage in localStorage
const getToken = () => localStorage.getItem("userToken");
const setToken = (token) => localStorage.setItem("userToken", token);

const getUserRole = () => localStorage.getItem("userRole");
const setUserRole = (role) => localStorage.setItem("userRole", role);

const clearAuth = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userRole");
};

export const handleResponse = async (response) => {
    if (!response.ok) {
        // Attempt to read error message from body
        const errorBody = await response.json().catch(() => ({ detail: 'Unknown API error' }));
        
        // --- CRUCIAL CHECK & FORMATTING ---
        // 1. Check if 'detail' is an array (which happens with FastAPI/Pydantic 422 errors)
        if (Array.isArray(errorBody.detail)) {
            // Map the array of error objects into a single, readable string
            const formattedError = errorBody.detail
                // Each error object has 'loc' (location/field) and 'msg' (message)
                .map(err => `${err.loc.join('.')}: ${err.msg}`)
                .join('; '); // Join them with a semicolon for readability
            
            throw new Error(formattedError);
        }

        // 2. Handle simple string errors (e.g., 401 Unauthorized, 404 Not Found)
        // If errorBody.detail is a string, use it.
        const errorMessage = errorBody.detail || 'API request failed with unknown status.';
        throw new Error(errorMessage);
    }
    return response.json();
};

// --- AUTHENTICATION & USERS ---

/**
 * Endpoint: POST /users/
 * Creates a new user (usually done by an admin or a separate setup process).
 */
export const registerUser = async (username, password, role) => {
  const response = await fetch(`${API_BASE_URL}/users/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
  return handleResponse(response);
};


/**
 * Endpoint: POST /token
 * Logs in a user and retrieves an access token.
 */
export const loginUser = async (username, password) => {
  // FastAPI expects form-urlencoded data for /token
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE_URL}/token`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded' // Crucial header for FastAPI /token
    },
    body: formData.toString(),
  });
  
  const data = await handleResponse(response);
  setToken(data.access_token);
  
  // NOTE: The role must be inferred or retrieved separately, 
  // as the /token endpoint doesn't return it by default. 
  // For simplicity, we'll return a placeholder role which should be updated 
  // by a subsequent API call in a real app. 
  // Based on your App.js logic, we assume the caller determines the role after login.
  return data; 
};

export const fetchUserRole = async () => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    const userDetails = await handleResponse(response);
    
    // Save the role to localStorage immediately for use by other parts of the app
    if (userDetails.role) {
        setUserRole(userDetails.role);
    }
    
    return userDetails;
};
export { clearAuth, getUserRole};


// --- SURVEY MANAGEMENT ---

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

/**
 * Endpoint: GET /surveys/
 * Retrieves a list of all surveys.
 */
export const getSurveys = async () => {
  const response = await fetch(`${API_BASE_URL}/surveys/`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

/**
 * Endpoint: POST /surveys/
 * Creates a new survey (Admin only).
 */
export const createSurvey = async (title, questions) => {
  const response = await fetch(`${API_BASE_URL}/surveys/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, questions }),
  });
  return handleResponse(response);
};

/**
 * Endpoint: POST /survey-assignments/
 * Assigns a survey to a list of user IDs (Admin only).
 */
export const assignSurvey = async (surveyId, userIds) => {
  const response = await fetch(`${API_BASE_URL}/survey-assignments/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ survey_id: surveyId, user_ids: userIds }),
  });
  return handleResponse(response);
};


// --- SURVEY RESPONSES ---

/**
 * Endpoint: POST /survey-responses/
 * Submits an employee's survey response.
 */
export const submitResponse = async (surveyId, answers) => {
  const response = await fetch(`${API_BASE_URL}/survey-responses/`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ survey_id: surveyId, answers }),
  });
  return handleResponse(response);
};

/**
 * Endpoint: GET /survey-responses/{survey_id}
 * Retrieves all submitted responses for a specific survey (Admin only).
 */
export const getSurveyResults = async (surveyId) => {
  const response = await fetch(`${API_BASE_URL}/survey-responses/${surveyId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse(response);
};

export const fetchAllEmployees = async () => {
    const response = await fetch(`${API_BASE_URL}/employees/`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    
    // Use the existing handleResponse for error parsing
    return handleResponse(response);
};