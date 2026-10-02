import { Navigate } from 'react-router-dom';
import { useContext } from 'react';

import AuthContext from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}



function ProtectedRoute({
    children,
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
    } = authContext;

    // Wait until we know whether a session exists
    if (isLoading) {
        return <p>Loading...</p>;
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

    // Logged in → allow access
    return <>{children}</>;
}

export default ProtectedRoute;