import { Link } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
    const { user, hasRole } = useAuth();

    const firstName =
        user?.name?.split(' ')[0] || 'there';

    /*
     * STUDENT DASHBOARD
     */
    if (hasRole('STUDENT')) {
        return (
            <div className="p-5 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-sm text-purple-400 mb-2">
                            Student Dashboard
                        </p>

                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Welcome, {firstName}
                        </h1>

                        <p className="text-gray-400 mt-2">
                            Discover challenges, build teams and
                            create real-world impact.
                        </p>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <p className="text-gray-500 text-sm">
                                Applications
                            </p>

                            <p className="text-3xl font-bold mt-2">
                                —
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                                Your applications
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <p className="text-gray-500 text-sm">
                                Invitations
                            </p>

                            <p className="text-3xl font-bold mt-2">
                                —
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                                Team invitations
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <p className="text-gray-500 text-sm">
                                My Teams
                            </p>

                            <p className="text-3xl font-bold mt-2">
                                —
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                                Active teams
                            </p>
                        </div>

                    </div>

                    {/* Main actions */}
                    <div className="grid lg:grid-cols-2 gap-6">

                        {/* Challenges */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

                            <div className="flex items-start justify-between gap-4">

                                <div>
                                    <div className="w-11 h-11 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 text-xl">
                                        ◇
                                    </div>

                                    <h2 className="text-xl font-semibold mt-5">
                                        Discover Challenges
                                    </h2>

                                    <p className="text-gray-400 mt-2">
                                        Find real-world problems and
                                        opportunities where you can
                                        contribute your skills.
                                    </p>
                                </div>

                            </div>

                            <Link
                                to="/challenges"
                                className="inline-block mt-6 bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl transition"
                            >
                                Explore Challenges
                            </Link>

                        </div>

                        {/* Teams */}
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">

                            <div className="w-11 h-11 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-400 text-xl">
                                ♟
                            </div>

                            <h2 className="text-xl font-semibold mt-5">
                                Build Your Team
                            </h2>

                            <p className="text-gray-400 mt-2">
                                Collaborate with other students and
                                work together on meaningful challenges.
                            </p>

                            <Link
                                to="/teams"
                                className="inline-block mt-6 bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 rounded-xl transition"
                            >
                                View My Teams
                            </Link>

                        </div>

                    </div>

                    {/* Account information */}
                    <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">

                        <h2 className="text-lg font-semibold">
                            Account
                        </h2>

                        <div className="grid sm:grid-cols-2 gap-5 mt-5">

                            <div>
                                <p className="text-xs text-gray-500">
                                    Name
                                </p>

                                <p className="mt-1">
                                    {user?.name}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Email
                                </p>

                                <p className="mt-1">
                                    {user?.email}
                                </p>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        );
    }

    /*
     * ADMIN DASHBOARD
     */
    if (hasRole('ADMIN')) {
        return (
            <div className="p-5 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mb-8">
                        <p className="text-sm text-red-400 mb-2">
                            Administration
                        </p>

                        <h1 className="text-3xl lg:text-4xl font-bold">
                            Welcome, {firstName}
                        </h1>

                        <p className="text-gray-400 mt-2">
                            Monitor and manage the societal impact
                            platform.
                        </p>
                    </div>

                    {/* Admin stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <p className="text-gray-500 text-sm">
                                Problems
                            </p>

                            <p className="text-3xl font-bold mt-2">
                                —
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                                Platform problems
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <p className="text-gray-500 text-sm">
                                Challenges
                            </p>

                            <p className="text-3xl font-bold mt-2">
                                —
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                                Active challenges
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <p className="text-gray-500 text-sm">
                                Verification
                            </p>

                            <p className="text-3xl font-bold mt-2">
                                —
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                                Pending reviews
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            <p className="text-gray-500 text-sm">
                                Teams
                            </p>

                            <p className="text-3xl font-bold mt-2">
                                —
                            </p>

                            <p className="text-xs text-gray-600 mt-1">
                                Platform teams
                            </p>
                        </div>

                    </div>

                    {/* Admin actions */}
                    <div className="grid md:grid-cols-3 gap-5">

                        <Link
                            to="/verification"
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition"
                        >
                            <div className="w-11 h-11 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                                ✓
                            </div>

                            <h2 className="text-xl font-semibold mt-5">
                                Verification
                            </h2>

                            <p className="text-gray-400 mt-2">
                                Review and verify reported societal
                                problems.
                            </p>
                        </Link>

                        <Link
                            to="/reports"
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition"
                        >
                            <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                                ▣
                            </div>

                            <h2 className="text-xl font-semibold mt-5">
                                Reports
                            </h2>

                            <p className="text-gray-400 mt-2">
                                Review platform reports and activity.
                            </p>
                        </Link>

                        <Link
                            to="/analytics"
                            className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition"
                        >
                            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                                ▥
                            </div>

                            <h2 className="text-xl font-semibold mt-5">
                                Analytics
                            </h2>

                            <p className="text-gray-400 mt-2">
                                Understand platform activity and
                                societal impact.
                            </p>
                        </Link>

                    </div>

                    {/* Admin account */}
                    <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">

                        <h2 className="text-lg font-semibold">
                            Administrator Account
                        </h2>

                        <div className="grid sm:grid-cols-2 gap-5 mt-5">

                            <div>
                                <p className="text-xs text-gray-500">
                                    Name
                                </p>

                                <p className="mt-1">
                                    {user?.name}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">
                                    Role
                                </p>

                                <p className="mt-1 text-red-400">
                                    ADMIN
                                </p>
                            </div>

                        </div>

                    </div>

                </div>
            </div>
        );
    }

    /*
     * GENERAL AUTHENTICATED USER
     */
    return (
        <div className="p-5 lg:p-8">
            <div className="max-w-7xl mx-auto">

                <div className="mb-8">
                    <p className="text-sm text-purple-400 mb-2">
                        Societal Platform
                    </p>

                    <h1 className="text-3xl lg:text-4xl font-bold">
                        Welcome, {firstName}
                    </h1>

                    <p className="text-gray-400 mt-2">
                        Welcome to the social impact platform.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold">
                        Your Account
                    </h2>

                    <p className="text-gray-400 mt-2">
                        {user?.email}
                    </p>

                    <p className="text-purple-400 mt-3">
                        Role: {user?.role}
                    </p>

                    <Link
                        to="/profile"
                        className="inline-block mt-6 bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-xl transition"
                    >
                        View Profile
                    </Link>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
