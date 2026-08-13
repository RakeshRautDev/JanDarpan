import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, AlertTriangle, ShieldAlert, CheckCircle, Clock, Camera, X, Loader2 } from 'lucide-react';
import { fetchIssuesForOfficial, updateIssueStatus } from '../services/appwriteDB';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Admin = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);
    const [jurisdiction, setJurisdiction] = useState(null);

    // Resolution state
    const [resolvingIssue, setResolvingIssue] = useState(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isUploadingProof, setIsUploadingProof] = useState(false);

    const navigate = useNavigate();
    const { logout, currentUser } = useAuth();

    useEffect(() => {
        // Enforce Auth
        // In a real app we would rely on currentUser.labels, but for simplicity:
        if (!currentUser) {
            navigate('/login');
            return;
        }

        // We can mock jurisdiction based on user preference or local storage for now
        const currentRole = localStorage.getItem('official_role') || 'STATE_MP';
        const currentJurisdiction = JSON.parse(localStorage.getItem('official_jurisdiction') || '{"value":"Global"}');

        setRole(currentRole);
        setJurisdiction(currentJurisdiction);
        fetchData(currentRole, currentJurisdiction);
    }, [navigate, currentUser]);

    const fetchData = async (currentRole, currentJurisdiction) => {
        setLoading(true);
        try {
            const data = await fetchIssuesForOfficial();
            setIssues(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (issueId, newStatus, proofData = null) => {
        try {
            await updateIssueStatus(issueId, newStatus);
            // Optimistically update UI
            setIssues(issues.map(iss => iss.$id === issueId ? { ...iss, status: newStatus } : iss));
            if (proofData) {
                setResolvingIssue(null);
                setResolutionNotes('');
            }
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Failed to update status. Check permissions.");
        }
    };

    const submitResolutionProof = async (issue) => {
        if (!resolutionNotes.trim()) {
            alert("Please provide resolution notes for the community.");
            return;
        }

        setIsUploadingProof(true);
        try {
            const fakeProofPhoto = 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&q=80&w=800';

            await handleUpdateStatus(issue.$id, 'PENDING_VERIFICATION', {
                photoUrl: fakeProofPhoto,
                notes: resolutionNotes
            });

        } catch (error) {
            alert("Failed to submit proof");
        } finally {
            setIsUploadingProof(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        localStorage.removeItem('official_role');
        localStorage.removeItem('official_jurisdiction');
        navigate('/login');
    };

    if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading secure dashboard...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 pb-16">

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <div className="bg-primary-900 p-2.5 rounded-xl text-white shadow-md">
                            <ShieldAlert className="w-6 h-6" />
                        </div>
                        {role === 'STATE_MP' ? 'Member of Parliament Portal' : 'Municipal Authority Portal'}
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Viewing infrastructure reports directly assigned to: <strong className="text-slate-800">{jurisdiction?.value || 'Global'}</strong> ({jurisdiction?.state || 'N/A'})
                    </p>
                </div>
                <button
                    onClick={handleLogout}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors text-sm"
                >
                    Secure Logout
                </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-xl"><AlertTriangle className="w-5 h-5 text-slate-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Issues</p>
                        <p className="text-2xl font-black text-slate-800">{issues.length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100 flex items-center gap-4">
                    <div className="bg-red-50 p-3 rounded-xl"><AlertTriangle className="w-5 h-5 text-red-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Open</p>
                        <p className="text-2xl font-black text-red-600">{issues.filter(i => i.status?.toUpperCase() === 'OPEN').length}</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 flex items-center gap-4">
                    <div className="bg-amber-50 p-3 rounded-xl"><Clock className="w-5 h-5 text-amber-600" /></div>
                    <div>
                        <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">Investigating</p>
                        <p className="text-2xl font-black text-amber-600">{issues.filter(i => i.status?.toUpperCase() === 'INVESTIGATING').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Action Required Queue
                    </h2>
                    <span className="bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                        {issues.length} Issues
                    </span>
                </div>

                <div className="divide-y divide-slate-100 p-4">
                    {issues.length === 0 ? (
                        <div className="p-10 text-center text-slate-500 font-medium">No pressing issues in your jurisdiction. Excellent work.</div>
                    ) : (
                        issues.map(iss => (
                            <div key={iss.$id} className="p-5 flex flex-col md:flex-row gap-6 hover:bg-slate-50 transition-colors rounded-2xl border border-transparent hover:border-slate-100 my-1">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider ${iss.status?.toUpperCase() === 'OPEN' ? 'bg-red-100 text-red-700 border border-red-200' :
                                            iss.status?.toUpperCase() === 'INVESTIGATING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                iss.status?.toUpperCase() === 'PENDING_VERIFICATION' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                                    'bg-green-100 text-green-700 border border-green-200'
                                            }`}>
                                            {iss.status?.replace('_', ' ')}
                                        </span>
                                        <span className="text-sm font-bold text-slate-700 capitalize">
                                            {iss.title}
                                        </span>
                                    </div>
                                    <p className="font-semibold text-slate-800 text-lg mb-1">{iss.location_address}</p>
                                    <p className="text-sm text-slate-500 font-medium">{iss.description}</p>
                                </div>

                                <div className="flex flex-row md:flex-col gap-2 justify-center md:items-end">
                                    {iss.status?.toUpperCase() === 'OPEN' && (
                                        <button
                                            onClick={() => handleUpdateStatus(iss.$id, 'INVESTIGATING')}
                                            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
                                        >
                                            <Clock className="w-4 h-4" /> Start Investigation
                                        </button>
                                    )}
                                    {iss.status?.toUpperCase() === 'INVESTIGATING' && resolvingIssue !== iss.$id && (
                                        <button
                                            onClick={() => setResolvingIssue(iss.$id)}
                                            className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold text-sm rounded-xl transition-colors flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Resolve & Upload Proof
                                        </button>
                                    )}
                                </div>

                                {/* Resolution Proof Form */}
                                {resolvingIssue === iss.$id && (
                                    <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl animate-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                <Camera className="w-4 h-4 text-green-600" /> Upload Resolution Proof
                                            </h4>
                                            <button onClick={() => setResolvingIssue(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium mb-4">You MUST upload photographic proof and notes. The community will verify this before it is permanently marked as RESOLVED.</p>

                                        <textarea
                                            value={resolutionNotes}
                                            onChange={(e) => setResolutionNotes(e.target.value)}
                                            placeholder="Describe what action was taken to resolve this problem..."
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-green-400 mb-4 h-24 resize-none"
                                        />

                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => submitResolutionProof(iss)}
                                                disabled={isUploadingProof || !resolutionNotes.trim()}
                                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                                            >
                                                {isUploadingProof ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Proof to Community'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
    );
};

export default Admin;
