// Check if a token is expired by decoding it
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error decoding token:', error);
    return true; // Consider invalid tokens as expired
  }
};

// Get valid token or handle expiration
const getValidToken = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
  
  if (!token) {
    handleTokenExpiration();
    return null;
  }

  // Check if token is expired
  if (isTokenExpired(token)) {
    console.warn('Token has expired, redirecting to login');
    handleTokenExpiration();
    return null;
  }

  return token;
};

// Enhanced fetch wrapper that handles 401 errors
export const authenticatedFetch = async (url, options = {}) => {
  const token = getValidToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      console.warn('Received 401 Unauthorized, token may be expired');
      handleTokenExpiration();
      throw new Error('Session expired. Please login again.');
    }

    return response;
  } catch (error) {
    // Network errors or other fetch errors
    if (error.message.includes('Session expired')) {
      throw error; // Re-throw auth errors
    }
    console.error('Fetch error:', error);
    throw error;
  }
};

// Utility function to get axios configuration with authentication headers
export const getAuthAxiosConfig = () => {
  const token = getValidToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Utility function to get just the auth header
export const getAuthHeader = () => {
  const token = getValidToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  return `Bearer ${token}`;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || localStorage.getItem('authToken');
  return !!token;
};

// Handle token expiration and logout
export const handleTokenExpiration = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
