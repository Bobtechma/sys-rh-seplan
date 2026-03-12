import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from '../components/Skeleton';
import LottieLoader from '../components/LottieLoader';
import { formatDateUTC } from '../utils/formatDate';
import { useStaggerReveal, useModalReveal } from '../hooks/useAnimations';

import { useAbsences } from '../hooks/useAbsences';

const Afastamentos = () => {
    const {
        afastamentos,
        loading,
        page: currentPage,
        setPage: setCurrentPage,
        totalPages,
        totalItems: totalResults,
        searchFilters: filters,
        tiposAfastamento,
        setoresOpt,
        cargosOpt,
        handleFilterChange,
        clearFilters,
        deleteAbsence,
        addAbsenceType,
        refresh: fetchAfastamentos
    } = useAbsences();

    const [servidores, setServidores] = useState([]);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [isNew, setIsNew] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        servidorId: '',
        tipo: 'Licença Médica',
        periodos: [{ inicio: '', fim: '' }],
        obs: '',
        status: 'Pendente'
    });

    const [viewData, setViewData] = useState(null);
    const [isAddingTipo, setIsAddingTipo] = useState(false);
    const [newTipo, setNewTipo] = useState('');

    // Animation Hooks
    const tableRef = useStaggerReveal('.animate-row', [loading, afastamentos, currentPage], { staggerDelay: 40 });
    const mobileCardsRef = useStaggerReveal('.animate-card', [loading, afastamentos, currentPage], { staggerDelay: 50 });
    const editModalRef = useModalReveal(isEditModalOpen);
    const viewModalRef = useModalReveal(isViewModalOpen);

    const fetchServidores = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/servidores?limit=1000&simple=true&_t=${Date.now()}`, {
                headers: { 'x-auth-token': token }
            });
            setServidores(response.data.servidores);
        } catch (error) {
            console.error('Error loading servidores:', error);
        }
    };

    useEffect(() => {
        fetchServidores();
    }, []);

    const handleAddTipoLocal = async () => {
        if (!newTipo.trim()) return;
        try {
            const addedType = await addAbsenceType(newTipo.trim());
            setFormData({ ...formData, tipo: addedType.nome });
            setNewTipo('');
            setIsAddingTipo(false);
        } catch (error) {
            alert('Erro ao adicionar tipo. Talvez já exista.');
        }
    };

    const addPeriodo = () => {
        if (formData.periodos.length < 3) {
            setFormData({ ...formData, periodos: [...formData.periodos, { inicio: '', fim: '' }] });
        }
    };

    const removePeriodo = (index) => {
        const newPeriodos = formData.periodos.filter((_, i) => i !== index);
        setFormData({ ...formData, periodos: newPeriodos });
    };

    const updatePeriodo = (index, field, value) => {
        const newPeriodos = [...formData.periodos];
        newPeriodos[index][field] = value;
        setFormData({ ...formData, periodos: newPeriodos });
    };

    const handleOpenNew = async () => {
        setIsNew(true);
        setCurrentId(null);
        setFormData({
            servidorId: '',
            tipo: tiposAfastamento.length > 0 ? tiposAfastamento[0].nome : 'Licença Médica',
            periodos: [{ inicio: '', fim: '' }],
            obs: '',
            status: 'Pendente'
        });
        await fetchServidores();
        setIsEditModalOpen(true);
    };

    const handleOpenEdit = async (id) => {
        setIsNew(false);
        setCurrentId(id);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/afastamentos/${id}`, {
                headers: { 'x-auth-token': token }
            });
            const data = response.data;
            setFormData({
                servidorId: data.servidor ? data.servidor._id : '', // Usually read-only in edit
                tipo: data.ASSUNTO_SIT,
                periodos: [{
                    inicio: data.INICIO_FERIAS_SIT ? data.INICIO_FERIAS_SIT.split('T')[0] : '',
                    fim: data.FIM_FERIAS_SIT ? data.FIM_FERIAS_SIT.split('T')[0] : ''
                }],
                obs: data.OBS_SIT || '',
                status: data.STATUS_SIT
            });
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                servidorId: formData.servidorId,
                tipo: formData.tipo,
                periodos: formData.periodos,
                inicio: formData.periodos[0].inicio, // fallback for single-period logic
                fim: formData.periodos[0].fim,       // fallback for single-period logic
                observacao: formData.obs,            // backend expects 'observacao'
                obs: formData.obs,                   // fallback
                status: formData.status
            };

            if (isNew) {
                await axios.post('/api/afastamentos', payload, {
                    headers: { 'x-auth-token': token }
                });
            } else {
                await axios.put(`/api/afastamentos/${currentId}`, payload, {
                    headers: { 'x-auth-token': token }
                });
            }

            setIsEditModalOpen(false);
            fetchAfastamentos(currentPage);
            alert('Salvo com sucesso!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Erro ao salvar.');
        }
    };

    const handleOpenView = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/afastamentos/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setViewData(response.data);
            setIsViewModalOpen(true);
        } catch (error) {
            console.error('Error fetching details:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir este afastamento? Esta ação não pode ser desfeita.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/afastamentos/${id}`, {
                    headers: { 'x-auth-token': token }
                });
                setAfastamentos(afastamentos.filter(a => a._id !== id));
                setTotalResults(totalResults - 1);
                alert('Afastamento excluído com sucesso.');
            } catch (error) {
                console.error('Error deleting afastamento:', error);
                alert('Erro ao excluir afastamento.');
            }
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            'Aprovado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
            'Rejeitado': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            'Pendente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles['Pendente']}`}>
                <span className={`mr-1.5 h-2 w-2 rounded-full ${status === 'Aprovado' ? 'bg-green-500' : status === 'Rejeitado' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                {status}
            </span>
        );
    };

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-20 font-sans">
            {/* Header section with refined typography */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight font-display">Afastamentos</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie as licenças e afastamentos dos servidores.</p>
                </div>
                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 hover:-translate-y-1 active:scale-95"
                >
                    <span className="material-symbols-outlined">add_circle</span>
                    Novo Afastamento
                </button>
            </div>

            {/* Filters Section - Glassmorphism */}
            <div className="glass dark:glass-dark p-6 rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden relative group">
                {/* Decorative background glow */}
                <div className="absolute -top-24 -right-24 size-48 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700"></div>

                <div className="relative flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">tune</span>
                        </div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Refinar Busca</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        <div className="relative group/input">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within/input:text-primary transition-colors">search</span>
                            <input
                                type="text"
                                name="search"
                                value={filters.search}
                                onChange={handleFilterChange}
                                placeholder="Nome do servidor..."
                                className="w-full pl-12 pr-4 py-3.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium"
                            />
                        </div>

                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-3.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium appearance-none cursor-pointer"
                        >
                            <option value="">Status (Afastamento)</option>
                            <option value="Pendente">Pendente</option>
                            <option value="Aprovado">Aprovado</option>
                            <option value="Rejeitado">Rejeitado</option>
                        </select>

                        <select
                            name="setor"
                            value={filters.setor}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-3.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium appearance-none cursor-pointer"
                        >
                            <option value="">Lotação / Setor</option>
                            {setoresOpt.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                        </select>

                        <select
                            name="status_servidor"
                            value={filters.status_servidor}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-3.5 bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium appearance-none cursor-pointer"
                        >
                            <option value="">Status do Servidor</option>
                            <option value="ativo">Ativos (+ Afastados)</option>
                            <option value="inativo">Inativos</option>
                        </select>

                        <button
                            onClick={clearFilters}
                            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-sm transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-xl">restart_alt</span>
                            Limpar
                        </button>
                    </div>
                </div>
            </div>

            {/* Table / List Section */}
            <div className="glass dark:glass-dark rounded-[2.5rem] border border-white/20 dark:border-white/5 shadow-2xl overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Servidor</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Setor</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Tipo</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Início</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Fim</th>
                                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody ref={tableRef} className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
                                        <LottieLoader />
                                    </td>
                                </tr>
                            ) : afastamentos.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-400">
                                            <span className="material-symbols-outlined text-5xl">folder_off</span>
                                            <p className="font-medium text-lg">Nenhum afastamento encontrado.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                afastamentos.map((a) => (
                                    <tr key={a._id} className="animate-row hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all duration-300 group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-sm shadow-inner group-hover:scale-110 transition-transform duration-300">
                                                    {a.servidor?.NOME_SERV?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate max-w-[200px]">
                                                        {a.servidor?.NOME_SERV || 'Desconhecido'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">RH Master</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-slate-600 dark:text-slate-300 font-semibold">{a.servidor?.SETOR_LOTACAO_SERV || '-'}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">Departamento</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700">
                                                {a.ASSUNTO_SIT}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-slate-600 dark:text-slate-300 font-bold">{formatDateUTC(a.INICIO_FERIAS_SIT)}</span>
                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Data Início</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-slate-600 dark:text-slate-300 font-bold">{formatDateUTC(a.FIM_FERIAS_SIT)}</span>
                                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">Data Fim</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">{getStatusBadge(a.STATUS_SIT)}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                <button onClick={() => handleOpenView(a._id)} className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all" title="Visualizar">
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                                <button onClick={() => handleOpenEdit(a._id)} className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-primary/10 hover:text-primary transition-all" title="Editar">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(a._id)} className="size-9 rounded-xl flex items-center justify-center text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all" title="Excluir">
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div ref={mobileCardsRef} className="md:hidden flex flex-col gap-4 p-6 bg-slate-50/30 dark:bg-black/10">
                    {loading ? (
                        <div className="py-12 w-full flex justify-center">
                            <LottieLoader />
                        </div>
                    ) : afastamentos.length === 0 ? (
                        <div className="py-20 text-center text-slate-400 font-medium">Nenhum afastamento encontrado.</div>
                    ) : (
                        afastamentos.map((a) => {
                            const initials = a.servidor?.NOME_SERV ? a.servidor.NOME_SERV.charAt(0).toUpperCase() : '?';
                            return (
                                <div
                                    key={a._id}
                                    className="animate-card p-5 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 text-primary flex items-center justify-center rounded-2xl size-12 text-lg font-black border border-primary/20 shadow-inner">
                                                {initials}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h3 className="text-slate-900 dark:text-white font-bold leading-tight truncate pr-2">{a.servidor?.NOME_SERV || 'Desconhecido'}</h3>
                                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-wider mt-0.5 truncate">{a.servidor?.SETOR_LOTACAO_SERV || '-'}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(a.STATUS_SIT)}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50 dark:border-slate-800/50">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Início</span>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDateUTC(a.INICIO_FERIAS_SIT)}</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Fim</span>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatDateUTC(a.FIM_FERIAS_SIT)}</span>
                                        </div>
                                        <div className="flex flex-col gap-1 col-span-2">
                                            <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Tipo de Afastamento</span>
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{a.ASSUNTO_SIT}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Ações Rápidas</span>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => handleOpenView(a._id)} className="size-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all shadow-sm border border-slate-100 dark:border-slate-700">
                                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            </button>
                                            <button onClick={() => handleOpenEdit(a._id)} className="size-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all shadow-sm border border-slate-100 dark:border-slate-700">
                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(a._id)} className="size-9 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all shadow-sm border border-slate-100 dark:border-slate-700">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 border-t border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/10 active:bg-transparent transition-colors">
                    <div className="flex flex-col items-center sm:items-start">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Total de Registros</p>
                        <span className="text-xl font-black text-slate-900 dark:text-white mt-1">{totalResults}</span>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchAfastamentos(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-sm border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-30 hover:bg-slate-50 active:scale-95 flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-xl">chevron_left</span>
                            Anterior
                        </button>
                        <button
                            onClick={() => fetchAfastamentos(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="bg-white dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 px-6 py-2.5 rounded-2xl font-bold text-sm shadow-sm border border-slate-200 dark:border-slate-800 transition-all disabled:opacity-30 hover:bg-slate-50 active:scale-95 flex items-center gap-2"
                        >
                            Próximo
                            <span className="material-symbols-outlined text-xl">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-12">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsEditModalOpen(false)}></div>
                        <div ref={editModalRef} className="relative glass dark:glass-dark rounded-[2.5rem] shadow-2xl w-full max-w-xl p-8 border border-white/20 dark:border-white/5 overflow-hidden">
                            {/* Accent Glow */}
                            <div className="absolute -top-24 -right-24 size-48 bg-primary/10 rounded-full blur-3xl"></div>

                            <div className="relative">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                            <span className="material-symbols-outlined">{isNew ? 'add_circle' : 'edit_square'}</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {isNew ? 'Novo Afastamento' : 'Editar Registro'}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle de Fluxo</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsEditModalOpen(false)} className="size-10 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                        <span className="material-symbols-outlined">close</span>
                                    </button>
                                </div>

                                <form onSubmit={handleSave} className="space-y-6">
                                    {isNew && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2">Servidor Beneficiário</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">person</span>
                                                <select
                                                    required
                                                    value={formData.servidorId}
                                                    onChange={(e) => setFormData({ ...formData, servidorId: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold appearance-none cursor-pointer"
                                                >
                                                    <option value="">Selecione um servidor na rede...</option>
                                                    {servidores.map(s => (
                                                        <option key={s.IDPK_SERV} value={s.IDPK_SERV}>{s.NOME_SERV}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2">Tipo de Afastamento</label>
                                        {!isAddingTipo ? (
                                            <div className="flex gap-2 relative group">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors z-10">category</span>
                                                <select
                                                    value={formData.tipo}
                                                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold appearance-none cursor-pointer"
                                                >
                                                    {tiposAfastamento.length > 0 ? (
                                                        tiposAfastamento.map(t => (
                                                            <option key={t._id} value={t.nome}>{t.nome}</option>
                                                        ))
                                                    ) : (
                                                        <option value="Licença Médica">Licença Médica</option>
                                                    )}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsAddingTipo(true)}
                                                    className="shrink-0 size-[52px] flex items-center justify-center glass dark:glass-dark text-primary rounded-2xl hover:scale-110 active:scale-95 transition-all border border-primary/20"
                                                    title="Adicionar Novo Tipo"
                                                >
                                                    <span className="material-symbols-outlined font-black">add</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={newTipo}
                                                    onChange={(e) => setNewTipo(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTipo())}
                                                    placeholder="Digite o novo tipo..."
                                                    className="flex-1 px-6 py-4 bg-white dark:bg-slate-900 border border-primary/50 rounded-[2rem] outline-none ring-2 ring-primary/10 text-sm font-semibold"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddTipo}
                                                    className="shrink-0 size-[52px] flex items-center justify-center bg-green-500 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg shadow-green-500/20"
                                                >
                                                    <span className="material-symbols-outlined font-black">check</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsAddingTipo(false); setNewTipo(''); }}
                                                    className="shrink-0 size-[52px] flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl hover:scale-110 active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
                                                >
                                                    <span className="material-symbols-outlined font-black">close</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between ml-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Períodos de Ausência</label>
                                            {formData.periodos.length < 3 && isNew && (
                                                <button
                                                    type="button"
                                                    onClick={addPeriodo}
                                                    className="text-[10px] font-black text-primary uppercase tracking-[0.1em] hover:underline"
                                                >
                                                    + Adicionar Período
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3">
                                            {formData.periodos.map((periodo, index) => (
                                                <div key={index} className="grid grid-cols-2 gap-4 p-5 bg-slate-50/50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 relative animate-fade-in">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 ml-2">Início</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={periodo.inicio}
                                                            onChange={(e) => updatePeriodo(index, 'inicio', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-slate-400 ml-2">Fim</label>
                                                        <input
                                                            type="date"
                                                            required
                                                            value={periodo.fim}
                                                            onChange={(e) => updatePeriodo(index, 'fim', e.target.value)}
                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] outline-none focus:ring-2 focus:ring-primary/20 text-sm font-semibold transition-all"
                                                        />
                                                    </div>
                                                    {index > 0 && isNew && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removePeriodo(index)}
                                                            className="absolute -top-2 -right-2 size-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px] font-black">close</span>
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2">Observações Detalhadas</label>
                                        <textarea
                                            rows="3"
                                            value={formData.obs}
                                            onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                                            placeholder="Detalhes relevantes sobre o afastamento..."
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-semibold resize-none"
                                        ></textarea>
                                    </div>

                                    {!isNew && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 ml-2">Status da Solicitação</label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-black appearance-none cursor-pointer text-primary"
                                            >
                                                <option value="Pendente">🕒 Pendente de Análise</option>
                                                <option value="Aprovado">✅ Homologado / Aprovado</option>
                                                <option value="Rejeitado">❌ Não Autorizado / Negado</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditModalOpen(false)}
                                            className="flex-1 px-8 py-4 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                                        >
                                            CANCELAR
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-4 bg-primary text-white rounded-[2rem] font-black text-sm shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            {isNew ? 'REGISTRAR AGORA' : 'SALVAR ALTERAÇÕES'}
                                            <span className="material-symbols-outlined">send</span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {isViewModalOpen && viewData && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-12">
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsViewModalOpen(false)}></div>
                        <div ref={viewModalRef} className="relative glass dark:glass-dark rounded-[2.5rem] shadow-2xl w-full max-w-xl p-10 border border-white/20 dark:border-white/5 overflow-hidden">
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 p-8 text-primary opacity-10">
                                <span className="material-symbols-outlined text-[120px]">assignment_turned_in</span>
                            </div>

                            <div className="relative">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="size-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                                        <span className="material-symbols-outlined text-4xl">text_snippet</span>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">Dossiê do Afastamento</h3>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">SYS RH SEPLAN • 2026</p>
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Servidor</span>
                                            <p className="text-lg font-bold text-slate-900 dark:text-white">{viewData.servidor?.NOME_SERV || 'Desconhecido'}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo Legal</span>
                                            <p className="text-lg font-bold text-primary">{viewData.ASSUNTO_SIT}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Início do Período</span>
                                            <div className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                                                <span className="material-symbols-outlined text-green-500">event</span>
                                                {formatDateUTC(viewData.INICIO_FERIAS_SIT)}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Término do Período</span>
                                            <div className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
                                                <span className="material-symbols-outlined text-red-500">event_busy</span>
                                                {formatDateUTC(viewData.FIM_FERIAS_SIT)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Informações Adicionais</span>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic shadow-inner">
                                            "{viewData.OBS_SIT || 'Sem observações registradas para este afastamento.'}"
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Atual</span>
                                        {getStatusBadge(viewData.STATUS_SIT)}
                                    </div>
                                </div>

                                <div className="mt-12 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={() => setIsViewModalOpen(false)}
                                        className="px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
                                    >
                                        FECHAR RELATÓRIO
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Afastamentos;
