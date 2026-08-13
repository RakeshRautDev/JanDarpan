import React, { useState, useEffect } from 'react';
import { Camera, MapPin, AlertTriangle, ShieldCheck, ArrowRight, Activity, Zap, Eye, BarChart3, Heart, Github } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import LiveMap from '../components/Map/LiveMap';
import { getSystemStatistics } from '../services/appwriteDB';

// Animated Counter for WOW Factor
const AnimatedCounter = ({ value, suffix = '' }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, Math.round);

    useEffect(() => {
        const animation = animate(count, value, {
            duration: 2,
            ease: "easeOut"
        });
        return animation.stop;
    }, [value, count]);

    return <motion.span>{rounded}</motion.span>;
};

const Home = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState({ totalIssues: 0, resolvedIssues: 0, aiVerificationRate: 98.5 });

    useEffect(() => {
        getSystemStatistics().then(setStats);
    }, []);

    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 pb-0">

            {/* Hero Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 px-8 py-16 md:py-24 shadow-2xl shadow-primary-900/20 group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-slate-900 to-slate-950 pointer-events-none"></div>
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-primary-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse-slow"></div>
                <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-[600px] h-[600px] bg-primary-400/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>

                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-md mb-2">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-sm font-semibold text-primary-100 tracking-wide uppercase">Live Across India</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight drop-shadow-sm">
                        {t('home.heroTitle')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-100">{t('home.heroSubtitle')}</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-slate-300/90 max-w-2xl mx-auto font-medium leading-relaxed">
                        {t('home.heroDesc')}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
                        <Link to="/report" className="w-full sm:w-auto bg-white text-slate-900 font-bold py-4 px-8 rounded-full shadow-xl shadow-white/10 hover:shadow-white/20 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 text-lg group/btn">
                            <Camera className="w-6 h-6 text-primary-600 group-hover/btn:scale-110 transition-transform" />
                            {t('home.reportBtn')}
                        </Link>
                        <Link to="/rankings" className="w-full sm:w-auto bg-slate-800/50 backdrop-blur-md border border-slate-700 text-white font-bold py-4 px-8 rounded-full hover:bg-slate-800 hover:border-slate-600 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 text-lg group/btn2">
                            {t('home.viewRankings')} <ArrowRight className="w-5 h-5 text-primary-400 group-hover/btn2:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Quick Stats Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-20 -mt-20 px-4 md:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-white/80 hover:-translate-y-1 transition-transform duration-300 group">
                    <div className="flex items-start gap-5">
                        <div className="bg-red-50 p-4 rounded-2xl text-red-600 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                            <AlertTriangle className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('home.activeIssues')}</p>
                            <h3 className="text-4xl font-black text-slate-800 mt-1 tracking-tight">
                                <AnimatedCounter value={stats.totalIssues} />
                            </h3>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-white/80 hover:-translate-y-1 transition-transform duration-300 group">
                    <div className="flex items-start gap-5">
                        <div className="bg-green-50 p-4 rounded-2xl text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('home.resolvedValidated')}</p>
                            <h3 className="text-4xl font-black text-slate-800 mt-1 tracking-tight">
                                <AnimatedCounter value={stats.resolvedIssues} />
                            </h3>
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl shadow-slate-200/50 border border-white/80 hover:-translate-y-1 transition-transform duration-300 group">
                    <div className="flex items-start gap-5">
                        <div className="bg-primary-50 p-4 rounded-2xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                            <Activity className="w-7 h-7" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('home.aiVerificationRate')}</p>
                            <h3 className="text-4xl font-black text-slate-800 mt-1 tracking-tight">
                                <AnimatedCounter value={stats.aiVerificationRate} /><span className="text-2xl text-slate-400">%</span>
                            </h3>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* How It Works */}
            <section className="px-4 md:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">How JanDarpan Works</h2>
                    <p className="text-slate-500 font-medium mt-3 text-lg max-w-xl mx-auto">Three simple steps to power civic accountability in your neighbourhood.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { step: '01', icon: Camera, title: 'Snap & Report', desc: 'Take a photo of the issue. Our AI strips EXIF data for your privacy, analyzes severity, and classifies the problem — pothole, garbage, waterlog, and more.', color: 'primary' },
                        { step: '02', icon: Eye, title: 'AI Verifies & Maps', desc: 'Gemini Flash-Lite (or Groq as fallback) verifies the image is genuine, scores its severity 1-10, and geo-tags it to the right MP/MLA constituency.', color: 'amber' },
                        { step: '03', icon: BarChart3, title: 'Track & Hold Accountable', desc: 'Issues appear on the live map. Community members verify. Politicians are ranked by response time. SLA escalation auto-alerts negligent officials.', color: 'green' },
                    ].map(item => (
                        <div key={item.step} className="relative bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-200/60 group hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute -top-4 -left-2 text-7xl font-black text-slate-100 select-none pointer-events-none">{item.step}</div>
                            <div className={`relative z-10 bg-${item.color}-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-${item.color}-100 group-hover:scale-110 transition-transform`}>
                                <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3 relative z-10">{item.title}</h3>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed relative z-10">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Map Section */}
            <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-50 to-white">
                    <div>
                        <h2 className="font-extrabold text-2xl text-slate-900 flex items-center gap-3">
                            <MapPin className="w-6 h-6 text-primary-600 bg-primary-100 p-1 rounded-md" />
                            {t('home.liveRadar')}
                        </h2>
                        <p className="text-slate-500 mt-1 font-medium">{t('home.liveRadarDesc')}</p>
                    </div>
                </div>
                <div className="p-3 bg-slate-100/50">
                    <div className="rounded-2xl overflow-hidden shadow-inner border border-slate-200/80 isolate">
                        <LiveMap center={[20.2961, 85.8245]} zoom={13} />
                    </div>
                </div>
            </section>

            {/* Tech Stack Badges */}
            <section className="px-4 md:px-8">
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary-900 rounded-[2rem] p-8 md:p-12 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
                    <h3 className="text-2xl font-black text-white mb-3 relative z-10">Built With Cutting-Edge AI</h3>
                    <p className="text-slate-400 font-medium max-w-lg mx-auto mb-8 relative z-10">JanDarpan combines real-time geolocation, AI classification, and immutable audit logging for a transparent India.</p>
                    <div className="flex flex-wrap justify-center gap-3 relative z-10">
                        {['Appwrite', 'Gemini AI', 'Groq Llama', 'Leaflet.js', 'Turf.js', 'Chart.js', 'Vite + React'].map(tech => (
                            <span key={tech} className="bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 hover:bg-white/20 hover:scale-105 transition-all cursor-default">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 rounded-t-[2rem] mt-0">
                <div className="max-w-7xl mx-auto px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-3">JanDarpan</h4>
                            <p className="text-slate-500 font-medium text-sm leading-relaxed max-w-md">
                                An open-source civic accountability platform that uses AI and geospatial intelligence to bridge the gap between citizens and elected representatives.
                            </p>
                            <div className="flex items-center gap-4 mt-5">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Made in India 🇮🇳</span>
                            </div>
                        </div>

                        {/* Links */}
                        <div>
                            <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Platform</h5>
                            <div className="space-y-2.5">
                                <Link to="/" className="block text-slate-500 hover:text-primary-600 font-medium text-sm transition-colors">Live Map</Link>
                                <Link to="/report" className="block text-slate-500 hover:text-primary-600 font-medium text-sm transition-colors">Report Issue</Link>
                                <Link to="/rankings" className="block text-slate-500 hover:text-primary-600 font-medium text-sm transition-colors">Rankings</Link>
                                <Link to="/login" className="block text-slate-500 hover:text-primary-600 font-medium text-sm transition-colors">Official Portal</Link>
                            </div>
                        </div>

                        {/* Data Sources */}
                        <div>
                            <h5 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4">Data Sources</h5>
                            <div className="space-y-2.5">
                                <p className="text-slate-500 font-medium text-sm">ECI GeoJSON Boundaries</p>
                                <p className="text-slate-500 font-medium text-sm">MyNeta.info Affidavits</p>
                                <p className="text-slate-500 font-medium text-sm">OpenStreetMap</p>
                                <p className="text-slate-500 font-medium text-sm">Gemini Flash-Lite API</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-slate-400 text-xs font-medium">© {new Date().getFullYear()} JanDarpan — Mirror of the People. All rights reserved.</p>
                        <div className="flex items-center gap-2">
                            <Heart className="w-3.5 h-3.5 text-red-400" />
                            <p className="text-slate-400 text-xs font-medium">Built for a transparent India</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
