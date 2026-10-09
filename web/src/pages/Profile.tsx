import { useContext } from 'react';

import AuthContext from '../context/AuthContext';

function Profile() {
    const authContext = useContext(AuthContext);

    if (!authContext) {
        throw new Error(
            'Profile must be used inside AuthProvider'
        );
    }

    const {
        user,
        isLoading,
        isAuthenticated,
    } = authContext;

    if (isLoading) {
        return (
            <div className="text-gray-400">
                Loading profile...
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="text-gray-400">
                Not authenticated
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-8">

            <div>
                <h1 className="text-3xl font-bold">
                    Profile
                </h1>

                <p className="mt-2 text-gray-400">
                    View your account information.
                </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

                <div className="space-y-6">

                    <div>
                        <p className="text-sm text-gray-400">
                            Name
                        </p>

                        <p className="mt-1 text-lg">
                            {user.name}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-400">
                            Email
                        </p>

                        <p className="mt-1 text-lg break-all">
                            {user.email}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-400">
                            Role
                        </p>

                        <p className="mt-1 text-lg">
                            {user.role}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-400">
                            Verification Status
                        </p>

                        <p className="mt-1 text-lg">
                            {user.isVerified
                                ? 'Verified'
                                : 'Not Verified'}
                        </p>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default Profile;