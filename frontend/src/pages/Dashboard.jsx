import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Skeleton } from '../components/Skeleton';
import LottieLoader from '../components/LottieLoader';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { formatDateUTC } from '../utils/formatDate';
import { useStaggerReveal, useCountUp } from '../hooks/useAnimations';

ChartJS.register(ArcElement, Tooltip, Legend);

import { useDashboard } from '../hooks/useDashboard';

const Dashboard = () => {
    const navigate = useNavigate();
    const {
        stats,
        loading,
        totalVinculos,
        isHistoryModalOpen,
        setIsHistoryModalOpen,
        historyData,
        historyPage,
        historyTotalPages,
        historyLoading,
        handlePageChange,
        refresh: fetchDashboardStats
    } = useDashboard();

    // Anime.js stagger reveals
    const statsRef = useStaggerReveal('.stat-card', [loading], { staggerDelay: 80 });
    const actionsRef = useStaggerReveal('.action-card', [loading], { staggerDelay: 60, startDelay: 300 });
    const tableRef = useStaggerReveal('.activity-row', [loading, stats?.recentActivity], { staggerDelay: 50, startDelay: 200 });

    // Animated counters
    const countActive = useCountUp(stats?.activeServidores || 0, loading);
    const countBirthday = useCountUp(stats?.aniversariantesCount || 0, loading);
    const countPendencias = useCountUp(stats?.pendencias || 0, loading);
    const countFerias = useCountUp(stats?.ferias || 0, loading);

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {/* Page Heading */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                        Visão Geral</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Bem-vindo ao sistema de gestão, aqui está
                        o resumo de hoje.</p>
                </div>

            </div>

            {/* Stats Cards */}
            <div ref={statsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="stat-card glass dark:glass-dark p-6 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
                    <div className="flex justify-between items-start mb-5">
                        <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wider">
                            +1.2%
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Servidores Ativos</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-display">
                        {loading ? <Skeleton className="h-10 w-20" /> : <span ref={countActive}>0</span>}
                    </h3>
                </div>

                <div
                    onClick={() => {
                        const currentMonth = new Date().getMonth() + 1;
                        navigate(`/servidores?birthMonth=${currentMonth}`);
                    }}
                    className="stat-card glass dark:glass-dark p-6 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-5">
                        <div className="p-3 bg-purple-500/10 text-purple-600 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                            <span className="material-symbols-outlined">cake</span>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Aniversariantes</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-display">
                        {loading ? <Skeleton className="h-10 w-16" /> : <span ref={countBirthday}>0</span>}
                    </h3>
                </div>

                <div className="stat-card glass dark:glass-dark p-6 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
                    <div className="flex justify-between items-start mb-5">
                        <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                            <span className="material-symbols-outlined">notification_important</span>
                        </div>
                        <span className="flex items-center text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400 px-3 py-1 rounded-full uppercase tracking-wider">
                            Pendente
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Pendências RH</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-display">
                        {loading ? <Skeleton className="h-10 w-16" /> : <span ref={countPendencias}>0</span>}
                    </h3>
                </div>

                <div className="stat-card glass dark:glass-dark p-6 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 group">
                    <div className="flex justify-between items-start mb-5">
                        <div className="p-3 bg-teal-500/10 text-teal-600 rounded-2xl group-hover:bg-teal-500 group-hover:text-white transition-all duration-500">
                            <span className="material-symbols-outlined">beach_access</span>
                        </div>
                        <span className="flex items-center text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
                            Atual
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest">Em Férias</p>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-2 font-display">
                        {loading ? <Skeleton className="h-10 w-16" /> : <span ref={countFerias}>0</span>}
                    </h3>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-5">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">Acesso Rápido</h3>
                <div ref={actionsRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
                    <Link to="/adicionar-servidor" className="action-card flex flex-col items-center justify-center gap-4 p-6 rounded-3xl glass dark:glass-dark hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-500 group h-36 hover:-translate-y-2 hover:shadow-xl active:scale-95 border-transparent">
                        <div className="bg-primary/10 text-primary p-3.5 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                            <span className="material-symbols-outlined text-[28px]">person_add</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center uppercase tracking-tight">Novo Servidor</span>
                    </Link>

                    <Link to="/ferias" className="action-card flex flex-col items-center justify-center gap-4 p-6 rounded-3xl glass dark:glass-dark hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-500 group h-36 hover:-translate-y-2 hover:shadow-xl active:scale-95 border-transparent">
                        <div className="bg-teal-500/10 text-teal-600 p-3.5 rounded-2xl group-hover:bg-teal-500 group-hover:text-white transition-all duration-500 shadow-sm">
                            <span className="material-symbols-outlined text-[28px]">beach_access</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center uppercase tracking-tight">Gestão Férias</span>
                    </Link>

                    <Link to="/relatorios" className="action-card flex flex-col items-center justify-center gap-4 p-6 rounded-3xl glass dark:glass-dark hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-500 group h-36 hover:-translate-y-2 hover:shadow-xl active:scale-95 border-transparent">
                        <div className="bg-indigo-500/10 text-indigo-600 p-3.5 rounded-2xl group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-sm">
                            <span className="material-symbols-outlined text-[28px]">description</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center uppercase tracking-tight">Gerar Relatórios</span>
                    </Link>

                    <Link to="/calendario" className="action-card flex flex-col items-center justify-center gap-4 p-6 rounded-3xl glass dark:glass-dark hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-500 group h-36 hover:-translate-y-2 hover:shadow-xl active:scale-95 border-transparent">
                        <div className="bg-amber-500/10 text-amber-600 p-3.5 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all duration-500 shadow-sm">
                            <span className="material-symbols-outlined text-[28px]">event_repeat</span>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 text-center uppercase tracking-tight">Escalas/Folgas</span>
                    </Link>
                </div>
            </div>

            {/* Main Section: Recent Activity & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Últimas Movimentações (Top 5)</h3>
                        <button
                            onClick={() => setIsHistoryModalOpen(true)}
                            className="text-sm font-medium text-primary hover:text-blue-600 transition"
                        >
                            Ver mais
                        </button>
                    </div>
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Servidor</th>
                                        <th className="px-6 py-4">Ação / Categoria</th>
                                        <th className="px-6 py-4">Autor</th>
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-3 w-20" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-3 w-16" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-3 w-20" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-6 w-6 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : (stats?.recentActivity?.length || 0) === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-4 text-center text-slate-500">Nenhuma movimentação recente.</td></tr>
                                    ) : (
                                        stats?.recentActivity?.map((activity, index) => {
                                            const date = formatDateUTC(activity.updatedAt);
                                            return (
                                                <tr
                                                    key={index}
                                                    onClick={() => navigate(`/adicionar-servidor/${activity.IDPK_SERV || activity._id}`)}
                                                    className="activity-row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900 dark:text-white">{activity.NOME_SERV}</span>
                                                            <span className="text-xs text-slate-500">Mat: {activity.MATRICULA_SERV}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">{activity.action || 'Atualização'}</td>
                                                    <td className="px-6 py-4">{activity.autor || 'Sistema'}</td>
                                                    <td className="px-6 py-4">{date}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className="material-symbols-outlined text-slate-400" style={{ fontSize: '20px' }}>visibility</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden flex flex-col gap-3 p-4 bg-background-light dark:bg-background-dark">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark flex gap-3">
                                        <Skeleton className="size-10 rounded-full shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : (stats?.recentActivity?.length || 0) === 0 ? (
                                <div className="p-8 text-center text-slate-500 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light">Nenhuma movimentação recente.</div>
                            ) : (
                                stats?.recentActivity?.map((activity, index) => {
                                    const date = formatDateUTC(activity.updatedAt);
                                    const initials = activity.NOME_SERV ? activity.NOME_SERV.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';

                                    return (
                                        <div
                                            key={index}
                                            onClick={() => navigate(`/adicionar-servidor/${activity.IDPK_SERV || activity._id}`)}
                                            className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm active:scale-[0.98] transition-all duration-200 cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 text-primary flex items-center justify-center rounded-full size-10 text-sm font-bold border border-primary/20">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-slate-900 dark:text-white font-semibold leading-tight">{activity.NOME_SERV}</h3>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Mat: {activity.MATRICULA_SERV}</p>
                                                    </div>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-400 text-sm">visibility</span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 dark:text-slate-400">Ação:</span>
                                                    <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{activity.action || 'Atualização'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 dark:text-slate-400">Autor:</span>
                                                    <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{activity.autor || 'Sistema'}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 dark:text-slate-400">Data:</span>
                                                    <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Distribution */}
                <div className="flex flex-col gap-6">
                    <div className="bg-surface-light dark:bg-surface-dark p-4 sm:p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm h-full flex flex-col">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Vínculos Empregatícios</h3>
                        {/* ... Chart code remains the same ... */}
                        {loading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Skeleton className="h-48 w-48 rounded-full" />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center pb-4">
                                <div className="h-64 w-full flex items-center justify-center relative">
                                    {(() => {
                                        const chartDataSrc = [
                                            { label: 'Efetivos', value: stats?.vinculos?.efetivos || 0, color: '#3b82f6' },
                                            { label: 'Comissionados', value: stats?.vinculos?.comissionados || 0, color: '#a855f7' },
                                            { label: 'Contratados', value: stats?.vinculos?.contratados || 0, color: '#14b8a6' },
                                            { label: 'Serviços Prestados', value: stats?.vinculos?.servicosPrestados || 0, color: '#f59e0b' },
                                            { label: 'Outros', value: stats?.vinculos?.outros || 0, color: '#cbd5e1' }
                                        ];

                                        const activeSlices = chartDataSrc.filter(item => item.value > 0);

                                        return (
                                            <>
                                                <Doughnut
                                                    data={{
                                                        labels: activeSlices.map(s => s.label),
                                                        datasets: [
                                                            {
                                                                data: activeSlices.map(s => s.value),
                                                                backgroundColor: activeSlices.map(s => s.color),
                                                                borderWidth: 0,
                                                                hoverOffset: 10
                                                            },
                                                        ],
                                                    }}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        cutout: '75%',
                                                        plugins: {
                                                            legend: {
                                                                position: 'bottom',
                                                                labels: {
                                                                    usePointStyle: true,
                                                                    padding: 20,
                                                                    font: {
                                                                        family: "'Inter', sans-serif",
                                                                        size: 11
                                                                    },
                                                                    color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569'
                                                                }
                                                            },
                                                            tooltip: {
                                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                                padding: 12,
                                                                cornerRadius: 8,
                                                                callbacks: {
                                                                    label: function (context) {
                                                                        const value = context.raw;
                                                                        const total = context.chart._metasets[context.datasetIndex].total;
                                                                        const percentage = total ? ((value / total) * 100).toFixed(1) + '%' : '0%';
                                                                        return ` ${context.label}: ${value} (${percentage})`;
                                                                    }
                                                                }
                                                            }
                                                        },
                                                        animation: {
                                                            animateScale: true,
                                                            animateRotate: true
                                                        }
                                                    }}
                                                />
                                                {/* Center Text */}
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-3xl font-bold text-slate-800 dark:text-white">
                                                        {totalVinculos}
                                                    </span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Total</span>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Modal */}
            {
                isHistoryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Histórico Completo de Alterações</h3>
                                <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-0">
                                <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                    <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 sticky top-0">
                                        <tr>
                                            <th className="px-6 py-4">Servidor</th>
                                            <th className="px-6 py-4">Ação / Categoria</th>
                                            <th className="px-6 py-4">Autor</th>
                                            <th className="px-6 py-4">Data</th>
                                            <th className="px-6 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                        {historyLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i}>
                                                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                                    <td className="px-6 py-4"><Skeleton className="h-3 w-20" /></td>
                                                    <td className="px-6 py-4"><Skeleton className="h-3 w-16" /></td>
                                                    <td className="px-6 py-4"><Skeleton className="h-3 w-20" /></td>
                                                    <td className="px-6 py-4"></td>
                                                </tr>
                                            ))
                                        ) : historyData.length === 0 ? (
                                            <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                                        ) : (
                                            historyData.map((item, index) => {
                                                const date = new Date(item.updatedAt).toLocaleString('pt-BR');
                                                return (
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-900 dark:text-white">{item.NOME_SERV}</span>
                                                                <span className="text-xs text-slate-500">Mat: {item.MATRICULA_SERV}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">{item.action || 'Atualização'}</td>
                                                        <td className="px-6 py-4">{item.autor || 'Sistema'}</td>
                                                        <td className="px-6 py-4">{date}</td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    setIsHistoryModalOpen(false);
                                                                    navigate(`/adicionar-servidor/${item.IDPK_SERV || item._id}`);
                                                                }}
                                                                className="text-primary hover:text-blue-700"
                                                            >
                                                                Acessar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                                <button
                                    disabled={historyPage === 1}
                                    onClick={() => handlePageChange(historyPage - 1)}
                                    className="px-4 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                    Página {historyPage} de {historyTotalPages || 1}
                                </span>
                                <button
                                    disabled={historyPage === historyTotalPages}
                                    onClick={() => handlePageChange(historyPage + 1)}
                                    className="px-4 py-2 text-sm bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

        </div >
    );
};

export default Dashboard;
