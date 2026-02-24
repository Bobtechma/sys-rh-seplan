import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Doughnut } from 'react-chartjs-2';
import { Skeleton } from '../components/Skeleton';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeServidores: 0,
        aniversariantesCount: 0,
        pendencias: 0,
        ferias: 0,
        vinculos: { efetivos: 0, comissionados: 0, contratados: 0, servicosPrestados: 0, outros: 0 },
        recentActivity: []
    });

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/dashboard', {
                    headers: { 'x-auth-token': token }
                });
                setStats(response.data);
            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                // Artificial delay for smooth skeleton effect (optional, remove in prod if desired)
                setTimeout(() => setLoading(false), 500);
            }
        };

        fetchDashboardStats();
    }, []);

    // State for History Modal
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchHistory = async (page) => {
        setHistoryLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/dashboard/history?page=${page}&limit=10`, {
                headers: { 'x-auth-token': token }
            });
            setHistoryData(res.data.history);
            setHistoryTotalPages(res.data.totalPages);
            setHistoryPage(res.data.currentPage);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (isHistoryModalOpen) {
            fetchHistory(1);
        }
    }, [isHistoryModalOpen]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= historyTotalPages) {
            fetchHistory(newPage);
        }
    };

    const totalVinculos = stats.vinculos.efetivos + stats.vinculos.comissionados + stats.vinculos.contratados + (stats.vinculos.servicosPrestados || 0) + (stats.vinculos.outros || 0);

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <span className="material-symbols-outlined text-primary">groups</span>
                        </div>
                        <span className="flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            +1.2%
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Servidores Ativos</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {loading ? <Skeleton className="h-8 w-16" /> : stats.activeServidores}
                    </h3>
                </div>
                <div
                    onClick={() => {
                        const currentMonth = new Date().getMonth() + 1;
                        navigate(`/servidores?birthMonth=${currentMonth}`);
                    }}
                    className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg group-hover:bg-purple-100 dark:group-hover:bg-purple-900/40 transition-colors">
                            <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">cake</span>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Aniversariantes (Mês)</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {loading ? <Skeleton className="h-8 w-12" /> : stats.aniversariantesCount}
                    </h3>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                            <span className="material-symbols-outlined text-orange-600 dark:text-orange-400">assignment_late</span>
                        </div>
                        <span className="flex items-center text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-2 py-0.5 rounded-full">
                            Pendente
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Pendências de RH</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {loading ? <Skeleton className="h-8 w-12" /> : stats.pendencias}
                    </h3>
                </div>
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                            <span className="material-symbols-outlined text-teal-600 dark:text-teal-400">beach_access</span>
                        </div>
                        <span className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            Atual
                        </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Servidores em Férias</p>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {loading ? <Skeleton className="h-8 w-12" /> : stats.ferias}
                    </h3>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Acesso Rápido</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <Link to="/adicionar-servidor" className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 dark:hover:border-primary transition-all duration-300 group h-32 hover:-translate-y-1 shadow-sm hover:shadow-md active:scale-95">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full group-hover:bg-white dark:group-hover:bg-blue-900 transition-colors">
                            <span className="material-symbols-outlined text-primary">person_add</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 text-center">Cadastrar<br />Servidor</span>
                    </Link>
                    {/* Add other quick actions here from legacy file if needed, keeping simple for now */}
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
                        <div className="block overflow-x-auto">
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
                                    ) : stats.recentActivity.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-4 text-center text-slate-500">Nenhuma movimentação recente.</td></tr>
                                    ) : (
                                        stats.recentActivity.map((activity, index) => {
                                            const date = new Date(activity.updatedAt).toLocaleDateString('pt-BR');
                                            return (
                                                <tr
                                                    key={index}
                                                    onClick={() => navigate(`/adicionar-servidor/${activity.IDPK_SERV || activity._id}`)}
                                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
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
                    </div>
                </div>

                {/* Right Column: Distribution */}
                <div className="flex flex-col gap-6">
                    <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm h-full flex flex-col">
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
                                            { label: 'Efetivos', value: stats.vinculos.efetivos || 0, color: '#3b82f6' }, // Blue-500
                                            { label: 'Comissionados', value: stats.vinculos.comissionados || 0, color: '#a855f7' }, // Purple-500
                                            { label: 'Contratados', value: stats.vinculos.contratados || 0, color: '#14b8a6' }, // Teal-500
                                            { label: 'Serviços Prestados', value: stats.vinculos.servicosPrestados || 0, color: '#f59e0b' }, // Amber-500
                                            { label: 'Outros', value: stats.vinculos.outros || 0, color: '#cbd5e1' }  // Slate-300
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
