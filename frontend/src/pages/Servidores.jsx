import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';
import LottieLoader from '../components/LottieLoader';
import { formatDateUTC } from '../utils/formatDate';
import { useStaggerReveal } from '../hooks/useAnimations';


import { useServidores } from '../hooks/useServidores';

const Servidores = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize initial filters from URL
    const queryParams = new URLSearchParams(location.search);
    const initialFilters = {
        birthMonth: queryParams.get('birthMonth') || ''
    };

    const {
        servidores,
        loading,
        page,
        setPage,
        totalPages,
        totalItems,
        filters,
        setoresOpt,
        cargosOpt,
        handleFilterChange,
        clearFilters,
        deleteServidor,
        limit
    } = useServidores(1, initialFilters);

    // Animation hook for table rows
    const tableRef = useStaggerReveal('.animate-row', [loading, servidores]);

    const handleDelete = async (id) => {
        try {
            const success = await deleteServidor(id);
            if (success) {
                alert('Servidor excluído com sucesso!');
            }
        } catch (error) {
            alert('Erro ao excluir servidor: ' + (error.response?.data?.msg || error.message));
        }
    };

    return (
        <div className="w-full px-2 md:px-4 fade-in flex flex-col gap-6">
            {/* Header e Estatísticas */}
            <div className="flex flex-col gap-8">
                <div className="flex flex-wrap justify-between items-end gap-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">Servidores</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão centralizada do quadro de pessoal e lotações.</p>
                    </div>
                    <button
                        onClick={() => navigate('/adicionar-servidor')}
                        className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 group"
                    >
                        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">add</span>
                        Novo Servidor
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="glass dark:glass-dark rounded-3xl p-6 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mr-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                        Filtros
                    </div>

                    <div className="relative group">
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Buscar servidor..."
                            className="pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64 outline-none"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                    </div>

                    <select
                        name="cargo"
                        value={filters.cargo}
                        onChange={handleFilterChange}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
                    >
                        <option value="">Todos os Cargos</option>
                        {cargosOpt.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>

                    <select
                        name="vinculo"
                        value={filters.vinculo}
                        onChange={handleFilterChange}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
                    >
                        <option value="">Todos os Vínculos</option>
                        <option value="EFETIVO">Efetivo</option>
                        <option value="COMISSIONADO">Comissionado</option>
                        <option value="CONTRATADO">Contratado</option>
                        <option value="SERVIÇOS PRESTADOS">Serviços Prestados</option>
                    </select>

                    <select
                        name="setor"
                        value={filters.setor}
                        onChange={handleFilterChange}
                        className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[160px] cursor-pointer"
                    >
                        <option value="">Todos os Setores</option>
                        {setoresOpt.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <button
                        onClick={clearFilters}
                        className="ml-auto text-xs font-bold text-primary hover:text-blue-600 uppercase tracking-widest flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                        Resetar
                    </button>
                </div>
            </div>

            {/* Content: Cards (Mobile) & Table (Desktop) */}
            <div className="glass dark:glass-dark rounded-3xl shadow-sm overflow-hidden border-none">

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-border-light dark:divide-border-dark">
                        <thead className="bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md sticky top-0 z-10 supports-[backdrop-filter]:bg-background-light/60">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Servidor</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Matrícula</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vínculo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Admissão</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cargo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Setor</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                            </tr>
                        </thead>
                        <tbody ref={tableRef} className="divide-y divide-border-light dark:divide-border-dark bg-surface-light dark:bg-surface-dark">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center">
                                        <LottieLoader />
                                    </td>
                                </tr>
                            ) : servidores.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500">Nenhum servidor encontrado.</td></tr>
                            ) : (
                                servidores.map((servidor) => {
                                    const initials = servidor.NOME_SERV ? servidor.NOME_SERV.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                                    return (
                                        <tr key={servidor._id} className="animate-row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-primary/10 text-primary flex items-center justify-center rounded-full size-10 text-sm font-bold border border-primary/20 group-hover:scale-110 transition-transform duration-200">
                                                        {initials}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span
                                                            onClick={() => navigate(`/adicionar-servidor/${servidor._id}`)}
                                                            className="text-slate-900 dark:text-white text-sm font-semibold cursor-pointer hover:text-primary hover:underline"
                                                        >
                                                            {servidor.NOME_SERV}
                                                        </span>
                                                        <p className="text-slate-500 dark:text-slate-400 text-xs">CPF: {servidor.CPF_SERV || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 font-medium">{servidor.MATRICULA_SERV}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300 capitalize">{servidor.VINCULO_SERV ? servidor.VINCULO_SERV.toLowerCase() : '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">
                                                {formatDateUTC(servidor.ADMISSAO_SERV)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{servidor.CARGO_SERV || servidor.CARGO_EFETIVO_SERV}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 dark:text-slate-300">{servidor.SETOR_LOTACAO_SERV}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                    ${servidor.ATIVO_SERV === 'SIM' || servidor.ATIVO_SERV === 'ATIVO'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'}`}>
                                                    {servidor.ATIVO_SERV}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => navigate(`/adicionar-servidor/${servidor._id}`)}
                                                        className="text-slate-400 hover:text-primary transition-colors"
                                                        title="Editar"
                                                    >
                                                        <span className="material-symbols-outlined">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(servidor._id)}
                                                        className="text-slate-400 hover:text-red-500 transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <span className="material-symbols-outlined">delete</span>
                                                    </button>
                                                </div>
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
                        <div className="py-8 flex justify-center w-full">
                            <LottieLoader />
                        </div>
                    ) : servidores.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light">Nenhum servidor encontrado.</div>
                    ) : (
                        servidores.map((servidor) => {
                            const initials = servidor.NOME_SERV ? servidor.NOME_SERV.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                            return (
                                <div
                                    key={servidor._id}
                                    className="p-3 sm:p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm active:scale-[0.98] transition-all duration-200"
                                    onClick={() => navigate(`/adicionar-servidor/${servidor._id}`)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex items-center justify-center rounded-full size-12 text-base font-bold border border-primary/20">
                                                {initials}
                                            </div>
                                            <div>
                                                <h3 className="text-slate-900 dark:text-white font-semibold leading-tight">{servidor.NOME_SERV}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Mat: {servidor.MATRICULA_SERV}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold border ${servidor.statusClass ? servidor.statusClass.replace('bg-', 'border-').replace('text-', 'text-').split(' ')[0] : ''} ${servidor.statusClass || ''}`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${servidor.status === 'Ativo' ? 'bg-green-600' : servidor.status === 'Inativo' ? 'bg-red-600' : 'bg-yellow-600'}`}></span>
                                            {servidor.status || 'Desconhecido'}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Cargo:</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-medium text-right max-w-[200px] truncate">{servidor.CARGO_SERV || servidor.CARGO_EFETIVO_SERV}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Setor:</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-medium text-right max-w-[200px] truncate">{servidor.SETOR_LOTACAO_SERV}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Vínculo:</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-medium text-right lowercase first-letter:uppercase">{servidor.VINCULO_SERV}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-border-light dark:border-border-dark last:border-0 last:pb-0">
                                            <span className="text-slate-500 dark:text-slate-400 text-sm">Admissão</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{formatDateUTC(servidor.ADMISSAO_SERV)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                <div className="bg-surface-light dark:bg-surface-dark px-4 py-3 border-t border-border-light dark:border-border-dark sm:px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-sm text-slate-700 dark:text-slate-300">
                                Mostrando <span className="font-medium">{(page - 1) * limit + 1}</span> até <span className="font-medium">{Math.min(page * limit, totalItems)}</span> de <span className="font-medium">{totalItems}</span>
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="relative inline-flex items-center px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                            </button>
                            <span className="relative inline-flex items-center px-4 py-2 border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg">
                                {page}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="relative inline-flex items-center px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-slate-800 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Servidores;
