import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from '../pages/Signup';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from './ProtectedRoute';

function AppRouter() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />


            <Route
                path="/signup"
                element={<Signup />}
            />

            
            <Route
                path="*"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />
        </Routes>
    );
}

export default AppRouter;