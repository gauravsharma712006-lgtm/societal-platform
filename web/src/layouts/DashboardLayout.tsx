
import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';

const DashboardLayout = () => {
    const { user, logout, hasAnyRole } = useAuth();

    const [mobileOpen, setMobileOpen] =
        useState(false);

    const navItemClass = ({
        isActive,
    }: {
        isActive: boolean;
    }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition ${
            isActive
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
        }`;

    const closeMobileMenu = () => {
        setMobileOpen(false);
    };

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Background */}
            <div className="bg-gradient" />

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed
                    top-0
                    left-0
                    z-40
                    h-screen
                    w-72
                    border-r
                    border-white/10
                    bg-black/80
                    backdrop-blur-xl
                    transition-transform
                    duration-300
                    lg:translate-x-0
                    ${
                        mobileOpen
                            ? 'translate-x-0'
                            : '-translate-x-full'
                    }
                `}
            >
                <div className="flex h-full flex-col">

                    {/* Logo */}
                    <div className="px-6 py-6 border-b border-white/10">
                        <Link
                            to="/dashboard"
                            onClick={closeMobileMenu}
                        >
                            <h1 className="text-2xl font-bold">
                                Societal<span className="text-purple-500">.</span>
                            </h1>

                            <p className="text-xs text-gray-500 mt-1">
                                Social Impact Platform
                            </p>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">

                        <NavLink
                            to="/dashboard"
                            className={navItemClass}
                            onClick={closeMobileMenu}
                        >
                            <span>⌂</span>
                            <span>Dashboard</span>
                        </NavLink>

                        <NavLink
                            to="/problems"
                            className={navItemClass}
                            onClick={closeMobileMenu}
                        >
                            <span>◈</span>
                            <span>Problems</span>
                        </NavLink>

                        {hasAnyRole(
                            'STUDENT',
                            'MENTOR',
                            'ADMIN'
                        ) && (
                            <NavLink
                                to="/challenges"
                                className={navItemClass}
                                onClick={closeMobileMenu}
                            >
                                <span>◇</span>
                                <span>Challenges</span>
                            </NavLink>
                        )}

                        {hasAnyRole('STUDENT') && (
                            <>
                                <NavLink
                                    to="/applications"
                                    className={navItemClass}
                                    onClick={closeMobileMenu}
                                >
                                    <span>✓</span>
                                    <span>Applications</span>
                                </NavLink>

                                <NavLink
                                    to="/invitations"
                                    className={navItemClass}
                                    onClick={closeMobileMenu}
                                >
                                    <span>✉</span>
                                    <span>Invitations</span>
                                </NavLink>

                                <NavLink
                                    to="/teams"
                                    className={navItemClass}
                                    onClick={closeMobileMenu}
                                >
                                    <span>♟</span>
                                    <span>My Teams</span>
                                </NavLink>
                            </>
                        )}

                        {hasAnyRole(
                            'ADMIN',
                            'MENTOR'
                        ) && (
                            <NavLink
                                to="/teams"
                                className={navItemClass}
                                onClick={closeMobileMenu}
                            >
                                <span>♟</span>
                                <span>Teams</span>
                            </NavLink>
                        )}

                        {/* Admin section */}
                        {hasAnyRole('ADMIN') && (
                            <div className="pt-6">

                                <p className="px-4 mb-3 text-xs uppercase tracking-wider text-gray-600">
                                    Administration
                                </p>

                                <div className="space-y-2">

                                    <NavLink
                                        to="/verification"
                                        className={navItemClass}
                                        onClick={closeMobileMenu}
                                    >
                                        <span>✓</span>
                                        <span>Verification</span>
                                    </NavLink>

                                    <NavLink
                                        to="/reports"
                                        className={navItemClass}
                                        onClick={closeMobileMenu}
                                    >
                                        <span>▣</span>
                                        <span>Reports</span>
                                    </NavLink>

                                    <NavLink
                                        to="/analytics"
                                        className={navItemClass}
                                        onClick={closeMobileMenu}
                                    >
                                        <span>▥</span>
                                        <span>Analytics</span>
                                    </NavLink>

                                </div>
                            </div>
                        )}
                    </nav>

                    {/* User section */}
                    <div className="border-t border-white/10 p-4">

                        <Link
                            to="/profile"
                            onClick={closeMobileMenu}
                            className="flex items-center gap-3 rounded-xl p-3 hover:bg-white/10 transition"
                        >
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center font-semibold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>

                            <div className="min-w-0">
                                <p className="font-medium truncate">
                                    {user?.name}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {user?.role}
                                </p>
                            </div>
                        </Link>

                        <button
                            onClick={logout}
                            className="w-full mt-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition text-left"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main area */}
            <div className="lg:pl-72">

                {/* Topbar */}
                <header className="sticky top-0 z-20 border-b border-white/10 bg-black/70 backdrop-blur-xl">
                    <div className="flex items-center justify-between px-5 py-4 lg:px-8">

                        <button
                            onClick={() =>
                                setMobileOpen(true)
                            }
                            className="lg:hidden rounded-lg px-3 py-2 bg-white/10"
                        >
                            ☰
                        </button>

                        <div className="hidden lg:block">
                            <p className="text-sm text-gray-500">
                                {user?.role === 'ADMIN'
                                    ? 'Administration'
                                    : 'Social Impact Platform'}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 ml-auto">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium">
                                    {user?.name}
                                </p>

                                <p className="text-xs text-gray-500">
                                    {user?.email}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-sm font-semibold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                        </div>

                    </div>
                </header>

                {/* Page */}
                <main className="min-h-[calc(100vh-73px)]">
                    <Outlet />
                </main>

            </div>
        </div>
    );
};

export default DashboardLayout;

