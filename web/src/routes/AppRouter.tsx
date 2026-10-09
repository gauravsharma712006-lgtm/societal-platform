import { Routes, Route, Navigate } from 'react-router-dom';

import Signup from '../pages/Signup';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import Problems from '../pages/Problems';
import Challenges from '../pages/Challenges';
import Applications from '../pages/Applications';
import Teams from '../pages/Teams';
import Reports from '../pages/Reports';
import Verification from '../pages/Verification';
import Analytics from '../pages/Analytics';

import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import { ROLES } from '../constants/roles';
import ChallengeDetails from '../pages/ChallengeDetails';
import Invitations from '../pages/Invitations';
import TeamDetails from '../pages/TeamDetails';

function AppRouter() {
    return (
        <Routes>

            {/* Public routes */}

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/signup"
                element={<Signup />}
            />


            {/* Protected application */}

            <Route
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >

                {/* Available to every authenticated user */}

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/profile"
                    element={<Profile />}
                />

                <Route
                    path="/problems"
                    element={<Problems />}
                />


                {/* Student / Mentor / Admin */}

                <Route
                    path="/challenges"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                ROLES.STUDENT,
                                ROLES.MENTOR,
                                ROLES.ADMIN,
                            ]}
                        >
                            <Challenges />
                        </ProtectedRoute>
                    }
                />


                {/* Student only */}

                <Route
                    path="/applications"
                    element={
                        <ProtectedRoute
                            allowedRoles={[ROLES.STUDENT]}
                        >
                            <Applications />
                        </ProtectedRoute>
                    }
                />


                {/* Mentor / Admin */}

                <Route
                    path="/teams"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                ROLES.STUDENT,
                                ROLES.MENTOR,
                                ROLES.ADMIN,
                            ]}
                        >
                            <Teams />
                        </ProtectedRoute>
                    }
                />


                {/* Admin only */}

                <Route
                    path="/reports"
                    element={
                        <ProtectedRoute
                            allowedRoles={[ROLES.ADMIN]}
                        >
                            <Reports />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/verification"
                    element={
                        <ProtectedRoute
                            allowedRoles={[ROLES.ADMIN]}
                        >
                            <Verification />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute
                            allowedRoles={[ROLES.ADMIN]}
                        >
                            <Analytics />
                        </ProtectedRoute>
                    }
                />

            </Route>


            {/* Unknown routes */}

            <Route
                path="*"
                element={
                    <Navigate
                        to="/login"
                        replace
                    />
                }
            />

            <Route
                path="/challenges/:challengeId"
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            ROLES.STUDENT,
                            ROLES.MENTOR,
                            ROLES.ADMIN,
                        ]}
                    >
                        <ChallengeDetails />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/invitations"
                element={
                    <ProtectedRoute
                        allowedRoles={[ROLES.STUDENT]}
                    >
                        <Invitations />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/teams/:teamId"
                element={
                    <ProtectedRoute
                        allowedRoles={[
                            ROLES.STUDENT,
                            ROLES.MENTOR,
                            ROLES.ADMIN,
                        ]}
                    >
                        <TeamDetails />
                    </ProtectedRoute>
                }
            />

        </Routes>



    );
}

export default AppRouter;