import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, AlertCircle, UserCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [mode, setMode] = useState('citizen'); // 'citizen' or 'official'
    const [isRegistering, setIsRegistering] = useState(false);

    // Form states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login, register, loading } = useAuth();

    const handleCitizenAuth = async (e) => {
        e.preventDefault();
        setError('');

        try {
            if (isRegistering) {
                await register(email, password, displayName);
            } else {
                await login(email, password);
            }
            navigate('/profile');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        }
    };

    const handleOfficialLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            await login(email, password);
            // Officials get routed to admin dashboard
            navigate('/admin');
        } catch (err) {
            setError('Invalid official credentials. Ensure you have been provisioned by an administrator.');
        }
    };

    return (
        <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-200/60 max-w-md w-full relative overflow-hidden isolate">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full mix-blend-multiply pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8 relative z-10">
                    <button
                        onClick={() => { setMode('citizen'); setError(''); }}
                        className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'citizen' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <UserCircle className="w-4 h-4" /> Citizen Login
                    </button>
                    <button
                        onClick={() => { setMode('official'); setError(''); }}
                        className={`flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === 'official' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <ShieldCheck className="w-4 h-4" /> Official Portal
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-6 border border-red-100 animate-in shake">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {/* CITIZEN MODE */}
                {mode === 'citizen' && (
                    <div className="animate-in slide-in-from-right-2 duration-300">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Welcome to JanDarpan</h1>
                            <p className="text-slate-500 text-sm font-medium mt-1">Join the community to report issues and track local problems.</p>
                        </div>

                        <form onSubmit={handleCitizenAuth} className="space-y-4">
                            {isRegistering && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                                    <input type="text" required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-sm" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="citizen@example.com" className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all shadow-sm" />
                            </div>

                            <button type="submit" disabled={loading} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 hover:shadow-primary-600/50 transition-all flex items-center justify-center mt-2 disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? "Create Account" : "Log In")}
                            </button>
                        </form>

                        <p className="text-center mt-6 text-sm font-medium text-slate-500">
                            {isRegistering ? "Already have an account?" : "Don't have an account?"}
                            <button onClick={() => setIsRegistering(!isRegistering)} className="ml-1.5 text-primary-600 font-bold hover:underline shadow-none bg-transparent">
                                {isRegistering ? "Log in" : "Sign up"}
                            </button>
                        </p>
                    </div>
                )}

                {/* OFFICIAL MODE */}
                {mode === 'official' && (
                    <div className="animate-in slide-in-from-left-2 duration-300">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Official Portal</h1>
                            <p className="text-slate-500 text-sm font-medium mt-1">Access your verified jurisdiction dashboard.</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6 flex items-start gap-3">
                            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">How Are Officials Verified?</h4>
                                <p className="text-xs font-medium text-blue-700 leading-relaxed text-left">
                                    In production, officials cannot freely register. Access is granted strictly via a manual KYC verification process handled by system administrators. Only verified representatives can action issues.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleOfficialLogin} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Official Email</label>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer@jandarpan.gov.in" className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Secure Password</label>
                                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-semibold px-4 py-3.5 rounded-xl focus:ring-2 focus:ring-slate-400 focus:bg-white transition-all shadow-sm" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-900/20 hover:shadow-slate-900/40 transition-all flex items-center justify-center mt-2 disabled:opacity-50">
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authenticate Identity"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Login;
