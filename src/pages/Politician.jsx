import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, TrendingDown, TrendingUp, MapPin, Briefcase, FileWarning } from 'lucide-react';
import mockPoliticians from '../data/politicians.json';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];


const Politician = () => {
    const { slug } = useParams();
    const pol = mockPoliticians.find(p => p.slug === slug) || mockPoliticians[0];

    if (!pol) {
        return <div className="text-center p-12">Politician not found.</div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 pb-16">

            {/* Back nav */}
            <Link to="/rankings" className="inline-flex items-center text-sm font-bold text-slate-600 hover:text-primary-700 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transform">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Rankings
            </Link>

            {/* Profile Header */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden relative">
                <div className="h-40 bg-gradient-to-r from-slate-900 via-slate-800 to-primary-900 absolute top-0 w-full z-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                </div>

                <div className="relative z-10 pt-20 px-8 pb-8 flex flex-col md:flex-row items-center md:items-end gap-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary-500 blur-xl opacity-20 rounded-full"></div>
                        <img
                            src={pol.image}
                            alt={pol.name}
                            className="w-40 h-40 rounded-3xl border-4 border-white shadow-xl bg-slate-100 object-cover relative z-10"
                        />
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{pol.name}</h1>
                        <p className="text-slate-500 text-lg flex items-center justify-center md:justify-start gap-2 font-medium">
                            <MapPin className="w-5 h-5 text-slate-400" /> {pol.constituency}, {pol.state}
                        </p>
                        <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
                            <span className="px-4 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-sm shadow-sm tracking-wide">
                                Party: {pol.party}
                            </span>
                            <span className="px-4 py-1.5 rounded-lg bg-primary-50 border border-primary-200 text-primary-700 font-bold text-sm flex items-center gap-2 shadow-sm tracking-wide">
                                <Briefcase className="w-4 h-4" /> MP (Lok Sabha)
                            </span>
                        </div>
                    </div>

                    <div className="text-center bg-white px-8 py-5 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/60 transition-transform hover:scale-105">
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mb-2">JanDarpan Score</p>
                        <div className={`text-5xl font-black tracking-tighter ${pol.recentScore > 60 ? 'text-green-600' : 'text-red-600'}`}>
                            <span className="bg-clip-text text-transparent bg-gradient-to-br from-current to-slate-800">{pol.recentScore}</span>
                            <span className="text-2xl text-slate-300">/100</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: Stats */}
                <div className="space-y-8">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 p-6">
                        <h3 className="font-extrabold text-slate-900 mb-6 flex items-center gap-2 text-xl tracking-tight">
                            Civic Performance
                        </h3>
                        <div className="space-y-8">
                            <div className="bg-red-50/50 p-5 rounded-2xl border border-red-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 blur-2xl rounded-full"></div>
                                <p className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1 relative z-10">Total Open Issues</p>
                                <div className="flex items-end gap-3 relative z-10">
                                    <span className="text-5xl font-black text-red-600 tracking-tighter">{pol.openIssues || 452}</span>
                                    <span className="text-xs font-bold text-red-500 bg-white px-2 py-1 rounded-md shadow-sm border border-red-100 flex items-center mb-1"><TrendingUp className="w-3 h-3 mr-1" /> +12</span>
                                </div>
                            </div>

                            <div className="bg-green-50/50 p-5 rounded-2xl border border-green-100/50 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-2xl rounded-full"></div>
                                <p className="text-xs font-bold uppercase tracking-wider text-green-500 mb-1 relative z-10">Avg Resolution</p>
                                <div className="flex items-end gap-3 relative z-10">
                                    <span className="text-5xl font-black text-green-600 tracking-tighter">{pol.avgResolution || 14.2}<span className="text-2xl text-green-400 drop-shadow-none">d</span></span>
                                    <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-md shadow-sm border border-green-200 flex items-center mb-1"><TrendingDown className="w-3 h-3 mr-1" /> Better</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] shadow-xl shadow-amber-900/5 border border-amber-200/60 p-6">
                        <h3 className="font-extrabold text-amber-900 mb-6 border-b border-amber-200/50 pb-4 flex items-center gap-2 text-xl tracking-tight">
                            <div className="bg-amber-100 p-1.5 rounded-lg">
                                <FileWarning className="w-5 h-5 text-amber-600" />
                            </div>
                            Official Records
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-600/70 mb-1">Declared Assets</p>
                                <p className="text-3xl font-black text-amber-900 tracking-tight">{pol.assets}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-amber-600/70 mb-1">Criminal Cases</p>
                                <p className="text-3xl font-black text-red-600 tracking-tight flex items-center gap-3">
                                    {pol.criminalCases}
                                    {pol.criminalCases > 0 && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-md border border-red-200 uppercase tracking-widest shadow-sm">Flagged by MyNeta</span>}
                                </p>
                            </div>
                        </div>
                        <p className="text-[10px] text-amber-700/60 mt-6 uppercase font-bold tracking-widest leading-relaxed">Data sourced from latest election affidavits via MyNeta.info.</p>
                    </div>
                </div>

                {/* Right Col: Timeline & Heatmap */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 p-8 min-h-[400px]">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <h3 className="font-extrabold text-slate-900 text-xl tracking-tight">Resolution Velocity</h3>
                            <select className="bg-slate-50 border border-slate-200 rounded-xl text-sm px-4 py-2 text-slate-700 outline-none font-bold shadow-sm focus:ring-2 focus:ring-primary-500/20">
                                <option>All Issues (6M)</option>
                                <option>Potholes</option>
                                <option>Garbage</option>
                            </select>
                        </div>

                        <div className="bg-white rounded-2xl p-2">
                            <Line
                                data={{
                                    labels: months,
                                    datasets: [
                                        {
                                            label: 'Issues Reported',
                                            data: [42, 58, 61, 75, 80, pol.openIssues ? Math.round(pol.openIssues / 6) : 55],
                                            borderColor: '#ef4444',
                                            backgroundColor: 'rgba(239,68,68,0.08)',
                                            fill: true,
                                            tension: 0.4,
                                            pointBackgroundColor: '#ef4444',
                                            pointRadius: 4,
                                        },
                                        {
                                            label: 'Issues Resolved',
                                            data: [30, 40, 35, 50, 42, pol.avgResolution ? Math.round(40 / pol.avgResolution * 10) : 38],
                                            borderColor: '#22c55e',
                                            backgroundColor: 'rgba(34,197,94,0.08)',
                                            fill: true,
                                            tension: 0.4,
                                            pointBackgroundColor: '#22c55e',
                                            pointRadius: 4,
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    plugins: {
                                        legend: { position: 'top', labels: { font: { weight: 'bold', family: 'Inter' }, padding: 16 } },
                                        tooltip: { mode: 'index', intersect: false }
                                    },
                                    scales: {
                                        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { family: 'Inter' } } },
                                        x: { grid: { display: false }, ticks: { font: { family: 'Inter', weight: 'bold' } } }
                                    }
                                }}
                            />
                        </div>

                        <div className="mt-10 border-t border-slate-100 pt-8">
                            <h3 className="font-extrabold text-slate-900 mb-6 text-xl tracking-tight">Critically Neglected Zones</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {['Ward 14 (320 days)', 'Sector 4 (110 days)', 'Main Market (94 days)'].map(area => (
                                    <div key={area} className="bg-red-50 text-red-800 p-4 rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between hover:bg-red-100 transition-colors">
                                        <AlertTriangle className="w-5 h-5 mb-3 text-red-500" />
                                        <span className="font-bold tracking-tight">{area}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Politician;
