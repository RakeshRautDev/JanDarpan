import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, AlertTriangle, CheckCircle, Flame, Navigation, Filter, Clock, Share2, ExternalLink, UserSquare, ShieldAlert, Award, ChevronRight, X } from 'lucide-react';
import { getAllIssues, verifyIssue } from '../../services/appwriteDB';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import { renderToString } from 'react-dom/server';
import { useTranslation } from 'react-i18next';
import { MOCK_ISSUES } from '../../data/mockIssues';
import politiciansData from '../../data/politicians.json';

const ISSUE_TYPES = [
    { key: 'all', label: 'All Issues', color: 'bg-slate-600' },
    { key: 'pothole', label: 'Potholes', color: 'bg-red-500' },
    { key: 'garbage', label: 'Garbage', color: 'bg-amber-500' },
    { key: 'waterlog', label: 'Waterlog', color: 'bg-blue-500' },
    { key: 'street_light', label: 'Lights', color: 'bg-purple-500' },
    { key: 'open_drain', label: 'Drains', color: 'bg-emerald-500' },
];

const getLevenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const fuzzyMatchConstituency = (str1, str2) => {
    if (!str1 || !str2) return false;
    if (str1.toLowerCase() === str2.toLowerCase()) return true;

    const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
    const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (getLevenshteinDistance(s1, s2) <= 2) return true;

    const words1 = str1.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    const words2 = str2.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
    if (words1.length === 0 || words2.length === 0) return false;

    let overlap = 0;
    for (let w1 of words1) {
        for (let w2 of words2) {
             if (getLevenshteinDistance(w1, w2) <= 1) {
                 overlap++;
                 break;
             }
        }
    }
    const maxLen = Math.max(words1.length, words2.length);
    return (overlap / maxLen) >= 0.6;
};

const STATE_NAME_MAPPING = {
    'orissa': 'odisha',
    'chhattisgarh': 'chattisgarh',
    'jammu_&_kashmir': 'jammu_and_kashmir',
    'uttarkhand': 'uttarakhand',
    'nct_of_delhi': 'delhi',
    'andaman_&_nicobar_islands': 'andaman_and_nicobar_islands',
    'dadra_&_nagar_haveli': 'dadra_and_nagar_haveli',
    'daman_&_diu': 'daman_and_diu',
};

const createCustomIcon = (type, severity) => {
    let color = 'bg-blue-500';
    let IconComponent = MapPin;

    if (type === 'high') {
        color = 'bg-red-500'; IconComponent = AlertTriangle;
    } else if (type === 'medium') {
        color = 'bg-amber-500'; IconComponent = Flame;
    }

    const html = renderToString(
        <div className={`p-1.5 rounded-full text-white shadow-lg border-2 border-white ${color}`}>
            <IconComponent size={16} />
        </div>
    );

    return L.divIcon({ html, className: 'custom-leaflet-icon', iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] });
};

const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

const LiveMap = ({ center = [20.2961, 85.8245], zoom = 13 }) => {
    const [issues, setIssues] = useState([]);
    const issuesRef = useRef([]);
    const [loading, setLoading] = useState(true);
    const [verifyingId, setVerifyingId] = useState(null);
    const [walkMode, setWalkMode] = useState(false);
    const [userPos, setUserPos] = useState(null);
    const [typeFilter, setTypeFilter] = useState('all');
    const [geoJsonData, setGeoJsonData] = useState(null);
    const [assemblyGeoJson, setAssemblyGeoJson] = useState(null);
    const assemblyGeoJsonRef = useRef(null);
    const [selectedTerritory, setSelectedTerritory] = useState(null);
    const [netaData, setNetaData] = useState([]);
    const netaDataRef = useRef([]);
    const [mapLayer, setMapLayer] = useState('parliament');
    const { t } = useTranslation();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch issues from Appwrite
                const data = await getAllIssues();
                const formattedIssues = data.map(doc => ({
                    id: doc.$id,
                    location: {
                        latitude: doc.location_lat || 20.2961,
                        longitude: doc.location_lng || 85.8245,
                        address: doc.location_address || 'Unknown Location'
                    },
                    aiClassification: {
                        severity: doc.severity || 5,
                        issueType: doc.title?.toLowerCase() || 'other',
                        description: doc.description || ''
                    },
                    status: doc.status?.toUpperCase() || 'OPEN',
                    reportedAt: doc.createdAt,
                    userDescription: doc.description,
                    photoUrl: doc.imageUrl,
                    upvotes: doc.upvotes || 0
                }));
                
                const finalIssues = formattedIssues.length === 0 ? MOCK_ISSUES : formattedIssues;
                setIssues(finalIssues);
                issuesRef.current = finalIssues;

                // Fetch GeoJSON Boundaries
                const geoRes = await fetch('/data/constituencies.geojson');
                if (geoRes.ok) {
                    const geoData = await geoRes.json();
                    setGeoJsonData(geoData);
                }

                // Fetch Assembly GeoJSON invisibly
                const assemblyRes = await fetch('/data/india_assembly.geojson');
                if (assemblyRes.ok) {
                    const assemblyData = await assemblyRes.json();
                    setAssemblyGeoJson(assemblyData);
                    assemblyGeoJsonRef.current = assemblyData;
                }

                // Fetch MyNeta MP Data (All historical, then sort by year descending)
                const netaRes = await fetch('/myneta/mps');
                if (netaRes.ok) {
                    const netaJson = await netaRes.json();
                    if (netaJson.mps) {
                        const sortedMps = netaJson.mps.sort((a, b) => (b.year || 0) - (a.year || 0));
                        setNetaData(sortedMps);
                        netaDataRef.current = sortedMps;
                    }
                }
            } catch (err) {
                console.error("Failed to load map data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleFeatureClick = async (feature, latlng, layerType) => {
        let pcName = '';
        let acName = '';
        let stName = '';

        if (layerType === 'parliament') {
            pcName = feature.properties?.pc_name;
            stName = feature.properties?.st_name || 'India';
        } else {
            acName = feature.properties?.AC_NAME;
            pcName = feature.properties?.PC_NAME;
            stName = feature.properties?.ST_NAME || 'India';
        }

        if (!pcName && !acName) return;

        const currentIssues = issuesRef.current;
        const currentAssemblyGeoJson = assemblyGeoJsonRef.current;
        const currentNetaData = netaDataRef.current;

        // Find Issues in this constituency
        const territoryIssues = currentIssues.filter(iss => layerType === 'parliament' ? iss.location?.mappedConstituency?.pc_name === pcName : iss.location?.mappedConstituency?.ac_name === acName);
        
        // Initial state with loading
        setSelectedTerritory({
            name: layerType === 'parliament' ? pcName : acName,
            state: stName,
            layerType,
            loading: true,
            stats: {
                total: territoryIssues.length,
                resolved: territoryIssues.filter(i => i.status === 'RESOLVED').length,
                pendingVerification: territoryIssues.filter(i => i.status === 'PENDING_VERIFICATION').length,
                open: territoryIssues.filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length
            }
        });

        let matchedNeta = null;
        let matchedMlas = [];

        if (pcName) {
            matchedNeta = currentNetaData.find(n => fuzzyMatchConstituency(pcName, n.constituency));
        }

        let stParam = stName.toLowerCase().replace(/ /g, '_');
        stParam = STATE_NAME_MAPPING[stParam] || stParam;

        if (layerType === 'parliament' && currentAssemblyGeoJson) {
            // Find all ACs in this PC
            const acFeatures = currentAssemblyGeoJson.features.filter(f => f.properties.PC_NAME?.toLowerCase() === pcName.toLowerCase());
            const acNames = acFeatures.map(f => f.properties.AC_NAME);
            
            try {
                const mlaRes = await fetch(`/myneta/mlas/${stParam}`);
                if (mlaRes.ok) {
                    const mlaJson = await mlaRes.json();
                    if (mlaJson.mlas) {
                        matchedMlas = mlaJson.mlas.filter(m => acNames.some(ac => fuzzyMatchConstituency(ac, m.constituency)));
                    }
                }
            } catch (e) {
                console.error("Failed to fetch MLA data", e);
            }
        } else if (layerType === 'assembly') {
            try {
                const mlaRes = await fetch(`/myneta/mlas/${stParam}`);
                if (mlaRes.ok) {
                    const mlaJson = await mlaRes.json();
                    if (mlaJson.mlas) {
                        const mla = mlaJson.mlas.find(m => fuzzyMatchConstituency(acName, m.constituency));
                        if (mla) matchedMlas = [{ ...mla, no: acName }];
                    }
                }
            } catch (e) {
                console.error("Failed to fetch MLA data", e);
            }
        }

        setSelectedTerritory(prev => ({
            ...prev,
            loading: false,
            representative: matchedNeta ? {
                name: matchedNeta.name,
                party: matchedNeta.party,
                criminal_cases: matchedNeta.criminal_cases,
                education: matchedNeta.education
            } : prev?.representative,
            mlasList: matchedMlas.map(m => ({
                name: m.name,
                no: m.constituency || acName,
                state: stName,
                party: m.party,
                criminal_cases: m.criminal_cases,
                education: m.education
            }))
        }));
    };

    const geoJsonStyle = {
        fillColor: '#6366f1',
        weight: 2,
        opacity: 0.6,
        color: '#4f46e5',
        dashArray: '3',
        fillOpacity: 0.05
    };

    const onEachFeature = (feature, layer) => {
        layer.on({
            mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                    weight: 3,
                    color: '#4338ca',
                    dashArray: '',
                    fillOpacity: 0.15
                });
                layer.bringToFront();
            },
            mouseout: (e) => {
                const layer = e.target;
                layer.setStyle(geoJsonStyle);
            },
            click: (e) => {
                handleFeatureClick(feature, e.latlng);
            }
        });

        // Add a simple tooltip for hover
        if (feature.properties && feature.properties.pc_name) {
            layer.bindTooltip(`<strong>${feature.properties.pc_name}</strong><br/>Click for details`, { sticky: true, className: 'custom-tooltip text-sm shadow-md border-0 rounded-lg' });
        }
    };

    const handleVerify = async (id) => {
        const voted = JSON.parse(localStorage.getItem('voted_issues') || '[]');
        if (voted.includes(id)) { alert(t('map.alreadyVoted')); return; }
        setVerifyingId(id);
        try {
            await verifyIssue(id);
            voted.push(id);
            localStorage.setItem('voted_issues', JSON.stringify(voted));
            setIssues(issues.map(iss => iss.id === id ? { ...iss, upvotes: (iss.upvotes || 0) + 1 } : iss));
        } catch (err) { console.error("Upvote failed", err); }
        finally { setVerifyingId(null); }
    };

    const handleWalkMyStreet = () => {
        if (!walkMode) {
            navigator.geolocation.getCurrentPosition(pos => {
                setUserPos([pos.coords.latitude, pos.coords.longitude]);
                setWalkMode(true);
            }, () => alert('Location access required for Walk My Street'));
        } else { setWalkMode(false); setUserPos(null); }
    };

    const WALK_RADIUS_M = 500;
    const getDistanceM = (lat1, lon1, lat2, lon2) => {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    let visibleIssues = walkMode && userPos
        ? issues.filter(iss => getDistanceM(userPos[0], userPos[1], iss.location.latitude, iss.location.longitude) <= WALK_RADIUS_M)
        : issues;

    if (typeFilter !== 'all') {
        visibleIssues = visibleIssues.filter(iss => iss.aiClassification.issueType === typeFilter);
    }

    return (
        <div className="relative z-0">
            {/* Controls Bar */}
            <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2">
                {/* Issue Type Filter Chips */}
                <div className="flex flex-wrap gap-1.5">
                    {ISSUE_TYPES.map(it => (
                        <button
                            key={it.key}
                            onClick={() => setTypeFilter(it.key)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md border shadow-sm ${typeFilter === it.key
                                ? 'bg-slate-900 text-white border-slate-700 shadow-md'
                                : 'bg-white/90 text-slate-600 border-slate-200 hover:bg-white'
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${it.color}`}></span>
                            {it.label}
                        </button>
                    ))}
                </div>

                {/* Map Layer Toggle */}
                <div className="flex bg-white/90 backdrop-blur-md rounded-full border border-slate-200 shadow-sm p-1">
                    <button
                        onClick={() => { setMapLayer('parliament'); setSelectedTerritory(null); }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mapLayer === 'parliament' ? 'bg-primary-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        Lok Sabha
                    </button>
                    <button
                        onClick={() => { setMapLayer('assembly'); setSelectedTerritory(null); }}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${mapLayer === 'assembly' ? 'bg-primary-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                        Vidhan Sabha
                    </button>
                </div>

                {/* Walk My Street */}
                <button
                    onClick={handleWalkMyStreet}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold shadow-lg transition-all backdrop-blur-md border ${walkMode
                        ? 'bg-primary-600 text-white border-primary-700 ring-2 ring-primary-300'
                        : 'bg-white/90 text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    <Navigation className={`w-4 h-4 ${walkMode ? 'animate-pulse' : ''}`} />
                    {walkMode ? `${t('map.walkStreet')} (${visibleIssues.length})` : t('map.walkStreet')}
                </button>
            </div>

            {/* Map Legend */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-md">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Severity</p>
                <div className="flex flex-col gap-1.5 text-xs font-bold">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500 border border-red-600"></span>
                        <span className="text-slate-600">Critical (8-10)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></span>
                        <span className="text-slate-600">Medium (5-7)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600"></span>
                        <span className="text-slate-600">Low (1-4)</span>
                    </div>
                </div>
            </div>

            {/* Issue Counter */}
            <div className="absolute top-3 right-3 z-[1000] bg-white/90 backdrop-blur-md rounded-full px-4 py-2 border border-slate-200 shadow-md">
                <span className="text-sm font-black text-slate-800">{visibleIssues.length}</span>
                <span className="text-xs font-semibold text-slate-500 ml-1">issues visible</span>
            </div>

            {/* Selected Territory Overlay Panel */}
            {selectedTerritory && (
                <div className="absolute top-16 right-3 bottom-16 w-80 z-[1000] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col animate-in slide-in-from-right-4 duration-300">
                    <div className="p-4 bg-slate-900 flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Constituency Info</p>
                            <h3 className="font-black text-white text-lg leading-tight">{selectedTerritory.name}</h3>
                            <p className="text-slate-400 text-xs font-medium">{selectedTerritory.state}</p>
                        </div>
                        <button onClick={() => setSelectedTerritory(null)} className="text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
                        {selectedTerritory.loading && (
                            <div className="flex flex-col items-center justify-center h-40 gap-3">
                                <span className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></span>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fetching real-time data...</p>
                            </div>
                        )}

                        {!selectedTerritory.loading && (
                            <>
                                {/* Representatives Section */}
                                <div className="mb-6">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                        <UserSquare className="w-4 h-4" /> Elected Representatives
                                    </h4>

                                    <div className="space-y-3">
                                        {/* MP Card */}
                                        <a 
                                            href={`https://netakhoj-web.vercel.app/member?name=${encodeURIComponent(selectedTerritory.representative?.name || selectedTerritory.name)}&type=MP&constituency=${encodeURIComponent(selectedTerritory.name)}&party=${encodeURIComponent(selectedTerritory.representative?.party || '')}`}
                                            target="_blank" rel="noopener noreferrer" 
                                            className="block bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
                                            title="View detailed profile on NetaKhoj"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Lok Sabha (MP)</p>
                                                <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary-500" />
                                            </div>
                                            <h5 className="font-bold text-slate-800 text-sm group-hover:text-primary-700 transition-colors">
                                                {selectedTerritory.representative?.name || selectedTerritory.name}
                                            </h5>
                                            
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {selectedTerritory.representative?.party && (
                                                    <span className="inline-block px-1.5 py-0.5 bg-primary-50 text-primary-700 font-bold text-[9px] rounded uppercase border border-primary-100">
                                                        {selectedTerritory.representative.party}
                                                    </span>
                                                )}
                                                {selectedTerritory.representative?.education && (
                                                    <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[9px] rounded uppercase border border-slate-200">
                                                        {selectedTerritory.representative.education}
                                                    </span>
                                                )}
                                                {selectedTerritory.representative?.criminal_cases !== undefined && (
                                                    <span className={`inline-block px-1.5 py-0.5 font-bold text-[9px] rounded uppercase border ${selectedTerritory.representative.criminal_cases > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                        {selectedTerritory.representative.criminal_cases} Criminal Cases
                                                    </span>
                                                )}
                                            </div>
                                        </a>

                                        {/* MLA List */}
                                        {selectedTerritory.mlasList && selectedTerritory.mlasList.length > 0 && (
                                            <div className="mt-4">
                                                <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Vidhan Sabha (MLAs) - {selectedTerritory.mlasList.length}</h5>
                                                <div className="max-h-64 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                                                {selectedTerritory.mlasList.map((mla, idx) => (
                                                    <a 
                                                        key={idx}
                                                        href={`https://netakhoj-web.vercel.app/member?name=${encodeURIComponent(mla.name)}&type=MLA&constituency=${encodeURIComponent(mla.no)}&party=${encodeURIComponent(mla.party || '')}`}
                                                        target="_blank" rel="noopener noreferrer" 
                                                        className="block bg-slate-50 border border-slate-200 rounded-xl p-3 hover:border-primary-400 hover:shadow-md transition-all cursor-pointer group"
                                                        title="View detailed profile on NetaKhoj"
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase">Vidhan Sabha (MLA)</p>
                                                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-primary-500" />
                                                        </div>
                                                        <h5 className="font-bold text-slate-800 text-sm group-hover:text-primary-700 transition-colors">
                                                            {mla.name}
                                                        </h5>
                                                        <span className="text-[10px] text-slate-500 block mb-2">{mla.no} — {mla.state}</span>
                                                        
                                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                                            {mla.party && (
                                                                <span className="inline-block px-1.5 py-0.5 bg-primary-50 text-primary-700 font-bold text-[9px] rounded uppercase border border-primary-100">
                                                                    {mla.party}
                                                                </span>
                                                            )}
                                                            {mla.education && (
                                                                <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 font-bold text-[9px] rounded uppercase border border-slate-200">
                                                                    {mla.education}
                                                                </span>
                                                            )}
                                                            {mla.criminal_cases !== undefined && (
                                                                <span className={`inline-block px-1.5 py-0.5 font-bold text-[9px] rounded uppercase border ${mla.criminal_cases > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                                                    {mla.criminal_cases} Criminal Cases
                                                                </span>
                                                            )}
                                                        </div>
                                                    </a>
                                                ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Infrastructure Section */}
                                {selectedTerritory.infrastructure && (
                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                            <Navigation className="w-4 h-4" /> Local Infrastructure
                                        </h4>
                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ShieldAlert className="w-4 h-4 text-amber-600" />
                                                <span className="text-xs font-bold text-amber-800">Nearest Police Station</span>
                                            </div>
                                            <p className="text-sm font-black text-amber-950 uppercase">{selectedTerritory.infrastructure.police_station?.properties?.ps}</p>
                                            <p className="text-[10px] text-amber-700 font-medium">
                                                {selectedTerritory.infrastructure.police_station?.distance_km} km away in {selectedTerritory.infrastructure.police_station?.properties?.district}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Jurisdiction Section */}
                                {selectedTerritory.jurisdiction && (
                                    <div className="mb-6">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                            <CheckCircle className="w-4 h-4" /> Jurisdiction
                                        </h4>
                                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                                            <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Corporation</span> <span className="font-bold text-slate-700">{selectedTerritory.jurisdiction.municipality_corporation}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">Local Ward</span> <span className="font-bold text-slate-700">{selectedTerritory.jurisdiction.local_body_panchayat_ward}</span></div>
                                            <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase text-[9px]">District</span> <span className="font-bold text-slate-700">{selectedTerritory.jurisdiction.district_zila_parishad}</span></div>
                                        </div>
                                    </div>
                                )}

                                {/* Local Issue Statistics */}
                                <div>
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                        <AlertTriangle className="w-4 h-4" /> Civic Accountability
                                    </h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center bg-red-50 border border-red-100 p-3 rounded-xl">
                                            <span className="text-sm font-bold text-red-700">Open Issues</span>
                                            <span className="font-black text-red-700 text-lg">{selectedTerritory.stats.open}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-green-50 border border-green-100 p-3 rounded-xl">
                                            <span className="text-sm font-bold text-green-700">Resolved</span>
                                            <span className="font-black text-green-700 text-lg">{selectedTerritory.stats.resolved}</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200">
                        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-1.5">
                            Report in {selectedTerritory.name} <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="h-[550px] w-full rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                    {userPos && walkMode && (
                        <Circle
                            center={userPos}
                            radius={WALK_RADIUS_M}
                            pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
                        />
                    )}

                    {/* Render GeoJSON Constituencies overlay */}
                    {mapLayer === 'parliament' && geoJsonData && (
                        <GeoJSON
                            key="parliament-layer"
                            data={geoJsonData}
                            style={geoJsonStyle}
                            onEachFeature={(feature, layer) => {
                                layer.on({ click: (e) => handleFeatureClick(feature, e.latlng, 'parliament') });
                                if (feature.properties && feature.properties.pc_name) {
                                    layer.bindTooltip(`<strong>${feature.properties.pc_name}</strong><br/>Click for details`, { sticky: true, className: 'custom-tooltip text-sm shadow-md border-0 rounded-lg' });
                                }
                            }}
                        />
                    )}
                    {mapLayer === 'assembly' && assemblyGeoJson && (
                        <GeoJSON
                            key="assembly-layer"
                            data={assemblyGeoJson}
                            style={geoJsonStyle}
                            onEachFeature={(feature, layer) => {
                                layer.on({ click: (e) => handleFeatureClick(feature, e.latlng, 'assembly') });
                                if (feature.properties && feature.properties.AC_NAME) {
                                    layer.bindTooltip(`<strong>${feature.properties.AC_NAME}</strong><br/>Click for details`, { sticky: true, className: 'custom-tooltip text-sm shadow-md border-0 rounded-lg' });
                                }
                            }}
                        />
                    )}

                    {visibleIssues.map(issue => (
                        <Marker
                            key={issue.id}
                            position={[issue.location.latitude, issue.location.longitude]}
                            icon={createCustomIcon(issue.aiClassification.severity >= 8 ? 'high' : issue.aiClassification.severity >= 5 ? 'medium' : 'low')}
                        >
                            <Popup className="custom-popup" maxWidth={320}>
                                <div className="p-1 min-w-[240px]">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-slate-800 capitalize text-base">{issue.aiClassification.issueType.replace('_', ' ')}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${issue.status === 'RESOLVED' ? 'bg-green-100 text-green-700' :
                                            issue.status === 'INVESTIGATING' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {issue.status}
                                        </span>
                                    </div>

                                    {/* AI Description */}
                                    <p className="text-xs text-slate-600 mb-2 font-medium leading-relaxed">{issue.aiClassification.description}</p>

                                    {/* Time-Alive Counter */}
                                    {issue.status !== 'RESOLVED' && issue.reportedAt && (
                                        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-lg">
                                            <Clock className="w-3.5 h-3.5" />
                                            Ignored for {Math.max(1, Math.floor((Date.now() - new Date(issue.reportedAt).getTime()) / (1000 * 60 * 60 * 24)))} days
                                        </div>
                                    )}

                                    {/* User Description if available */}
                                    {issue.userDescription && (
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mb-2">
                                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-0.5">Citizen Report</p>
                                            <p className="text-xs text-blue-800 font-medium leading-relaxed">"{issue.userDescription}"</p>
                                        </div>
                                    )}

                                    {/* Photo Thumbnail if available */}
                                    {issue.photoUrl && (
                                        <img src={issue.photoUrl} alt="Issue evidence" className="w-full h-28 object-cover rounded-lg mb-2 border border-slate-200" />
                                    )}

                                    {/* Severity Bar */}
                                    <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1.5 rounded-md border border-slate-100">
                                        <Flame className={`w-3.5 h-3.5 ${issue.aiClassification.severity >= 8 ? 'text-red-500' : 'text-amber-500'}`} />
                                        {t('map.severity')}: {issue.aiClassification.severity}/10
                                        <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-1">
                                            <div className={`h-full rounded-full ${issue.aiClassification.severity >= 8 ? 'bg-red-500' : issue.aiClassification.severity >= 5 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${issue.aiClassification.severity * 10}%` }}></div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                                        <div className="text-xs font-semibold text-slate-500">
                                            <strong className="text-slate-800 text-sm">{issue.upvotes || 0}</strong> Verifications
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleVerify(issue.id)}
                                                disabled={verifyingId === issue.id}
                                                className="bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-200 text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                {verifyingId === issue.id ? t('map.verifying') : t('map.verify')}
                                            </button>
                                            <a
                                                href={`https://wa.me/?text=${encodeURIComponent(`🚨 Civic Issue: ${issue.aiClassification.issueType.replace('_', ' ')} — Severity ${issue.aiClassification.severity}/10\n📍 Bhubaneswar\n${issue.aiClassification.description}\n\nVerify on JanDarpan: ${window.location.origin}/issue/${issue.id}`)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 text-xs font-bold p-1.5 rounded-md transition-colors"
                                                title="Share on WhatsApp"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                    {/* View Full Details Link — using <a> because Leaflet Popup is outside React Router context */}
                                    <a
                                        href={`/issue/${issue.id}`}
                                        className="mt-2 flex items-center justify-center gap-1.5 w-full text-xs font-bold text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 border border-primary-100 py-1.5 rounded-lg transition-colors no-underline"
                                    >
                                        <ExternalLink className="w-3 h-3" /> View Full Details & Comments
                                    </a>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
};

export default LiveMap;
