import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    MessageSquare, ThumbsUp, Clock, Flame, MapPin, Filter, Search,
    ArrowUpRight, CheckCircle, AlertTriangle, Eye, Share2, Flag, RefreshCw, Loader2
} from 'lucide-react';
import { MOCK_ISSUES as MOCK_FEED } from '../data/mockIssues';
import { verifyGeofence } from '../services/geo';
import { getActiveIssues, verifyIssue } from '../services/db';

const STATUS_COLORS = {
    OPEN: 'bg-red-100 text-red-700 border-red-200',
    INVESTIGATING: 'bg-amber-100 text-amber-700 border-amber-200',
    PENDING_VERIFICATION: 'bg-blue-100 text-blue-700 border-blue-200',
    RESOLVED: 'bg-green-100 text-green-700 border-green-200',
};

const SEVERITY_COLORS = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-blue-500',
};

const Community = () => {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('trending'); // trending | newest | oldest | severity
    const [verifyingId, setVerifyingId] = useState(null);

    useEffect(() => {
        const fetchIssues = async () => {
            setLoading(true);
            try {
                if (import.meta.env.VITE_FIREBASE_API_KEY) {
                    const active = await getActiveIssues();
                    if (active.length > 0) {
                        setIssues(active);
                    } else {
                        setIssues(MOCK_FEED); // fallback if db is empty for demo purposes
                    }
                } else {
                    setIssues(MOCK_FEED);
                }
            } catch (error) {
                console.error("Error fetching community issues:", error);
                setIssues(MOCK_FEED);
            } finally {
                setLoading(false);
            }
        };

        fetchIssues();
    }, []);

    // Collect unique issue types dynamically
    const issueTypes = ['all', ...new Set(issues.filter(i => i.aiClassification).map(i => i.aiClassification.issueType))];

    // Filter + Sort
    let filtered = [...issues];
    if (filterStatus !== 'all') filtered = filtered.filter(i => i.status === filterStatus);
    if (filterType !== 'all') filtered = filtered.filter(i => i.aiClassification.issueType === filterType);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(i =>
            i.aiClassification.description.toLowerCase().includes(q) ||
            i.location.address.toLowerCase().includes(q) ||
            i.aiClassification.issueType.toLowerCase().includes(q) ||
            (i.userDescription || '').toLowerCase().includes(q)
        );
    }

    // Sort
    if (sortBy === 'trending') filtered.sort((a, b) => b.upvotes - a.upvotes);
    else if (sortBy === 'newest') filtered.sort((a, b) => new Date(b.reportedAt) - new Date(a.reportedAt));
    else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.reportedAt) - new Date(b.reportedAt));
    else if (sortBy === 'severity') filtered.sort((a, b) => b.aiClassification.severity - a.aiClassification.severity);

    const handleUpvote = async (issue) => {
        const id = issue.id;
        const voted = JSON.parse(localStorage.getItem('voted_issues') || '[]');
        if (voted.includes(id)) return;

        setVerifyingId(id);
        try {
            await verifyGeofence(issue.location.latitude, issue.location.longitude, 5000); // 5km radius max

            if (import.meta.env.VITE_FIREBASE_API_KEY && !id.startsWith('m')) {
                await verifyIssue(id);
            }

            voted.push(id);
            localStorage.setItem('voted_issues', JSON.stringify(voted));
            setIssues(issues.map(i => i.id === id ? { ...i, upvotes: (i.upvotes || 0) + 1 } : i));
            alert("Verification successful! You are within the 5km radius.");
        } catch (error) {
            alert("Verification failed:\n" + error.message);
        } finally {
            setVerifyingId(null);
        }
    };

    const getDaysAlive = (date) => Math.max(1, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)));
    const hasVoted = (id) => JSON.parse(localStorage.getItem('voted_issues') || '[]').includes(id);

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4 pb-16">
            
            {loading && <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none"><Loader2 className="w-8 h-8 animate-spin text-primary-600" /></div>}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                        <div className="bg-primary-600 p-2.5 rounded-2xl text-white shadow-lg shadow-primary-500/20">
                            <Eye className="w-7 h-7" />
                        </div>
                        Community Watch
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Browse, verify, and discuss civic issues reported by citizens across your area.</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                    <span className="bg-slate-100 text-slate-600 font-bold px-3 py-1.5 rounded-full border border-slate-200">
                        {filtered.length} issues
                    </span>
                </div>
            </div>

            {/* Search + Filters Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search issues by location, type, or description..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-all"
                    />
                </div>

                {/* Filter row */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Status */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Status</span>
                        {['all', 'OPEN', 'INVESTIGATING', 'PENDING_VERIFICATION', 'RESOLVED'].map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${filterStatus === s
                                    ? 'bg-slate-900 text-white border-slate-700'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {s === 'all' ? 'All' : s.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-5 bg-slate-200 mx-1 hidden md:block"></div>

                    {/* Issue Type — dynamic from data */}
                    <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Type</span>
                        {issueTypes.map(t => (
                            <button
                                key={t}
                                onClick={() => setFilterType(t)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all capitalize ${filterType === t
                                    ? 'bg-slate-900 text-white border-slate-700'
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {t === 'all' ? 'All' : t.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-5 bg-slate-200 mx-1 hidden md:block"></div>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-full outline-none focus:ring-2 focus:ring-primary-400"
                    >
                        <option value="trending">🔥 Trending</option>
                        <option value="newest">🕐 Newest</option>
                        <option value="oldest">📅 Oldest</option>
                        <option value="severity">⚠️ Severity</option>
                    </select>
                </div>
            </div>

            {/* Issue Feed */}
            <div className="space-y-3">
                {filtered.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <p className="text-slate-400 font-bold text-lg">No issues match your filters.</p>
                        <button onClick={() => { setFilterStatus('all'); setFilterType('all'); setSearchQuery(''); }} className="text-primary-600 font-bold text-sm mt-2 hover:underline">Clear all filters</button>
                    </div>
                )}

                {filtered.map(issue => {
                    const daysAlive = getDaysAlive(issue.reportedAt);
                    const sevLevel = issue.aiClassification.severity >= 8 ? 'high' : issue.aiClassification.severity >= 5 ? 'medium' : 'low';
                    const voted = hasVoted(issue.id);

                    return (
                        <div key={issue.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all overflow-hidden group">
                            <div className="p-5 flex flex-col md:flex-row gap-4">

                                {/* Upvote Column */}
                                <div className="flex md:flex-col items-center md:items-center gap-2 md:gap-1 md:w-16 flex-shrink-0">
                                    <button
                                        onClick={() => handleUpvote(issue)}
                                        disabled={voted || verifyingId === issue.id}
                                        className={`p-2 rounded-xl border transition-all ${voted
                                            ? 'bg-primary-50 border-primary-200 text-primary-600'
                                            : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-600'
                                            }`}
                                    >
                                        {verifyingId === issue.id ? <Loader2 className="w-5 h-5 animate-spin text-primary-600" /> : <ThumbsUp className="w-5 h-5" />}
                                    </button>
                                    <span className="font-black text-lg text-slate-800">{issue.upvotes}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase hidden md:block">votes</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Title row */}
                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                        <span className={`w-2 h-2 rounded-full ${SEVERITY_COLORS[sevLevel]}`}></span>
                                        <Link to={`/issue/${issue.id}`} className="font-bold text-slate-900 text-lg capitalize hover:text-primary-600 transition-colors truncate">
                                            {issue.aiClassification.issueType.replace(/_/g, ' ')}
                                        </Link>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border ${STATUS_COLORS[issue.status] || 'bg-slate-100'}`}>
                                            {issue.status.replace('_', ' ')}
                                        </span>
                                        {issue.status !== 'RESOLVED' && issue.status !== 'PENDING_VERIFICATION' && (
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {daysAlive}d
                                            </span>
                                        )}
                                        {issue.status === 'RESOLVED' && (
                                            <button className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-red-100 transition-colors">
                                                <RefreshCw className="w-3 h-3" /> Still Broken?
                                            </button>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed mb-2 line-clamp-2">{issue.aiClassification.description}</p>

                                    {/* User description */}
                                    {issue.userDescription && (
                                        <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 mb-2 line-clamp-1 font-medium">
                                            💬 Citizen: "{issue.userDescription}"
                                        </p>
                                    )}

                                    {/* Meta row */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {issue.location.address}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Flame className={`w-3 h-3 ${issue.aiClassification.severity >= 8 ? 'text-red-500' : 'text-amber-500'}`} />
                                            Severity {issue.aiClassification.severity}/10
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3 h-3" /> {issue.commentCount || 0} comments
                                        </span>
                                    </div>
                                </div>

                                {/* Action Column */}
                                <div className="flex md:flex-col items-center gap-2 md:w-24 flex-shrink-0 justify-end">
                                    <Link
                                        to={`/issue/${issue.id}`}
                                        className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                                    >
                                        <ArrowUpRight className="w-3.5 h-3.5" /> Details
                                    </Link>
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`🚨 ${issue.aiClassification.issueType.replace(/_/g, ' ')} at ${issue.location.address} — Severity ${issue.aiClassification.severity}/10\n${issue.aiClassification.description}\n\nVerify: ${window.location.origin}/issue/${issue.id}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                                    >
                                        <Share2 className="w-3.5 h-3.5" /> Share
                                    </a>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Moderator Leaderboard */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-primary-600" />
                        Top Community Moderators
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">This Month</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    {[
                        { name: 'Citizen_Odisha42', verifications: 87, badge: '🛡️ Ward Guardian', rank: 1 },
                        { name: 'BhubaneswarEye', verifications: 65, badge: '🔍 Watchdog', rank: 2 },
                        { name: 'FixMyCity_OD', verifications: 41, badge: '📣 Amplifier', rank: 3 },
                    ].map(mod => (
                        <div key={mod.name} className="p-4 flex items-center gap-3">
                            <div className="font-black text-2xl text-slate-200 w-8">#{mod.rank}</div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-800 text-sm">{mod.name}</p>
                                <p className="text-xs text-slate-500 font-medium">{mod.verifications} verifications</p>
                            </div>
                            <span className="text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 px-2.5 py-1 rounded-full">{mod.badge}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Community;
