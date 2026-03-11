import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from '../components/Skeleton';
import LottieLoader from '../components/LottieLoader';
import { formatDateUTC } from '../utils/formatDate';
import { useStaggerReveal, useModalReveal } from '../hooks/useAnimations';

const Afastamentos = () => {
    const [afastamentos, setAfastamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        setor: '',
        cargo: '',
        vinculo: '',
        status: '', // Afastamento status
        status_servidor: '',
        birthMonth: ''
    });
    const [setoresOpt, setSetoresOpt] = useState([]);
    const [cargosOpt, setCargosOpt] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalResults, setTotalResults] = useState(0);

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
    const [servidores, setServidores] = useState([]); // For select dropdown
    const [tiposAfastamento, setTiposAfastamento] = useState([]);
    const [isAddingTipo, setIsAddingTipo] = useState(false);
    const [newTipo, setNewTipo] = useState('');

    // Animation Hooks
    const tableRef = useStaggerReveal('.animate-row', [loading, afastamentos, currentPage], { staggerDelay: 40 });
    const mobileCardsRef = useStaggerReveal('.animate-card', [loading, afastamentos, currentPage], { staggerDelay: 50 });
    const editModalRef = useModalReveal(isEditModalOpen);
    const viewModalRef = useModalReveal(isViewModalOpen);

    useEffect(() => {
        fetchFilters();
        fetchAfastamentos(1);
        fetchTiposAfastamento();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAfastamentos(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [filters]);

    const fetchFilters = async () => {
        try {
            const [setoresRes, cargosRes] = await Promise.all([
                axios.get('/api/servidores/setores'),
                axios.get('/api/servidores/cargos')
            ]);
            setSetoresOpt(setoresRes.data);
            setCargosOpt(cargosRes.data);
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            setor: '',
            cargo: '',
            vinculo: '',
            status: '',
            status_servidor: '',
            birthMonth: ''
        });
        setCurrentPage(1);
    };

    const fetchAfastamentos = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {
                page,
                limit: 10,
                ...filters
            };
            Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

            const response = await axios.get('/api/afastamentos', {
                params,
                headers: { 'x-auth-token': token }
            });

            setAfastamentos(response.data.afastamentos);
            setCurrentPage(response.data.currentPage);
            setTotalPages(response.data.totalPages);
            setTotalResults(response.data.totalAfastamentos);
        } catch (error) {
            console.error('Error loading afastamentos:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const fetchTiposAfastamento = async () => {
        try {
            const response = await axios.get('/api/tipos-afastamento');
            setTiposAfastamento(response.data || []);
        } catch (error) {
            console.error('Error fetching tipos afastamento:', error);
        }
    };

    const handleAddTipo = async () => {
        if (!newTipo.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('/api/tipos-afastamento', { nome: newTipo.trim() }, {
                headers: { 'x-auth-token': token }
            });
            setTiposAfastamento([...tiposAfastamento, response.data].sort((a, b) => a.nome.localeCompare(b.nome)));
            setFormData({ ...formData, tipo: response.data.nome });
            setNewTipo('');
            setIsAddingTipo(false);
        } catch (error) {
            console.error('Error adding new tipo:', error);
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
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Afastamentos</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie as licenças e afastamentos dos servidores</p>
                </div>
                <button
                    onClick={handleOpenNew}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 hover:-translate-y-0.5"
                >
                    <span className="material-symbols-outlined">add</span>
                    Novo Afastamento
                </button>
            </div>

            {/* Filters */}
            <div className="bg-surface-light dark:bg-surface-dark p-3 sm:p-4 rounded-xl border border-border-light dark:border-border-dark flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    <span className="material-symbols-outlined text-slate-400">filter_list</span>
                    Filtros:
                </div>

                <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Buscar por nome..."
                    className="form-input text-sm border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary"
                />

                <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 text-sm outline-none focus:ring-primary focus:border-primary min-w-[140px]"
                >
                    <option value="">Todos os Status (Afastamento)</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Rejeitado">Rejeitado</option>
                </select>

                <select
                    name="setor"
                    value={filters.setor}
                    onChange={handleFilterChange}
                    className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 text-sm outline-none focus:ring-primary focus:border-primary min-w-[140px]"
                >
                    <option value="">Todos os Setores</option>
                    {setoresOpt.map((s, idx) => <option key={idx} value={s}>{s}</option>)}
                </select>

                <select
                    name="status_servidor"
                    value={filters.status_servidor}
                    onChange={handleFilterChange}
                    className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 text-sm outline-none focus:ring-primary focus:border-primary min-w-[140px]"
                >
                    <option value="">Todos os Status (Servidor)</option>
                    <option value="ativo">Ativo (+ Em Férias, Afastado)</option>
                    <option value="inativo">Inativo</option>
                </select>

                <button
                    onClick={clearFilters}
                    className="ml-auto text-sm text-primary hover:text-blue-600 font-medium">
                    Limpar Filtros
                </button>
            </div>

            {/* Table */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                        <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                            <tr>
                                <th className="px-6 py-4">Servidor</th>
                                <th className="px-6 py-4">Setor</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Início</th>
                                <th className="px-6 py-4">Fim</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody ref={tableRef} className="divide-y divide-border-light dark:divide-border-dark bg-surface-light dark:bg-surface-dark">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center">
                                        <LottieLoader />
                                    </td>
                                </tr>
                            ) : afastamentos.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Nenhum afastamento encontrado.</td></tr>
                            ) : (
                                afastamentos.map((a) => (
                                    <tr key={a._id} className="animate-row hover:bg-slate-50 dark:hover:bg-slate-800/50 transition duration-200">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                    {a.servidor?.NOME_SERV?.charAt(0) || '?'}
                                                </div>
                                                <div className="font-medium text-slate-900 dark:text-white max-w-[140px] truncate" title={a.servidor?.NOME_SERV}>
                                                    {a.servidor?.NOME_SERV || 'Desconhecido'}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{a.servidor?.SETOR_LOTACAO_SERV || '-'}</td>
                                        <td className="px-6 py-4">{a.ASSUNTO_SIT}</td>
                                        <td className="px-6 py-4">{formatDateUTC(a.INICIO_FERIAS_SIT)}</td>
                                        <td className="px-6 py-4">{formatDateUTC(a.FIM_FERIAS_SIT)}</td>
                                        <td className="px-6 py-4">{getStatusBadge(a.STATUS_SIT)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleOpenView(a._id)} className="text-slate-400 hover:text-primary transition-colors" title="Visualizar">
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                                <button onClick={() => handleOpenEdit(a._id)} className="text-slate-400 hover:text-primary transition-colors" title="Editar">
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(a._id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Excluir">
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
                <div ref={mobileCardsRef} className="md:hidden flex flex-col gap-3 p-3 sm:p-4 bg-background-light dark:bg-background-dark text-left">
                    {loading ? (
                        <div className="py-8 w-full flex justify-center">
                            <LottieLoader />
                        </div>
                    ) : afastamentos.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light">Nenhum afastamento encontrado.</div>
                    ) : (
                        afastamentos.map((a) => {
                            const initials = a.servidor?.NOME_SERV ? a.servidor.NOME_SERV.charAt(0).toUpperCase() : '?';

                            return (
                                <div
                                    key={a._id}
                                    className="animate-card p-3 sm:p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm active:scale-[0.98] transition-transform duration-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-primary/10 text-primary flex items-center justify-center rounded-full size-12 text-base font-bold border border-primary/20">
                                                {initials}
                                            </div>
                                            <div>
                                                <h3 className="text-slate-900 dark:text-white font-semibold leading-tight max-w-[200px] truncate">{a.servidor?.NOME_SERV || 'Desconhecido'}</h3>
                                                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 max-w-[200px] truncate">{a.servidor?.SETOR_LOTACAO_SERV || '-'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Tipo:</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{a.ASSUNTO_SIT}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Período:</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{formatDateUTC(a.INICIO_FERIAS_SIT)} a {formatDateUTC(a.FIM_FERIAS_SIT)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs mt-1">
                                            <span className="text-slate-500 dark:text-slate-400">Status:</span>
                                            <span className="text-right">{getStatusBadge(a.STATUS_SIT)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-light dark:border-border-dark">
                                        <button onClick={() => handleOpenView(a._id)} className="text-slate-500 hover:text-primary p-2 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors" title="Visualizar">
                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                        </button>
                                        <button onClick={() => handleOpenEdit(a._id)} className="text-slate-500 hover:text-primary p-2 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors" title="Editar">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(a._id)} className="text-slate-500 hover:text-red-500 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg transition-colors" title="Excluir">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                {/* Pagination */}
                <div className="p-4 border-t border-border-light dark:border-border-dark flex items-center justify-between">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Total de <span className="font-bold text-slate-900 dark:text-white">{totalResults}</span> registros
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchAfastamentos(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border border-border-light dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => fetchAfastamentos(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="px-3 py-1 text-sm border border-border-light dark:border-border-dark rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit/Create Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)}></div>
                        <div ref={editModalRef} className="relative bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                                {isNew ? 'Registrar Novo Afastamento' : 'Editar Afastamento'}
                            </h3>
                            <form onSubmit={handleSave} className="space-y-4">
                                {isNew && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Servidor</label>
                                        <select
                                            required
                                            value={formData.servidorId}
                                            onChange={(e) => setFormData({ ...formData, servidorId: e.target.value })}
                                            className="form-select w-full"
                                        >
                                            <option value="">Selecione um servidor</option>
                                            {servidores.map(s => (
                                                <option key={s.IDPK_SERV} value={s.IDPK_SERV}>{s.NOME_SERV}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
                                    {!isAddingTipo ? (
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.tipo}
                                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                                className="form-select w-full"
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
                                                className="shrink-0 px-3 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors border border-slate-300 dark:border-slate-600"
                                                title="Adicionar Novo Tipo"
                                            >
                                                <span className="material-symbols-outlined text-lg">add</span>
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
                                                className="form-input w-full focus:border-primary focus:ring-1 focus:ring-primary"
                                                autoFocus
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddTipo}
                                                className="shrink-0 px-3 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm"
                                                title="Salvar Novo Tipo"
                                            >
                                                <span className="material-symbols-outlined text-lg">check</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setIsAddingTipo(false); setNewTipo(''); }}
                                                className="shrink-0 px-3 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-600 dark:bg-red-900/30 dark:hover:bg-red-800/50 dark:text-red-400 rounded-lg transition-colors border border-red-200 dark:border-red-800/30"
                                                title="Cancelar"
                                            >
                                                <span className="material-symbols-outlined text-lg">close</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Períodos (Máx: 3)
                                    </label>
                                    {formData.periodos.map((periodo, index) => (
                                        <div key={index} className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700 relative group">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Início {index + 1}</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={periodo.inicio}
                                                    onChange={(e) => updatePeriodo(index, 'inicio', e.target.value)}
                                                    className="form-input w-full text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Fim {index + 1}</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={periodo.fim}
                                                    onChange={(e) => updatePeriodo(index, 'fim', e.target.value)}
                                                    className="form-input w-full text-sm"
                                                />
                                            </div>
                                            {index > 0 && isNew && (
                                                <button
                                                    type="button"
                                                    onClick={() => removePeriodo(index)}
                                                    className="absolute -top-2 -right-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-1 shadow-sm transition-colors"
                                                    title="Remover período"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {formData.periodos.length < 3 && isNew && (
                                        <button
                                            type="button"
                                            onClick={addPeriodo}
                                            className="self-start text-xs flex items-center gap-1 text-primary hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                            Adicionar Período
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação</label>
                                    <textarea
                                        rows="3"
                                        value={formData.obs}
                                        onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                                        className="form-input w-full"
                                    ></textarea>
                                </div>

                                {!isNew && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="form-select w-full"
                                        >
                                            <option value="Pendente">Pendente</option>
                                            <option value="Aprovado">Aprovado</option>
                                            <option value="Rejeitado">Rejeitado</option>
                                        </select>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-blue-600"
                                    >
                                        Salvar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* View Modal */}
            {isViewModalOpen && viewData && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsViewModalOpen(false)}></div>
                        <div ref={viewModalRef} className="relative bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Detalhes do Afastamento</h3>
                            <div className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Servidor</span>
                                        <span className="block font-medium text-slate-900 dark:text-white mt-1">{viewData.servidor?.NOME_SERV || 'Desconhecido'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Tipo</span>
                                        <span className="block font-medium text-slate-900 dark:text-white mt-1">{viewData.ASSUNTO_SIT}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Início</span>
                                        <span className="block font-medium text-slate-900 dark:text-white mt-1">{formatDateUTC(viewData.INICIO_FERIAS_SIT)}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Fim</span>
                                        <span className="block font-medium text-slate-900 dark:text-white mt-1">{formatDateUTC(viewData.FIM_FERIAS_SIT)}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Observação</span>
                                    <p className="mt-1 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                                        {viewData.OBS_SIT || '-'}
                                    </p>
                                </div>
                                <div>
                                    <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Status</span>
                                    {getStatusBadge(viewData.STATUS_SIT)}
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsViewModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Afastamentos;
