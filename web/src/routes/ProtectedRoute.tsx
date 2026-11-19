import { Navigate } from 'react-router-dom';
import { useContext } from 'react';

import AuthContext from '../context/AuthContext';


interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}



function ProtectedRoute({
    children,
    allowedRoles,
}: ProtectedRouteProps) {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error(
            'ProtectedRoute must be used inside AuthProvider'
        );
    }

    const {
        isLoading,
        isAuthenticated,
        hasAnyRole,
        sessionError,
        retrySession,
    } = authContext;

    // Wait until we know whether a session exists
    if (isLoading) {
        return <p>Loading...</p>;
    }
    if (sessionError) {
        return <div className="p-6 text-white"><p role="alert">{sessionError}</p><button onClick={retrySession} className="mt-4 rounded-lg bg-purple-600 px-4 py-2">Retry</button></div>;
    }

    // Not logged in → go to login
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/login"
                replace
            />
        );
    }

    // Logged in but wrong role → deny access
    if (
        allowedRoles &&
        !hasAnyRole(...allowedRoles)
    ) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    // Logged in → allow access
    return <>{children}</>;
}

export default ProtectedRoute;
