// ==============================================
// CONFIGURATION
// ==============================================

// Base URL for the FastAPI backend
const API_BASE_URL = "http://process.env.REACT_APP_API_BASE_URL.0.0.1:8000"; // safer than localhost for CORS consistency

// --- Token & Role Management ---
const getToken = () => localStorage.getItem("userToken");
const setToken = (token) => localStorage.setItem("userToken", token);

const getUserRole = () => localStorage.getItem("userRole");
const setUserRole = (role) => localStorage.setItem("userRole", role);

const clearAuth = () => {
  localStorage.removeItem("userToken");
  localStorage.removeItem("userRole");
};

// ==============================================
// COMMON HELPERS
// ==============================================

// Auth header helper
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  "Authorization": `Bearer ${getToken()}`,
});

// Universal response handler for API responses
export const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to parse backend JSON error
    const errorBody = await response.json().catch(() => ({
      detail: "Unknown API error",
    }));

    // FastAPI/Pydantic 422 validation errors come as arrays
    if (Array.isArray(errorBody.detail)) {
      const formattedError = errorBody.detail
        .map((err) => `${err.loc.join(".")}: ${err.msg}`)
        .join("; ");
      throw new Error(formattedError);
    }

    // Handle normal detail messages (401, 403, 404, etc.)
    const errorMessage = errorBody.detail || "API request failed.";
    throw new Error(errorMessage);
  }

  // If response is okay, return JSON
  return response.json();
};

// Safe fetch wrapper (prevents "Failed to fetch" from crashing)
export const safeFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    return await handleResponse(response);
  } catch (err) {
    throw new Error(`Network error or server unreachable: ${err.message}`);
  }
};

// ==============================================
// AUTHENTICATION & USERS
// ==============================================

/**
 * POST /users/
 * Creates a new user (used for registration or admin setup).
 */
export const registerUser = async (username, password, role) => {
  return safeFetch(`${API_BASE_URL}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password, role }),
  });
};

/**
 * POST /token
 * Logs in a user and retrieves an access token.
 */
export const loginUser = async (username, password) => {
  const formData = new URLSearchParams();
  formData.append("username", username);
  formData.append("password", password);

  const response = await safeFetch(`${API_BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  // Save token in local storage
  setToken(response.access_token);
  return response;
};

/**
 * GET /users/me
 * Fetch the current user's details (including role).
 */
export const fetchUserRole = async () => {
  const userDetails = await safeFetch(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (userDetails.role) setUserRole(userDetails.role);
  return userDetails;
};

// Export auth helpers
export { clearAuth, getUserRole };

// ==============================================
// SURVEY MANAGEMENT
// ==============================================

/**
 * GET /surveys/
 * Retrieve all surveys (available for user/admin).
 */
export const getSurveys = async () => {
  return safeFetch(`${API_BASE_URL}/surveys/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};

/**
 * POST /surveys/
 * Create a new survey (Admin only).
 */
export const createSurvey = async (title, questions) => {
  return safeFetch(`${API_BASE_URL}/surveys/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ title, questions }),
  });
};

/**
 * POST /survey-assignments/
 * Assign a survey to employees (Admin only).
 */
export const assignSurvey = async (surveyId, userIds) => {
  return safeFetch(`${API_BASE_URL}/survey-assignments/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ survey_id: surveyId, user_ids: userIds }),
  });
};

// ==============================================
// SURVEY RESPONSES
// ==============================================

/**
 * POST /survey-responses/
 * Submit a survey response (Employee).
 */
export const submitResponse = async (surveyId, answers) => {
  return safeFetch(`${API_BASE_URL}/survey-responses/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ survey_id: surveyId, answers }),
  });
};

/**
 * GET /survey-responses/{survey_id}
 * Retrieve all responses for a given survey (Admin only).
 */
export const getSurveyResults = async (surveyId) => {
  return safeFetch(`${API_BASE_URL}/survey-responses/${surveyId}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};

// ==============================================
// EMPLOYEES
// ==============================================

/**
 * GET /employees/
 * Fetch all registered employees (Admin only).
 */
export const fetchAllEmployees = async () => {
  return safeFetch(`${API_BASE_URL}/employees/`, {
    method: "GET",
    headers: getAuthHeaders(),
  });
};
