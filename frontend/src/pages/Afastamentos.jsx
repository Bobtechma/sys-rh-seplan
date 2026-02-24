import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from '../components/Skeleton';

const Afastamentos = () => {
    const [afastamentos, setAfastamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
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
        inicio: '',
        fim: '',
        obs: '',
        status: 'Pendente'
    });

    const [viewData, setViewData] = useState(null);
    const [servidores, setServidores] = useState([]); // For select dropdown

    useEffect(() => {
        fetchAfastamentos(1);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchAfastamentos(1);
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [search, statusFilter]);

    const fetchAfastamentos = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {
                page,
                limit: 10,
                search,
                status: statusFilter
            };
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
            const response = await axios.get('/api/servidores?limit=1000&simple=true', {
                headers: { 'x-auth-token': token }
            });
            setServidores(response.data.servidores);
        } catch (error) {
            console.error('Error loading servidores:', error);
        }
    };

    const handleOpenNew = async () => {
        setIsNew(true);
        setCurrentId(null);
        setFormData({
            servidorId: '',
            tipo: 'Licença Médica',
            inicio: '',
            fim: '',
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
                inicio: data.INICIO_FERIAS_SIT.split('T')[0],
                fim: data.FIM_FERIAS_SIT.split('T')[0],
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
                inicio: formData.inicio,
                fim: formData.fim,
                obs: formData.obs,
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
            <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex flex-wrap gap-4 items-center">
                <div className="relative flex-1 min-w-[200px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined text-[20px]">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nome ou matrícula..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white text-sm focus:ring-primary focus:border-primary outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white py-2 px-3 text-sm focus:ring-primary focus:border-primary outline-none"
                >
                    <option value="">Todos os Status</option>
                    <option value="Pendente">Pendente</option>
                    <option value="Aprovado">Aprovado</option>
                    <option value="Rejeitado">Rejeitado</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
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
                        <tbody className="divide-y divide-border-light dark:divide-border-dark">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20 rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-12 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : afastamentos.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-8 text-center text-slate-500">Nenhum afastamento encontrado.</td></tr>
                            ) : (
                                afastamentos.map((a) => (
                                    <tr key={a._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
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
                                        <td className="px-6 py-4">{new Date(a.INICIO_FERIAS_SIT).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{new Date(a.FIM_FERIAS_SIT).toLocaleDateString()}</td>
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
                        <div className="relative bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700">
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
                                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-sm"
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
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-sm"
                                    >
                                        <option value="Licença Médica">Licença Médica</option>
                                        <option value="Licença Prêmio">Licença Prêmio</option>
                                        <option value="Licença Maternidade">Licença Maternidade</option>
                                        <option value="Licença Paternidade">Licença Paternidade</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Início</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.inicio}
                                            onChange={(e) => setFormData({ ...formData, inicio: e.target.value })}
                                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fim</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.fim}
                                            onChange={(e) => setFormData({ ...formData, fim: e.target.value })}
                                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Observação</label>
                                    <textarea
                                        rows="3"
                                        value={formData.obs}
                                        onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
                                        className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-sm"
                                    ></textarea>
                                </div>

                                {!isNew && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full rounded-lg border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 text-sm"
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
                        <div className="relative bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-lg p-6 border border-slate-200 dark:border-slate-700">
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
                                        <span className="block font-medium text-slate-900 dark:text-white mt-1">{new Date(viewData.INICIO_FERIAS_SIT).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400">Fim</span>
                                        <span className="block font-medium text-slate-900 dark:text-white mt-1">{new Date(viewData.FIM_FERIAS_SIT).toLocaleDateString()}</span>
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
