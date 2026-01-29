import axios from 'axios';
import { toast } from 'sonner';

// Create axios instance with retry logic for mobile networks
const API_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const apiClient = axios.create({
    baseURL: API_URL + '/api',
    timeout: 90000, // 90 second timeout for slow mobile networks
    headers: {
        'Content-Type': 'application/json',
    },
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 3000; // 3 seconds between retries

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Track if we've shown the retry toast
let retryToastId = null;

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with retry logic for network errors
apiClient.interceptors.response.use(
    (response) => {
        // Dismiss retry toast on success
        if (retryToastId) {
            toast.dismiss(retryToastId);
            retryToastId = null;
        }
        return response;
    },
    async (error) => {
        const config = error.config;

        // Initialize retry count
        config.__retryCount = config.__retryCount || 0;

        // Check if we should retry
        const isNetworkError = !error.response || error.code === 'ECONNABORTED' || error.message.includes('Network Error');
        const isServerError = error.response?.status >= 500;
        const shouldRetry = (isNetworkError || isServerError) && config.__retryCount < MAX_RETRIES;

        if (shouldRetry) {
            config.__retryCount += 1;

            console.log(`Request failed, retrying (${config.__retryCount}/${MAX_RETRIES})...`);

            // Show user-friendly toast on first retry
            if (config.__retryCount === 1) {
                retryToastId = toast.loading('Connecting to server... Please wait', {
                    description: 'If you\'re on mobile data, try switching to WiFi',
                    duration: 30000,
                });
            }

            // Wait before retrying (exponential backoff)
            await sleep(RETRY_DELAY * config.__retryCount);

            // Retry the request
            return apiClient(config);
        }

        // Dismiss retry toast on final failure
        if (retryToastId) {
            toast.dismiss(retryToastId);
            retryToastId = null;
        }

        // If all retries failed, provide a user-friendly error
        if (isNetworkError) {
            error.userMessage = 'Unable to connect. Please check your internet connection or try using WiFi.';
            toast.error('Connection failed', {
                description: 'Try switching to WiFi or refreshing the page',
            });
        }

        return Promise.reject(error);
    }
);

// Wake up the server on app load (ping endpoint)
export const wakeUpServer = async () => {
    try {
        await axios.get(`${API_URL}/health`, { timeout: 10000 });
        console.log('Server connection verified');
        return true;
    } catch (error) {
        console.log('Initial server ping failed, but app will retry on requests');
        return false;
    }
};

export default apiClient;
export { API_URL };
