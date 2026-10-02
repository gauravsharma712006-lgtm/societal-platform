import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

function Dashboard() {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error(
            'Dashboard must be used inside AuthProvider'
        );
    }

    const {
        user,
        isLoading,
        isAuthenticated,
        logout,
    } = authContext;

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!isAuthenticated || !user) {
        return <p>Not authenticated</p>;
    }

    return (
        <div>
            <h1>Welcome, {user.name}</h1>

            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>

            <button onClick={logout}>
                Logout
            </button>
        </div>
    );
}

export default Dashboard;