import { Link, useLocation } from 'react-router-dom';
import { Camera, Map as MapIcon, Trophy, ShieldAlert, Menu, X, ChevronRight, Globe, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const [lang, setLang] = useState(i18n.language || 'en');

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'hi' : 'en';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
        setLang(newLang);
    };

    const { currentUser } = useAuth();

    // Check if they are officially an admin or a citizen
    const isOfficial = !!localStorage.getItem('official_role');
    const isCitizen = !!currentUser;
    const isLoggedIn = isOfficial || isCitizen;

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navItems = [
        { name: t('nav.liveMap'), path: '/', icon: MapIcon },
        { name: t('nav.reportIssue'), path: '/report', icon: Camera },
        { name: 'Community', path: '/community', icon: Eye },
        { name: t('nav.rankings'), path: '/rankings', icon: Trophy },
        {
            name: isOfficial ? 'Dashboard' : (isCitizen ? 'Profile' : t('nav.officialPortal')),
            path: isOfficial ? '/admin' : (isCitizen ? '/profile' : '/login'),
            icon: ShieldAlert
        }
    ];

    return (
        <nav className={clsx(
            "fixed top-0 w-full z-50 transition-all duration-300 border-b",
            scrolled
                ? "bg-white/70 backdrop-blur-xl border-slate-200 shadow-sm py-1"
                : "bg-white/95 backdrop-blur border-transparent py-3 shadow-sm"
        )}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center gap-2.5 group">
                            <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-2 rounded-xl text-white shadow-lg shadow-primary-500/20 group-hover:shadow-primary-600/40 transition-all duration-300 group-hover:scale-105">
                                <ShieldAlert className="h-6 w-6" />
                            </div>
                            <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
                                JANDARPAN
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={clsx(
                                        "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 relative overflow-hidden group",
                                        isActive
                                            ? "text-primary-700 bg-primary-50 shadow-sm"
                                            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                                    )}
                                >
                                    <Icon className={clsx("h-4 w-4 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                                    {item.name}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[3px] bg-primary-600 rounded-t-full"></span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Auth Badge + Language Switcher + CTA */}
                    <div className="hidden md:flex items-center gap-2">
                        {isOfficial && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold mr-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Official ✓
                            </span>
                        )}
                        {!isOfficial && isCitizen && (
                            <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors mr-2">
                                {currentUser.photoURL ? (
                                    <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                                        {currentUser.displayName ? currentUser.displayName.charAt(0) : 'C'}
                                    </div>
                                )}
                                <span className="text-xs font-bold text-slate-700">{currentUser.displayName || 'Citizen'}</span>
                            </Link>
                        )}
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all shadow-sm"
                        >
                            <Globe className="w-3.5 h-3.5" />
                            {lang === 'en' ? 'हिं' : 'EN'}
                        </button>
                        <Link to="/report" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-md shadow-slate-900/10 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95">
                            {t('nav.reportIssue')} <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-600 hover:text-slate-900 focus:outline-none p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            {isMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Nav */}
            <div className={clsx(
                "md:hidden transition-all duration-300 overflow-hidden bg-white/95 backdrop-blur-xl border-b border-slate-200 border-t",
                isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-transparent border-t-transparent"
            )}>
                <div className="px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={clsx(
                                    "block px-4 py-3 rounded-xl text-base font-semibold flex items-center gap-3 transition-colors",
                                    isActive
                                        ? "text-primary-700 bg-primary-50"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                                )}
                            >
                                <div className={clsx("p-2 rounded-lg", isActive ? "bg-primary-100 text-primary-700" : "bg-slate-100 text-slate-500")}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                {item.name}
                            </Link>
                        );
                    })}
                    {/* Mobile language toggle */}
                    <button
                        onClick={() => { toggleLanguage(); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        <div className="p-2 rounded-lg bg-slate-100 text-slate-500"><Globe className="h-5 w-5" /></div>
                        {lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
