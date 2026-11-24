/**
 * Centralized REST API Client for KYU Student Management System
 */
const API = (() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const currentPath = window.location.pathname;
    const frontendIndex = currentPath.indexOf('/frontend/');
    const projectRoot = frontendIndex !== -1 ? currentPath.substring(0, frontendIndex) : '';

    // Replace this with your live Render URL after Step 3 below
    const PROD_API_URL = 'https://kyu-sms-backend.onrender.com/api';
    const LOCAL_API_URL = `${window.location.origin}${projectRoot}/backend/api`;

    const BASE_URL = isLocal ? LOCAL_API_URL : PROD_API_URL;

    async function request(endpoint, options = {}) {
        const config = {
            credentials: 'include', // Required for cross-domain PHP sessions between Vercel & Render
            headers: {
                'Content-Type': 'application/json',
            },
            ...options,
        };

        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, config);
            const data = await response.json();
            return { ok: response.ok, status: response.status, data };
        } catch (error) {
            console.error(`API Network Error [${endpoint}]:`, error);
            return {
                ok: false,
                status: 500,
                data: { status: 'error', message: 'Unable to reach backend API server.' }
            };
        }
    }

    return {
        login: (credentials) => request('/auth/login.php', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),
        logout: () => request('/auth/logout.php', { method: 'POST' }),
        checkSession: () => request('/auth/current_user.php', { method: 'GET' }),
        getDashboardStats: () => request('/reports/dashboard_stats.php', { method: 'GET' }),
        getStudents: () => request('/students/read.php', { method: 'GET' }),
        createStudent: (studentData) => request('/students/create.php', {
            method: 'POST',
            body: JSON.stringify(studentData)
        }),
        updateStudentStatus: (id, status) => request('/students/update.php', {
            method: 'PUT',
            body: JSON.stringify({ id, status })
        }),
        deleteStudent: (id) => request('/students/delete.php', {
            method: 'DELETE',
            body: JSON.stringify({ id })
        }),
        getFinanceRecords: () => request('/finance/fetch_fees.php', { method: 'GET' }),
        recordPayment: (fee_id, amount) => request('/finance/pay_fee.php', {
            method: 'POST',
            body: JSON.stringify({ fee_id, amount })
        })
    };
})();