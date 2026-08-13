import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../services/auth';
import { db } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { updateUserProfile } from '../services/db';
import { getLocationData } from '../services/geo';
import { LogOut, Trophy, Award, MapPin, Map, User, Settings, Loader2, Navigation } from 'lucide-react';

const Profile = () => {
    const { currentUser, userProfile, loading } = useAuth();
    const navigate = useNavigate();

    const [userIssues, setUserIssues] = useState([]);
    const [loadingIssues, setLoadingIssues] = useState(true);
    const [locVerifying, setLocVerifying] = useState(false);
    const [savedConstituency, setSavedConstituency] = useState('');

    useEffect(() => {
        if (userProfile?.homeConstituency) {
            setSavedConstituency(userProfile.homeConstituency);
        }
    }, [userProfile]);

    useEffect(() => {
        if (!loading && !currentUser) {
            navigate('/login');
        }
    }, [currentUser, loading, navigate]);

    useEffect(() => {
        const fetchUserIssues = async () => {
            if (!currentUser) return;
            setLoadingIssues(true);
            try {
                // We're querying the 'issues' collection where 'userId' === uid
                // (Note: Currently db.js doesn't attach userId to reports. 
                // We will add this soon. For now we fetch empty or filter local mock data)
                const issuesRef = collection(db, 'issues');
                const q = query(issuesRef, where('userId', '==', currentUser.uid), orderBy('timestamp', 'desc'));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    setUserIssues(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                } else {
                    // Just to show something in the UI until we wire up Report.jsx
                    setUserIssues([]);
                }
            } catch (err) {
                console.error("Error fetching user issues:", err);
            } finally {
                setLoadingIssues(false);
            }
        };

        fetchUserIssues();
    }, [currentUser]);

    const handleLogout = async () => {
        await logoutUser();
        // Clear official demo state too
        localStorage.removeItem('official_role');
        localStorage.removeItem('official_jurisdiction');
        navigate('/login');
    };

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert("Your browser does not support geolocation.");
            return;
        }

        setLocVerifying(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const data = await getLocationData(pos.coords.latitude, pos.coords.longitude);
                if (data.parliamentary && data.parliamentary.pc_name) {
                    const constName = `${data.parliamentary.pc_name}, ${data.parliamentary.state}`;
                    setSavedConstituency(constName);

                    // Save to Firestore
                    await updateUserProfile(currentUser.uid, { homeConstituency: constName });
                    alert(`Successfully verified! Your home area is now set to ${constName}`);
                } else {
                    alert("We could not determine your exact constituency. Make sure you are within the mapped boundaries (Odisha).");
                }
                setLocVerifying(false);
            },
            (err) => {
                alert("Location access denied or unavailable. You must allow GPS access to verify your home area.");
                setLocVerifying(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    if (loading) {
        return <div className="min-h-[80vh] flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
    }

    if (!currentUser || !userProfile) return null;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-16 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / ID Card */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-200/60 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 blur-3xl rounded-full mix-blend-multiply pointer-events-none translate-x-1/2 -translate-y-1/2"></div>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                    {/* Avatar */}
                    <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                        {userProfile.photoURL ? (
                            <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-10 h-10 text-slate-400" />
                        )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-800 tracking-tight">{userProfile.displayName || 'Citizen'}</h1>
                        <p className="text-slate-500 font-medium">{userProfile.email}</p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-bold border border-primary-100">
                                <Trophy className="w-4 h-4" />
                                {userProfile.reputationScore || 0} Rep
                            </div>

                            {userProfile.badges?.map((badge, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold border border-amber-100">
                                    <Award className="w-4 h-4" />
                                    {badge}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-colors">
                            <Settings className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={handleLogout} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-colors border border-red-100">
                            <LogOut className="w-4 h-4" /> Log out
                        </button>
                    </div>
                </div>
            </div>

            {/* Jurisdiction Preferences */}
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-200/60">
                <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-primary-600" />
                    My Geofence Preferences
                </h2>
                <p className="text-sm font-medium text-slate-500 mb-6">Verify your home area using GPS. We will personalize the Community Feed and Live Map to prioritize civic issues happening in your verified zone.</p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                            <Navigation className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Verified Location</p>
                            <p className="font-bold text-slate-800 text-lg">
                                {savedConstituency || "Not Verified Yet"}
                            </p>
                            {savedConstituency && (
                                <p className="text-xs font-semibold text-green-600 flex items-center gap-1 mt-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    GPS Locked
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleDetectLocation}
                        disabled={locVerifying}
                        className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {locVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                        {savedConstituency ? 'Update using GPS' : 'Detect & Save'}
                    </button>
                </div>
            </div>

            {/* User Activity */}
            <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-4 ml-1">My Reports ({userIssues.length})</h3>

                {loadingIssues ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-3xl p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
                ) : userIssues.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 border-dashed rounded-3xl p-10 text-center">
                        <Map className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-slate-700 font-bold mb-1">No civic issues reported yet</h4>
                        <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto">When you report a pothole, leak, or hazard using the camera, it will be permanently recorded here under your profile.</p>
                        <button onClick={() => navigate('/report')} className="mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-6 rounded-xl shadow-md transition-all">
                            Report First Issue
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userIssues.map(issue => (
                            <div key={issue.id} onClick={() => navigate(`/issue/${issue.id}`)} className="bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:shadow-lg hover:border-primary-300 transition-all">
                                <p className="font-bold text-slate-800 truncate">{issue.aiClassification?.issueType}</p>
                                <p className="text-xs font-semibold text-slate-500 mt-1">{new Date(issue.reportedAt).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Profile;
