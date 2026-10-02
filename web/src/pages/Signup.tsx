import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { api } from '../services/api';

function Signup() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setMessage('');
        setError('');
        setLoading(true);

        try {
            const result = await api.register({
                name,
                email,
                password,
            });

            setMessage(result.message);

            setName('');
            setEmail('');
            setPassword('');

            setTimeout(() => {
                navigate('/login');
            }, 1000);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : 'Registration failed'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">
                        Create Account
                    </h1>

                    <p className="text-gray-400 mt-2">
                        Join the Societal Platform
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >
                    <div>
                        <label className="block text-sm text-gray-300 mb-2">
                            Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                            required
                            placeholder="Enter your name"
                            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-purple-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-2">
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                            placeholder="Enter your email"
                            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-purple-500 transition"
                        />
                    </div>

                    

                    <div>
                        <label className="block text-sm text-gray-300 mb-2">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                            placeholder="Create a password"
                            className="w-full rounded-lg bg-black/40 border border-white/10 px-4 py-3 outline-none focus:border-purple-500 transition"
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm">
                            {error}
                        </p>
                    )}

                    {message && (
                        <p className="text-green-400 text-sm">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 py-3 font-semibold transition"
                    >
                        {loading
                            ? 'Creating account...'
                            : 'Create Account'}
                    </button>
                </form>

                

                <p className="text-center text-gray-400 text-sm mt-6">
                    Already have an account?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-purple-400 hover:text-purple-300"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
}

export default Signup;