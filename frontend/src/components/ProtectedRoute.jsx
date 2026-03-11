import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');
    const location = useLocation();

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    try {
        // Simple client-side token expiry check
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payloadInfo = JSON.parse(jsonPayload);
        const { exp } = payloadInfo;
        const mustChangePassword = payloadInfo.user?.mustChangePassword;
        const currentTime = Date.now() / 1000;

        if (exp < currentTime) {
            console.warn('Token expired. Redirecting to login.');
            localStorage.removeItem('token');
            return <Navigate to="/login" replace />;
        }

        if (mustChangePassword && location.pathname !== '/change-password') {
            return <Navigate to="/change-password" replace />;
        }
    } catch (e) {
        console.error('Invalid token format', e);
        localStorage.removeItem('token');
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
