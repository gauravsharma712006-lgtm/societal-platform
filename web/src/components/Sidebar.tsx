
import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { ROLES } from '../constants/roles';

import AuthContext from '../context/AuthContext';

function Sidebar() {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error(
            'Sidebar must be used inside AuthProvider'
        );
    }

    const {
        user,
        logout,
        hasAnyRole,
    } = authContext;


    const canSeeProblems = Boolean(user);

    const canSeeChallenges = hasAnyRole(
        ROLES.STUDENT,
        ROLES.MENTOR,
        ROLES.ADMIN
    );


    const isAdmin = hasAnyRole(
        ROLES.ADMIN
    );

    const isStudent = hasAnyRole(
        ROLES.STUDENT
    );

    const isMentor = hasAnyRole(
        ROLES.MENTOR
    );

    return (
        <aside className="w-64 min-h-screen border-r border-white/10 bg-white/5 backdrop-blur-xl p-6 flex flex-col">
            <h1 className="text-xl font-bold">
            Societal Platform
        </h1>

            <div className="mt-2">
                <p className="text-sm font-medium text-white">
                    {user?.name}
                </p>

                <p className="text-xs text-gray-400">
                    {user?.role}
                </p>
            </div>

            <nav className="mt-8 flex flex-col gap-2 flex-1">
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                        `rounded-lg px-4 py-3 transition ${isActive
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    Dashboard
                </NavLink>

                {canSeeProblems && (
                    <NavLink
                        to="/problems"
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-3 transition ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        Problems
                    </NavLink>
                )}

                {canSeeChallenges && (
                    <NavLink
                        to="/challenges"
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-3 transition ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        Challenges
                    </NavLink>
                )}

                {isMentor && (
                    <NavLink
                        to="/teams"
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-3 transition ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        Teams
                    </NavLink>
                )}


                {isAdmin && (
                    <>
                        <NavLink
                            to="/reports"
                            className={({ isActive }) =>
                                `rounded-lg px-4 py-3 transition ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            Reports
                        </NavLink>

                        <NavLink
                            to="/verification"
                            className={({ isActive }) =>
                                `rounded-lg px-4 py-3 transition ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            Verification
                        </NavLink>

                        <NavLink
                            to="/analytics"
                            className={({ isActive }) =>
                                `rounded-lg px-4 py-3 transition ${isActive
                                    ? 'bg-white/10 text-white'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                }`
                            }
                        >
                            Analytics
                        </NavLink>
                    </>
                )}

                <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                        `rounded-lg px-4 py-3 transition ${isActive
                            ? 'bg-white/10 text-white'
                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`
                    }
                >
                    Profile
                </NavLink>

                {isStudent && (
                    <NavLink
                        to="/applications"
                        className={({ isActive }) =>
                            `rounded-lg px-4 py-3 transition ${isActive
                                ? 'bg-white/10 text-white'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`
                        }
                    >
                        Applications
                    </NavLink>
                )}

            </nav>

            <button
                type="button"
                onClick={logout}
                className="mt-8 w-full rounded-lg px-4 py-3 text-left text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
                Logout
            </button>
        </aside>
    );
}

export default Sidebar;

