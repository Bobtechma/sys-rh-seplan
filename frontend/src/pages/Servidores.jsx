import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton';


const Servidores = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [servidores, setServidores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({
        search: '',
        setor: '',
        cargo: '',
        vinculo: '',
        status: '',
        birthMonth: ''
    });

    // Options for filters (could be fetched from API)
    const [setoresOpt, setSetoresOpt] = useState([]);
    const [cargosOpt, setCargosOpt] = useState([]);

    const limit = 10;

    useEffect(() => {
        fetchFilters();

        // Initialize filters from URL
        const params = new URLSearchParams(location.search);
        const birthMonthParam = params.get('birthMonth');
        if (birthMonthParam) {
            setFilters(prev => ({ ...prev, birthMonth: birthMonthParam }));
        }
    }, [location.search]);

    useEffect(() => {
        fetchServidores();
    }, [page, filters]);

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

    const fetchServidores = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit,
                search: filters.search,
                setor: filters.setor,
                cargo: filters.cargo,
                vinculo: filters.vinculo,
                status: filters.status,
                birthMonth: filters.birthMonth
            };

            // Remove empty params
            Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

            const response = await axios.get('/api/servidores', { params });
            setServidores(response.data.servidores);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.totalServidores);
        } catch (error) {
            console.error('Error fetching servidores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPage(1); // Reset to page 1 on filter change
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            setor: '',
            cargo: '',
            status: '',
            birthMonth: '',
            vinculo: ''
        });
        setPage(1);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este servidor? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/servidores/${id}`, {
                headers: { 'x-auth-token': token }
            });

            // Remove from state
            setServidores(prev => prev.filter(s => s._id !== id));
            alert('Servidor excluído com sucesso!');
        } catch (error) {
            console.error('Error deleting servidor:', error);
            alert('Erro ao excluir servidor: ' + (error.response?.data?.msg || error.message));
        }
    };

    return (
        <div className="w-full px-2 md:px-4 fade-in flex flex-col gap-6">
            {/* Header e Estatísticas */}
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Servidores Públicos</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie, filtre e acompanhe o quadro de servidores.</p>
                    </div>
                    <button
                        onClick={() => navigate('/adicionar-servidor')}
                        className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition shadow-sm active:scale-95"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Adicionar Servidor
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark p-4 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
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
                        name="cargo"
                        value={filters.cargo}
                        onChange={handleFilterChange}
                        className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 text-sm outline-none focus:ring-primary focus:border-primary min-w-[140px]"
                    >
                        <option value="">Todos os Cargos</option>
                        {cargosOpt.map((c, i) => <option key={i} value={c}>{c}</option>)}
                    </select>

                    <select
                        name="vinculo"
                        value={filters.vinculo}
                        onChange={handleFilterChange}
                        className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 text-sm outline-none focus:ring-primary focus:border-primary min-w-[140px]"
                    >
                        <option value="">Todos os Vínculos</option>
                        <option value="EFETIVO">Efetivo</option>
                        <option value="COMISSIONADO">Comissionado</option>
                        <option value="CONTRATADO">Contratado</option>
                        <option value="SERVIÇOS PRESTADOS">Serviços Prestados</option>
                    </select>

                    <select
                        name="birthMonth"
                        value={filters.birthMonth}
                        onChange={handleFilterChange}
                        className="px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 text-sm outline-none focus:ring-primary focus:border-primary min-w-[140px]"
                    >
                        <option value="">Mês Aniversário</option>
                        <option value="1">Janeiro</option>
                        <option value="2">Fevereiro</option>
                        <option value="3">Março</option>
                        <option value="4">Abril</option>
                        <option value="5">Maio</option>
                        <option value="6">Junho</option>
                        <option value="7">Julho</option>
                        <option value="8">Agosto</option>
                        <option value="9">Setembro</option>
                        <option value="10">Outubro</option>
                        <option value="11">Novembro</option>
                        <option value="12">Dezembro</option>
                    </select>

                    <select
                        name="setor"
                        value={filters.setor}
                        onChange={handleFilterChange}
                        className="form-select text-sm border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary">
                        <option value="">Todos os Setores</option>
                        {setoresOpt.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="form-select text-sm border-border-light dark:border-border-dark rounded-lg bg-background-light dark:bg-background-dark text-slate-700 dark:text-slate-300 focus:ring-primary focus:border-primary">
                        <option value="">Todos os Status</option>
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                        <option value="ferias">Em Férias</option>
                        <option value="afastado">Afastado</option>
                    </select>

                    <button
                        onClick={clearFilters}
                        className="ml-auto text-sm text-primary hover:text-blue-600 font-medium">
                        Limpar Filtros
                    </button>
                </div>
            </div>

            {/* Content: Cards (Mobile) & Table (Desktop) */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">

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
                        <tbody className="divide-y divide-border-light dark:divide-border-dark bg-surface-light dark:bg-surface-dark">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton className="size-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-20" /></div></div></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-5 w-16 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : servidores.length === 0 ? (
                                <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500">Nenhum servidor encontrado.</td></tr>
                            ) : (
                                servidores.map((servidor) => {
                                    const initials = servidor.NOME_SERV ? servidor.NOME_SERV.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                                    return (
                                        <tr key={servidor._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
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
                                                {servidor.ADMISSAO_SERV ? new Date(servidor.ADMISSAO_SERV).toLocaleDateString('pt-BR') : '-'}
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
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark flex gap-3">
                                <Skeleton className="size-12 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))
                    ) : servidores.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light">Nenhum servidor encontrado.</div>
                    ) : (
                        servidores.map((servidor) => {
                            const initials = servidor.NOME_SERV ? servidor.NOME_SERV.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
                            return (
                                <div
                                    key={servidor._id}
                                    className="p-4 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm active:scale-[0.98] transition-all duration-200"
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
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500 dark:text-slate-400">Admissão:</span>
                                            <span className="text-slate-700 dark:text-slate-200 font-medium text-right">{servidor.ADMISSAO_SERV ? new Date(servidor.ADMISSAO_SERV).toLocaleDateString('pt-BR') : '-'}</span>
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
