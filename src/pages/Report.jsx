import React, { useState } from 'react';
import { Camera as CameraIcon, MapPin, UploadCloud, AlertCircle, Loader2, Info, ArrowRight } from 'lucide-react';
import CameraCapture from '../components/Report/CameraCapture';
import LocationCapture from '../components/Report/LocationCapture';
import { analyzeCivicIssue } from '../services/gemini';
import { uploadEvidencePhoto, createIssueReport } from '../services/appwriteDB';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
const Report = () => {
    const navigate = useNavigate();
    const [photo, setPhoto] = useState(null);
    const [userDescription, setUserDescription] = useState("");
    const [location, setLocation] = useState(null);
    const [aiData, setAiData] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [overrideType, setOverrideType] = useState(null); // if user wants to change AI-detected type
    const [customType, setCustomType] = useState('');

    const COMMON_TYPES = [
        { key: 'pothole', label: '🕳️ Pothole', color: 'border-red-200 bg-red-50 text-red-700' },
        { key: 'garbage', label: '🗑️ Garbage', color: 'border-amber-200 bg-amber-50 text-amber-700' },
        { key: 'waterlog', label: '🌊 Waterlogging', color: 'border-blue-200 bg-blue-50 text-blue-700' },
        { key: 'street_light', label: '💡 Street Light', color: 'border-purple-200 bg-purple-50 text-purple-700' },
        { key: 'open_drain', label: '🚧 Open Drain', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
        { key: 'road_damage', label: '🛣️ Road Damage', color: 'border-orange-200 bg-orange-50 text-orange-700' },
        { key: 'debris', label: '🧱 Debris', color: 'border-stone-200 bg-stone-50 text-stone-700' },
        { key: 'accident_spot', label: '⚠️ Accident Spot', color: 'border-red-200 bg-red-50 text-red-700' },
        { key: 'sewage', label: '💧 Sewage Overflow', color: 'border-cyan-200 bg-cyan-50 text-cyan-700' },
        { key: 'encroachment', label: '🏗️ Encroachment', color: 'border-yellow-200 bg-yellow-50 text-yellow-700' },
        { key: 'other', label: '➕ Other', color: 'border-slate-300 bg-slate-50 text-slate-700' },
    ];

    const isValid = photo && location && aiData && aiData.isRealIssue && !publishing;

    const handlePhotoCapture = async (dataUrl) => {
        setPhoto(dataUrl);
        setAnalyzing(true);
        setAiData(null);
        try {
            const result = await analyzeCivicIssue(dataUrl, 'image/jpeg', userDescription);
            setAiData(result);
        } catch (err) {
            console.error("Analysis failed", err);
            setAiData({ isRealIssue: false, description: "Analysis failed. Please try again." });
        } finally {
            setAnalyzing(false);
        }
    };

    const { currentUser } = useAuth();

    const handlePublish = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        
        setPublishing(true);
        try {
            const photoUrl = await uploadEvidencePhoto(photo);
            const createdDocId = await createIssueReport({
                photoUrl,
                location,
                userDescription,
                citizenId: currentUser.$id,
                aiAnalysis: {
                    ...aiData,
                    issueType: overrideType === 'other' ? (customType.trim() || aiData.issueType) : (overrideType || aiData.issueType)
                }
            });
            console.log("Successfully published issue ID:", createdDocId);
            navigate('/');
        } catch (err) {
            console.error("Publish failed:", err);
            alert("Failed to submit issue. Please try again later.");
        } finally {
            setPublishing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 pb-16">

            {/* Header */}
            <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center p-3 bg-primary-50 rounded-2xl mb-2">
                    <CameraIcon className="w-8 h-8 text-primary-600" />
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Report an Issue</h1>
                <p className="text-lg text-slate-500 font-medium max-w-lg mx-auto">
                    Take a photo of the problem. Our AI will analyze the severity and we'll automatically capture your verified location.
                </p>
            </div>

            {/* Smart Wizard Engine */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden isolate relative">

                {/* Step 1: Photo & AI */}
                <div className="p-8 md:p-10 border-b border-slate-100 relative group">
                    <div className="absolute top-10 left-8 md:left-10 w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shadow-sm">1</div>
                    <div className="pl-16">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Capture Evidence Data</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Issue Description (Optional but helps AI verification)</label>
                            <textarea
                                value={userDescription}
                                onChange={(e) => setUserDescription(e.target.value)}
                                disabled={analyzing || publishing}
                                placeholder="Describe the problem, e.g., 'Deep pothole causing accidents near the crossing...'"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none h-24 disabled:opacity-50"
                            />
                        </div>

                        <CameraCapture onCapture={handlePhotoCapture} />

                        {/* Interactive AI Analysis Feedback */}
                        {analyzing && (
                            <div className="mt-6 bg-gradient-to-r from-slate-50 to-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 text-slate-700 shadow-sm animate-pulse-slow">
                                <div className="bg-white p-2 rounded-full shadow-sm">
                                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Gemini AI Active</h4>
                                    <span className="text-sm font-medium text-slate-500">Analyzing image structure and civic classification...</span>
                                </div>
                            </div>
                        )}

                        {aiData && !analyzing && (
                            <div className={`mt-6 p-5 rounded-2xl border flex items-start gap-4 shadow-sm transition-all animate-in zoom-in-95 duration-300 ${aiData.isRealIssue ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                                <div className={`p-2.5 rounded-xl flex-shrink-0 ${aiData.isRealIssue ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {aiData.isRealIssue ? <Info className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-base ${aiData.isRealIssue ? 'text-green-900' : 'text-red-900'}`}>
                                        {aiData.isRealIssue ? `AI Classification: ${aiData.issueType.replace('_', ' ').toUpperCase()}` : 'Warning: Unverifiable Content'}
                                    </h4>
                                    <p className={`text-sm mt-1 mb-3 font-medium ${aiData.isRealIssue ? 'text-green-800/80' : 'text-red-800/80'}`}>{aiData.description}</p>

                                    {aiData.isRealIssue && (
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full ${aiData.severity >= 8 ? 'bg-red-500' : aiData.severity >= 5 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${(aiData.severity / 10) * 100}%` }}></div>
                                            </div>
                                            <span className="text-xs font-bold whitespace-nowrap bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100 text-slate-700">
                                                Severity: {aiData.severity}/10
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Dynamic Issue Type Selector — appears after AI classification */}
                        {aiData && aiData.isRealIssue && !analyzing && (
                            <div className="mt-6 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
                                <h4 className="text-sm font-bold text-slate-700 mb-1">Issue Category</h4>
                                <p className="text-xs text-slate-500 font-medium mb-3">AI detected: <strong className="text-slate-700 capitalize">{aiData.issueType?.replace('_', ' ')}</strong>. You can keep it or select the correct one.</p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {COMMON_TYPES.map(t => {
                                        const selected = overrideType === t.key || (!overrideType && aiData.issueType === t.key);
                                        return (
                                            <button
                                                key={t.key}
                                                type="button"
                                                onClick={() => { setOverrideType(t.key); if (t.key !== 'other') setCustomType(''); }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selected ? 'ring-2 ring-primary-400 ring-offset-1 ' + t.color : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {t.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {overrideType === 'other' && (
                                    <input
                                        type="text"
                                        value={customType}
                                        onChange={e => setCustomType(e.target.value)}
                                        placeholder="Describe the issue type, e.g. 'fallen tree', 'broken wall'..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary-400 transition-all mt-1"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Location */}
                <div className="p-8 md:p-10 border-b border-slate-100 relative bg-slate-50/50">
                    <div className="absolute top-10 left-8 md:left-10 w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg shadow-sm">2</div>
                    <div className="pl-16">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Verify Geospatial Location</h2>
                        {!location && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 mb-4">
                                <div className="bg-slate-100 p-2.5 rounded-xl text-slate-400 mt-0.5">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-700">Awaiting location lock...</h4>
                                    <p className="text-sm text-slate-500 font-medium">Location will be captured automatically to ensure municipal mapping accuracy.</p>
                                </div>
                            </div>
                        )}
                        <LocationCapture onLocationFound={(data) => setLocation(data)} />
                    </div>
                </div>

                {/* Submit Block */}
                <div className="p-8 md:p-10 bg-slate-50/80">
                    <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-5 mb-8 flex gap-4 text-blue-900 shadow-sm">
                        <div className="bg-blue-100 p-2 rounded-lg h-fit">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <div className="text-sm">
                            <span className="font-bold block mb-1 text-base">Anonymity & Privacy Verified</span>
                            <span className="font-medium text-blue-800/80">All EXIF metadata (camera model, original time) is stripped on upload. Your identity is kept entirely anonymous unless you actively choose to verify it with an OTP.</span>
                        </div>
                    </div>

                    <button
                        disabled={(!currentUser ? false : !isValid) || publishing}
                        onClick={handlePublish}
                        className={`w-full py-5 px-6 font-bold rounded-2xl flex justify-center items-center gap-3 transition-all duration-300 text-lg ${(!currentUser || isValid)
                            ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-500 hover:to-primary-600 shadow-xl shadow-primary-600/30 hover:-translate-y-1'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/50'
                            }`}
                    >
                        {publishing ? (
                            <>
                                <Loader2 className="w-6 h-6 animate-spin" />
                                Uploading Evidence to Cloud...
                            </>
                        ) : !currentUser ? (
                            <>
                                <UploadCloud className="w-6 h-6" />
                                Sign In to Publish
                                {isValid && <ArrowRight className="w-5 h-5 ml-2 animate-pulse" />}
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-6 h-6" />
                                Publish Report Publicly
                                {isValid && <ArrowRight className="w-5 h-5 ml-2 animate-pulse" />}
                            </>
                        )}
                    </button>
                </div>

            </div>

        </div>
    );
};

export default Report;
