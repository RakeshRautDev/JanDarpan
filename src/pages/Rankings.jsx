import React, { useState } from 'react';
import { Trophy, MapPin, TrendingUp, AlertCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import mockPoliticians from '../data/politicians.json';

const Rankings = () => {
    // Sort logic
    const hallOfShame = [...mockPoliticians]
        .map(p => ({ ...p, openIssues: p.openIssues || Math.floor(Math.random() * 500 + 200), avgResolution: p.avgResolution || Math.floor(Math.random() * 20 + 3), image: `https://i.pravatar.cc/150?u=${p.id}` }))
        .sort((a, b) => b.openIssues - a.openIssues).slice(0, 3);
    const hallOfFame = [...mockPoliticians]
        .map(p => ({ ...p, openIssues: p.openIssues || Math.floor(Math.random() * 500 + 200), avgResolution: p.avgResolution || Math.floor(Math.random() * 20 + 3), image: `https://i.pravatar.cc/150?u=${p.id}` }))
        .sort((a, b) => a.avgResolution - b.avgResolution).slice(0, 3);

    const renderCard = (pol, index, variant) => {
        const isShame = variant === 'shame';
        return (
            <div key={pol.id} className="p-4 mx-2 my-2 rounded-2xl flex items-center gap-5 hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100 hover:shadow-sm">
                <div className="font-black text-4xl text-slate-200/80 w-10 text-center tracking-tighter">{index + 1}</div>
                <div className="relative">
                    <img src={pol.image} alt={pol.name} className="w-16 h-16 rounded-2xl border border-slate-200 shadow-sm object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute -bottom-2 -right-2 bg-white text-[10px] font-black uppercase text-slate-500 px-2 py-0.5 rounded-md border border-slate-100 shadow-sm">{pol.party}</div>
                </div>
                <div className="flex-1">
                    <Link to={`/politician/${pol.slug}`} className="group/link flex items-center gap-1 w-fit">
                        <h3 className="font-bold text-slate-800 text-xl group-hover/link:text-primary-600 transition-colors cursor-pointer">{pol.name}</h3>
                        <ArrowUpRight className="w-4 h-4 text-slate-300 opacity-0 -translate-x-2 translate-y-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 group-hover/link:translate-y-0 transition-all text-primary-600" />
                    </Link>
                    <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {pol.constituency}, {pol.state}
                    </p>
                </div>
                <div className={`text-right px-5 py-3 rounded-xl border transition-colors ${isShame ? 'bg-red-50/50 border-red-100/50 group-hover:bg-red-50 group-hover:border-red-100' : 'bg-green-50/50 border-green-100/50 group-hover:bg-green-50 group-hover:border-green-100'}`}>
                    <p className={`font-black text-2xl tracking-tight ${isShame ? 'text-red-600' : 'text-green-600'}`}>
                        {isShame ? pol.openIssues : `${pol.avgResolution}d`}
                    </p>
                    <p className={`text-[10px] font-extrabold uppercase tracking-wider mt-0.5 ${isShame ? 'text-red-400' : 'text-green-500'}`}>
                        {isShame ? 'Open Issues' : 'Avg Resolution'}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-8 pb-16">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200/60 pb-8 gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center gap-4 tracking-tight drop-shadow-sm">
                        <div className="bg-yellow-400 p-2.5 rounded-2xl shadow-lg shadow-yellow-500/20">
                            <Trophy className="text-white w-8 h-8" />
                        </div>
                        National Board
                    </h1>
                    <p className="text-slate-500 mt-3 text-xl font-medium max-w-2xl">Daily transparency rankings holding MPs and MLAs accountable based on citizen-verified ground realities.</p>
                </div>

                <div className="bg-white px-5 py-3 border border-slate-200/80 rounded-xl shadow-sm self-start md:self-end flex items-center gap-4">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Live Database Sync</p>
                        <p className="font-mono text-sm text-slate-700 font-bold flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/20"></span>
                            Synchronized
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Boards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Hall of Shame */}
                <section className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-red-900/5 transition-shadow duration-500">
                    <div className="bg-gradient-to-br from-red-50 via-white to-white p-6 border-b border-red-100/60 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl rounded-full"></div>
                        <h2 className="font-black text-red-700 text-2xl flex items-center gap-3 relative z-10">
                            <div className="bg-red-100 p-2 rounded-xl text-red-600"><AlertCircle className="w-6 h-6" /></div>
                            Hall of Shame
                        </h2>
                        <span className="text-xs font-black text-red-600 bg-red-100/80 border border-red-200 px-3 py-1.5 rounded-lg uppercase tracking-wider relative z-10">Highest Neglect</span>
                    </div>
                    <div className="divide-y divide-slate-100 flex-1 px-2">
                        {hallOfShame.map((pol, i) => renderCard(pol, i, 'shame'))}
                    </div>
                    <div className="p-5 bg-slate-50 text-center border-t border-slate-100">
                        <button className="text-sm font-bold text-slate-600 hover:text-red-600 transition-colors flex items-center justify-center gap-2 w-full">View All Neglected Constituencies <ArrowUpRight className="w-4 h-4" /></button>
                    </div>
                </section>

                {/* Hall of Fame */}
                <section className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:shadow-green-900/5 transition-shadow duration-500">
                    <div className="bg-gradient-to-br from-green-50 via-white to-white p-6 border-b border-green-100/60 flex justify-between items-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 blur-3xl rounded-full"></div>
                        <h2 className="font-black text-green-700 text-2xl flex items-center gap-3 relative z-10">
                            <div className="bg-green-100 p-2 rounded-xl text-green-600"><TrendingUp className="w-6 h-6" /></div>
                            Hall of Fame
                        </h2>
                        <span className="text-xs font-black text-green-600 bg-green-100/80 border border-green-200 px-3 py-1.5 rounded-lg uppercase tracking-wider relative z-10">Fastest Action</span>
                    </div>
                    <div className="divide-y divide-slate-100 flex-1 px-2">
                        {hallOfFame.map((pol, i) => renderCard(pol, i, 'fame'))}
                    </div>
                    <div className="p-5 bg-slate-50 text-center border-t border-slate-100">
                        <button className="text-sm font-bold text-slate-600 hover:text-green-600 transition-colors flex items-center justify-center gap-2 w-full">View Top Performing Constituencies <ArrowUpRight className="w-4 h-4" /></button>
                    </div>
                </section>

            </div>

        </div>
    );
};

export default Rankings;
