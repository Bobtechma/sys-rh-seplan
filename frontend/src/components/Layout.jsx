import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageTransition from './PageTransition';

import { useTheme } from '../context/ThemeContext';

const Layout = () => {
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    const isActive = (path) => {
        return location.pathname === path
            ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
            : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300';
    };

    const toggleDesktopSidebar = () => {
        setIsDesktopCollapsed(!isDesktopCollapsed);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="flex h-screen w-full relative overflow-hidden bg-background-light dark:bg-background-dark font-body antialiased">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <div
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md transition-opacity duration-300 lg:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-50
                    flex flex-col border-r border-border-light dark:border-border-dark 
                    bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl h-full shrink-0
                    transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0 lg:shadow-none'}
                    ${isDesktopCollapsed ? 'lg:w-[80px]' : 'lg:w-72'}
                    w-72
                `}>

                {/* Logo Section */}
                <div className={`h-24 flex items-center ${isDesktopCollapsed ? 'justify-center px-0' : 'justify-between px-8'} shrink-0 transition-all duration-300`}>
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="bg-center bg-no-repeat bg-contain rounded-2xl size-12 shrink-0 shadow-premium p-2 bg-white dark:bg-slate-800"
                            style={{ backgroundImage: 'url("/logo.png")' }}>
                        </div>
                        <div className={`flex flex-col transition-all duration-300 ${isDesktopCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                            <h1 className="text-slate-900 dark:text-white text-base font-bold tracking-tight leading-tight whitespace-nowrap font-display">Sys RH</h1>
                            <p className="text-primary font-bold text-[10px] tracking-widest uppercase">SEPLAN</p>
                        </div>
                    </div>
                    {/* Close button for Mobile only */}
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto no-scrollbar">
                    <NavItem to="/dashboard" icon="grid_view" label="Painel Principal" isActive={isActive('/dashboard')} collapsed={isDesktopCollapsed} onClick={() => setIsMobileMenuOpen(false)} />
                    <NavItem to="/servidores" icon="group" label="Servidores" isActive={isActive('/servidores')} collapsed={isDesktopCollapsed} onClick={() => setIsMobileMenuOpen(false)} />
                    <NavItem to="/ferias" icon="beach_access" label="Férias" isActive={isActive('/ferias')} collapsed={isDesktopCollapsed} onClick={() => setIsMobileMenuOpen(false)} />
                    <NavItem to="/calendario" icon="calendar_today" label="Calendário" isActive={isActive('/calendario')} collapsed={isDesktopCollapsed} onClick={() => setIsMobileMenuOpen(false)} />
                    <NavItem to="/afastamentos" icon="medical_information" label="Afastamentos" isActive={isActive('/afastamentos')} collapsed={isDesktopCollapsed} onClick={() => setIsMobileMenuOpen(false)} />
                    <NavItem to="/relatorios" icon="analytics" label="Relatórios" isActive={isActive('/relatorios')} collapsed={isDesktopCollapsed} onClick={() => setIsMobileMenuOpen(false)} />
                </div>

                {/* Bottom Section */}
                <div className="p-4 mt-auto border-t border-border-light dark:border-border-dark space-y-2">
                    <NavItem to="/configuracoes" icon="settings" label="Configurações" isActive={isActive('/configuracoes')} collapsed={isDesktopCollapsed} onClick={() => setIsMobileMenuOpen(false)} />
                    <NavItem to="/ajuda" icon="help_outline" label="Ajuda" isActive={isActive('/ajuda')} collapsed={isDesktopCollapsed} onClick={() => setIsMobileMenuOpen(false)} />

                    {/* User Info */}
                    <div className={`
                        flex items-center ${isDesktopCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} 
                        py-3 mt-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50
                        transition-all duration-300
                    `}>
                        <div className="size-9 shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white font-bold text-sm">
                            {(localStorage.getItem('userName') || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isDesktopCollapsed ? 'w-0 opacity-0 hidden' : 'w-full opacity-100'}`}>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate" title={localStorage.getItem('userName') || 'Usuário'}>
                                {localStorage.getItem('userName') || 'Usuário'}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-[9px] font-bold text-slate-500/80 dark:text-slate-400 uppercase tracking-tighter">Online</span>
                            </div>
                        </div>
                    </div>

                    {/* Logout Item */}
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center ${isDesktopCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} 
                            py-3 rounded-xl hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-slate-600 dark:text-slate-400 transition-all cursor-pointer group relative
                        `}
                        title={isDesktopCollapsed ? "Sair" : ""}
                    >
                        <span className="material-symbols-outlined shrink-0 text-[20px]">logout</span>
                        {!isDesktopCollapsed && <p className="text-sm font-semibold tracking-tight">Sair da Conta</p>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-background-light dark:bg-background-dark transition-all duration-300">
                {/* Top Nav */}
                <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shrink-0 z-30 sticky top-0 transition-all">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700">
                            <span className="material-symbols-outlined">menu</span>
                        </button>

                        {/* Desktop Collapse Button */}
                        <button
                            onClick={toggleDesktopSidebar}
                            className="hidden lg:flex items-center justify-center text-slate-400 hover:text-primary p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            title={isDesktopCollapsed ? "Expandir menu" : "Recolher menu"}
                        >
                            <span className="material-symbols-outlined text-[20px] transform transition-transform duration-300">
                                {isDesktopCollapsed ? 'format_indent_increase' : 'format_indent_decrease'}
                            </span>
                        </button>

                        {/* Page Title / Breadcrumbs (Placeholder) */}
                        <div className="hidden sm:flex flex-col">
                            {/* Dynamic title logic can go here later */}
                        </div>
                    </div>

                    {/* Search Bar - Hidden on very small screens, expanded on md */}
                    {/* Search Bar */}
                    <div className="flex-1 max-w-lg mx-4 hidden md:block relative z-50">
                        <GlobalSearch />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title={theme === 'dark' ? "Mudar para modo claro" : "Mudar para modo escuro"}
                        >
                            <span className="material-symbols-outlined">
                                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                            </span>
                        </button>

                        <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
                        </button>

                        <div className="h-8 w-px bg-border-light dark:bg-border-dark mx-1 hidden sm:block"></div>

                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                {new Date().getFullYear()}
                            </span>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 scroll-smooth bg-background-light dark:bg-background-dark relative">
                    <div className={`mx-auto w-full ${['/servidores', '/ferias', '/afastamentos', '/relatorios'].includes(location.pathname) ? 'max-w-full' : 'max-w-7xl'}`}>
                        <AnimatePresence mode="wait">
                            <PageTransition key={location.pathname}>
                                <Outlet />
                            </PageTransition>
                        </AnimatePresence>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Helper Component for Sidebar Items
const NavItem = ({ to, icon, label, isActive, collapsed, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`
            flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} 
            py-2.5 rounded-lg transition-all duration-200 cursor-pointer group relative overflow-hidden
            ${isActive}
        `}
        title={collapsed ? label : ''}
    >
        <span className={`material-symbols-outlined shrink-0 transition-colors duration-200 ${isActive.includes('bg-primary') ? 'text-primary' : 'text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white'}`}>
            {icon}
        </span>

        <div className={`transition-all duration-300 origin-left whitespace-nowrap overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
            <p className="text-sm font-medium">{label}</p>
        </div>

        {/* Active Indicator Strip */}
        {isActive.includes('bg-primary') && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-primary rounded-r-full" />
        )}
    </Link>
);

export default Layout;


const GlobalSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ routes: [], servers: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    // App Routes for Local Search
    const appRoutes = [
        { name: 'Painel Principal', path: '/dashboard', icon: 'dashboard' },
        { name: 'Servidores', path: '/servidores', icon: 'groups' },
        { name: 'Adicionar Servidor', path: '/adicionar-servidor', icon: 'person_add' },
        { name: 'Férias', path: '/ferias', icon: 'beach_access' },
        // { name: 'Afastamentos', path: '/afastamentos', icon: 'medical_services' }, // Removed temporarily if not fully implemented in some versions
        { name: 'Relatórios', path: '/relatorios', icon: 'description' },
        { name: 'Configurações', path: '/configuracoes', icon: 'settings' },
        { name: 'Calendário', path: '/calendario', icon: 'calendar_month' },
        { name: 'Ajuda', path: '/ajuda', icon: 'help' }
    ];

    // Searchable Resources (Menu + Specific Reports)
    const searchableResources = [
        ...appRoutes,
        { name: 'Relatório de Servidores', path: '/relatorios?report=servidores', icon: 'groups' },
        { name: 'Relatório de Férias', path: '/relatorios?report=ferias', icon: 'beach_access' },
        { name: 'Relatório de Aniversariantes', path: '/relatorios?report=aniversariantes', icon: 'cake' },
        { name: 'Relatório de Frequência', path: '/relatorios?report=frequencia', icon: 'event_note' },
        { name: 'Relatório de Afastamentos', path: '/relatorios?report=afastamentos', icon: 'medical_services' },
        { name: 'Dossiê do Servidor', path: '/relatorios?report=dossie', icon: 'folder_shared' },
        { name: 'Novo Servidor', path: '/adicionar-servidor', icon: 'person_add' }
    ];

    // Debounce Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length < 2) {
                setResults({ routes: [], servers: [] });
                return;
            }

            setIsLoading(true);

            // 1. Local Resource Search
            const matchedRoutes = searchableResources.filter(r =>
                r.name.toLowerCase().includes(query.toLowerCase())
            );

            // 2. Server API Search
            let matchedServers = [];
            try {
                const token = localStorage.getItem('token');
                // Use existing search endpoint
                const res = await axios.get('/api/servidores', {
                    params: { search: query, limit: 5 },
                    headers: { 'x-auth-token': token }
                });
                matchedServers = res.data.servidores || [];
            } catch (err) {
                console.error("Search failed", err);
            }

            setResults({ routes: matchedRoutes, servers: matchedServers });
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const handleNavigate = (path) => {
        navigate(path);
        setShowResults(false);
        setQuery('');
    };

    return (
        <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
                className="block w-full pl-10 pr-3 py-2 border-none rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800/80 transition-all text-sm"
                placeholder="Buscar funcionalidades ou servidores..."
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)} // Delay to allow click
            />

            {/* Results Dropdown */}
            {showResults && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-dark rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 max-h-[80vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Buscando...</div>
                    ) : (results.routes.length === 0 && results.servers.length === 0) ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Nenhum resultado encontrado.</div>
                    ) : (
                        <>
                            {/* Routes Section */}
                            {results.routes.length > 0 && (
                                <div className="py-2">
                                    <h3 className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Funcionalidades</h3>
                                    {results.routes.map((route, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleNavigate(route.path)}
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-slate-400 text-[18px]">{route.icon}</span>
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{route.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {(results.routes.length > 0 && results.servers.length > 0) && <div className="border-t border-slate-100 dark:border-slate-700 my-1"></div>}

                            {/* Servers Section */}
                            {results.servers.length > 0 && (
                                <div className="py-2">
                                    <h3 className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Servidores</h3>
                                    {results.servers.map((server) => (
                                        <button
                                            key={server._id || server.IDPK_SERV}
                                            onClick={() => handleNavigate(`/adicionar-servidor/${server.IDPK_SERV || server._id}`)} // Or open modal if architected that way
                                            className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-3 transition-colors"
                                        >
                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-primary text-[16px]">person</span>
                                            </div>
                                            <div className="flex flex-col overflow-hidden">
                                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{server.NOME_SERV}</span>
                                                <span className="text-xs text-slate-500 truncate">{server.CARGO_EFETIVO_SERV || server.CARGO_COMISSIONADO_SERV || 'Cargo não informado'}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};
