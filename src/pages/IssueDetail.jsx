import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import {
    AlertTriangle, MapPin, Clock, Flame, CheckCircle, Share2,
    ArrowLeft, MessageSquare, Send, ThumbsUp, Flag, RefreshCw, Camera, Loader2, ThumbsDown, ShieldCheck
} from 'lucide-react';
import { MOCK_ISSUES, MOCK_COMMENTS } from '../data/mockIssues';
import { getIssueById, voteOnResolution, addComment, getComments } from '../services/db';
import { verifyGeofence } from '../services/geo';
import { useAuth } from '../contexts/AuthContext';

const ESCALATION_TIERS = [
    { day: 0, label: 'Reported', desc: 'Issue created with AI verification' },
    { day: 15, label: 'Ward Notified', desc: 'Auto email sent to ward councillor' },
    { day: 30, label: 'Social Alert', desc: 'Auto-tweet tagging MP/MLA handle' },
    { day: 45, label: 'Critical Flag', desc: 'Flagged "Critically Neglected" + RTI auto-generated' },
    { day: 60, label: 'Hall of Shame', desc: 'Featured in weekly newsletter' },
    { day: 90, label: 'State Escalation', desc: 'Escalated to state dashboard + media alert' },
];

const markerIcon = L.divIcon({
    html: renderToString(<div className="p-1.5 rounded-full text-white shadow-lg border-2 border-white bg-red-500"><AlertTriangle size={16} /></div>),
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
});

const IssueDetail = () => {
    const { id } = useParams();
    const { userProfile } = useAuth();
    const [issue, setIssue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState(MOCK_COMMENTS);
    const [newComment, setNewComment] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        const fetchIssueData = async () => {
            setLoading(true);
            try {
                // 1. Check if it's a known mock ID
                const mockFound = MOCK_ISSUES.find(i => i.id === id);
                if (mockFound) {
                    setIssue(mockFound);
                    setLoading(false);
                    return;
                }

                // 2. Try fetching from real Firestore backend
                const realIssue = await getIssueById(id);
                if (realIssue) {
                    setIssue(realIssue);
                    setLoading(false);
                    return;
                }

                // 3. Fallback to localStorage (for dynamic but unsynced issues during demo)
                try {
                    const stored = JSON.parse(localStorage.getItem('jandarpan_issues') || '[]');
                    const storedMatch = stored.find(i => i.id === id);
                    if (storedMatch) {
                        setIssue(storedMatch);
                    } else {
                        // 4. Ultimate fallback so the page never absolutely breaks: first mock issue
                        setIssue(MOCK_ISSUES[0]);
                    }
                } catch {
                    setIssue(MOCK_ISSUES[0]);
                }
            } catch (error) {
                console.error("Error fetching issue:", error);
                setIssue(MOCK_ISSUES[0]); // fallback on error
            } finally {
                setLoading(false);
                // Fetch comments if this is a real issue
                if (!id.startsWith('m') && import.meta.env.VITE_FIREBASE_API_KEY) {
                    const fetchedComments = await getComments(id);
                    if (fetchedComments.length > 0) {
                        setComments(fetchedComments);
                    } else {
                        setComments([]); // Start with empty if it's a real issue but no comments yet
                    }
                }
            }
        };

        fetchIssueData();
    }, [id]);

    const daysAlive = issue?.reportedAt
        ? Math.max(1, Math.floor((Date.now() - new Date(issue.reportedAt).getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

    const [commentVerifying, setCommentVerifying] = useState(false);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !issue) return;

        setCommentVerifying(true);
        try {
            await verifyGeofence(issue.location.latitude, issue.location.longitude, 5000); // 5km limit

            let addedComment;
            if (import.meta.env.VITE_FIREBASE_API_KEY && !issue.id.startsWith('m')) {
                addedComment = await addComment(issue.id, newComment, userProfile);
            } else {
                addedComment = { id: `c${Date.now()}`, user: userProfile?.displayName || 'You', text: newComment, time: 'Just now', badge: userProfile?.badges?.[0] || null };
            }

            setComments([...comments, addedComment]);
            setNewComment('');
        } catch (error) {
            alert("Comment restricted:\n" + error.message);
        } finally {
            setCommentVerifying(false);
        }
    };

    const hasVoted = issue ? JSON.parse(localStorage.getItem('voted_issues') || '[]').includes(issue.id) : false;

    const handleVerify = async () => {
        if (!issue || hasVoted) return;

        setVerifying(true);
        try {
            await verifyGeofence(issue.location.latitude, issue.location.longitude, 5000); // 5km radius

            // Mark voted locally
            const voted = JSON.parse(localStorage.getItem('voted_issues') || '[]');
            voted.push(issue.id);
            localStorage.setItem('voted_issues', JSON.stringify(voted));

            setIssue({ ...issue, upvotes: issue.upvotes + 1 });
            alert("Verification successful! You are within the 5km radius.");
        } catch (error) {
            alert("Verification failed:\n" + error.message);
        } finally {
            setVerifying(false);
        }
    };

    const hasVotedOnResolution = issue ? JSON.parse(localStorage.getItem(`res_vote_${issue.id}`) || 'false') : false;
    const [resolutionVerifying, setResolutionVerifying] = useState(false);

    const handleResolutionVote = async (voteType) => {
        if (!issue || hasVotedOnResolution) return;

        setResolutionVerifying(true);
        try {
            await verifyGeofence(issue.location.latitude, issue.location.longitude, 5000); // 5km radius to verify resolution

            // Mark voted locally
            localStorage.setItem(`res_vote_${issue.id}`, 'true');

            // Send to DB
            if (import.meta.env.VITE_FIREBASE_API_KEY && !issue.id.startsWith('m')) {
                await voteOnResolution(issue.id, voteType);
            }

            // Optimistic Update
            setIssue({
                ...issue,
                communityVotes: {
                    ...issue.communityVotes,
                    [voteType]: (issue.communityVotes?.[voteType] || 0) + 1
                }
            });
            alert(`Your ${voteType.toUpperCase()} vote has been recorded.`);
        } catch (error) {
            alert("Verification failed:\n" + error.message);
        } finally {
            setResolutionVerifying(false);
        }
    };

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/issue/${id}` : '';
    const whatsappText = issue ? encodeURIComponent(`🚨 Civic Issue in ${issue.state || 'India'}: ${issue.aiClassification.issueType.replace('_', ' ')} — Severity ${issue.aiClassification.severity}/10\n📍 ${issue.location.address}\n${issue.aiClassification.description}\n\nVerify on JanDarpan: ${shareUrl}`) : '';

    if (loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Loading issue details...</div>;
    if (!issue) return <div className="p-10 text-center font-bold text-red-500">Error rendering issue details.</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4 pb-16">

            {/* Back Link */}
            <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Live Map
            </Link>

            {/* Main Card */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">

                {/* Header */}
                <div className="p-6 md:p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider ${issue.status === 'OPEN' ? 'bg-red-100 text-red-700 border border-red-200' :
                                    issue.status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                        issue.status === 'PENDING_VERIFICATION' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                            'bg-green-100 text-green-700 border border-green-200'
                                    }`}>
                                    {issue.status.replace('_', ' ')}
                                </span>
                                {issue.status !== 'RESOLVED' && issue.status !== 'PENDING_VERIFICATION' && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-lg">
                                        <Clock className="w-3 h-3" /> Ignored for {daysAlive} days
                                    </span>
                                )}
                                {issue.status === 'RESOLVED' && (
                                    <button className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100 transition-colors">
                                        <RefreshCw className="w-3 h-3" /> Still Broken?
                                    </button>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 capitalize tracking-tight">
                                {issue.aiClassification.issueType.replace(/_/g, ' ')}
                            </h1>
                            <p className="text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" /> {issue.location.address}
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <button
                                onClick={handleVerify}
                                disabled={hasVoted || verifying}
                                className={`flex items-center gap-2 font-bold text-sm px-4 py-2.5 rounded-xl transition-all ${hasVoted
                                    ? 'bg-primary-50 text-primary-600 border border-primary-200 cursor-not-allowed'
                                    : 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/30'
                                    }`}
                            >
                                {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                {hasVoted ? 'Verified' : 'Verify Issue (GPS)'}
                            </button>
                            <a
                                href={`https://wa.me/?text=${whatsappText}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
                            >
                                <Share2 className="w-4 h-4" /> Share
                            </a>
                        </div>
                    </div>
                </div>

                {/* Resolution Proof Banner (If Pending Verification) */}
                {issue.status === 'PENDING_VERIFICATION' && issue.resolutionProof && (
                    <div className="bg-blue-50/50 border-b border-blue-100 p-6 md:p-8">
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-blue-600 p-2 rounded-xl text-white shadow-md">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-slate-900 tracking-tight">Official Resolution Claim</h3>
                                    <p className="text-sm font-medium text-slate-500">The assigned official has marked this issue as resolved. Please verify if this is true.</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row gap-6">
                                {issue.resolutionProof.photoUrl && (
                                    <div className="md:w-1/3 aspect-video md:aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 relative">
                                        <img src={issue.resolutionProof.photoUrl} alt="Resolution Proof" className="w-full h-full object-cover" />
                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">Official Photo</div>
                                    </div>
                                )}
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Official Notes</h4>
                                        <p className="text-slate-700 font-medium leading-relaxed italic bg-slate-50 p-4 rounded-xl border border-slate-100">"{issue.resolutionProof.notes}"</p>
                                    </div>

                                    <div className="mt-5 border-t border-slate-100 pt-5">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-baseline justify-between">
                                            <span>Community Verification (Requires GPS)</span>
                                            <span className="text-blue-600 font-black text-sm">{issue.communityVotes?.yes || 0} Yes / {issue.communityVotes?.no || 0} No</span>
                                        </h4>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleResolutionVote('yes')}
                                                disabled={hasVotedOnResolution || resolutionVerifying}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-colors ${hasVotedOnResolution ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200'}`}
                                            >
                                                {resolutionVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                                Yes, it's fixed
                                            </button>
                                            <button
                                                onClick={() => handleResolutionVote('no')}
                                                disabled={hasVotedOnResolution || resolutionVerifying}
                                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-colors ${hasVotedOnResolution ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'}`}
                                            >
                                                {resolutionVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsDown className="w-4 h-4" />}
                                                No, still broken
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">

                    {/* Left: Details */}
                    <div className="p-6 md:p-8 space-y-5 border-b md:border-b-0 md:border-r border-slate-100">

                        {/* AI Analysis */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">AI Analysis</h3>
                            <p className="text-slate-700 font-medium leading-relaxed">{issue.aiClassification.description}</p>
                        </div>

                        {/* User Description */}
                        {issue.userDescription && (
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Citizen Report</p>
                                <p className="text-blue-800 font-medium text-sm leading-relaxed">"{issue.userDescription}"</p>
                            </div>
                        )}

                        {/* Severity */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                    <Flame className={`w-3.5 h-3.5 ${issue.aiClassification.severity >= 8 ? 'text-red-500' : 'text-amber-500'}`} />
                                    AI Severity Score
                                </span>
                                <span className="font-black text-lg text-slate-800">{issue.aiClassification.severity}/10</span>
                            </div>
                            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${issue.aiClassification.severity >= 8 ? 'bg-red-500' : issue.aiClassification.severity >= 5 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                    style={{ width: `${issue.aiClassification.severity * 10}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-xl font-black text-slate-800">{issue.upvotes}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Verifications</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-xl font-black text-slate-800">{daysAlive}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Open</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-xl font-black text-slate-800">{comments.length}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Comments</p>
                            </div>
                        </div>
                    </div>

                    {/* Right: Map + Escalation */}
                    <div className="p-6 md:p-8 space-y-5">

                        {/* Mini Map */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Location</h3>
                            <div className="h-48 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                <MapContainer center={[issue.location.latitude, issue.location.longitude]} zoom={15} scrollWheelZoom={false} className="h-full w-full" zoomControl={false} dragging={false}>
                                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                                    <Marker position={[issue.location.latitude, issue.location.longitude]} icon={markerIcon} />
                                </MapContainer>
                            </div>
                        </div>

                        {/* Escalation Timeline */}
                        <div>
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Escalation Timeline</h3>
                            <div className="space-y-0">
                                {ESCALATION_TIERS.map((tier, i) => {
                                    const reached = daysAlive >= tier.day;
                                    return (
                                        <div key={tier.day} className="flex items-start gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-3 h-3 rounded-full border-2 ${reached ? 'bg-primary-600 border-primary-700' : 'bg-slate-200 border-slate-300'} transition-colors`}></div>
                                                {i < ESCALATION_TIERS.length - 1 && (
                                                    <div className={`w-0.5 h-8 ${reached ? 'bg-primary-300' : 'bg-slate-200'}`}></div>
                                                )}
                                            </div>
                                            <div className="-mt-0.5 pb-2">
                                                <p className={`text-xs font-bold ${reached ? 'text-primary-700' : 'text-slate-400'}`}>
                                                    Day {tier.day} — {tier.label}
                                                    {reached && <span className="ml-1 text-green-600">✓</span>}
                                                </p>
                                                <p className="text-[11px] text-slate-500 font-medium">{tier.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Additional Reports (Merged Duplicates) Gallery */}
            {issue.additionalReports && issue.additionalReports.length > 0 && (
                <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                        <Camera className="w-5 h-5 text-primary-600" />
                        Additional Evidence from Community ({issue.additionalReports.length})
                    </h2>
                    <p className="text-sm text-slate-500 font-medium mb-5">These citizen reports were detected within 50m of the same issue type and have been automatically merged to consolidate evidence.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                        {issue.additionalReports.map((report, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                                {report.photoUrl && (
                                    <div className="h-44 w-full overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent z-10"></div>
                                        <img src={report.photoUrl} alt="Additional evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <span className="absolute bottom-3 left-3 z-20 text-[10px] font-bold text-white uppercase tracking-wider bg-black/40 backdrop-blur-md px-2 py-1 rounded-md">Verified Proof</span>
                                    </div>
                                )}
                                {report.userDescription && (
                                    <div className="p-4 bg-white/50">
                                        <p className="text-sm text-slate-700 font-medium leading-snug">"{report.userDescription}"</p>
                                        <div className="flex items-center gap-1.5 mt-3">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <p className="text-xs text-slate-500 font-medium">{new Date(report.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Comments Section */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-primary-600" />
                        Community Discussion ({comments.length})
                    </h2>
                </div>

                <div className="divide-y divide-slate-50 p-4">
                    {comments.map(c => (
                        <div key={c.id} className="p-4 rounded-xl hover:bg-slate-50 transition-colors">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-bold text-sm text-slate-800">{c.user}</span>
                                {c.badge && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${c.badge === 'Official' ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-green-50 text-green-700 border border-green-200'
                                        }`}>
                                        {c.badge}
                                    </span>
                                )}
                                <span className="text-xs text-slate-400 font-medium">{c.time}</span>
                            </div>
                            <p className="text-sm text-slate-600 font-medium">{c.text}</p>
                        </div>
                    ))}
                </div>

                {/* Add Comment */}
                <form onSubmit={handleAddComment} className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Add context, updates, or local knowledge..."
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!newComment.trim() || commentVerifying}
                            className="bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white p-3 rounded-xl transition-colors shadow-md shadow-primary-200 flex items-center justify-center min-w-[3rem]"
                        >
                            {commentVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
};

export default IssueDetail;
