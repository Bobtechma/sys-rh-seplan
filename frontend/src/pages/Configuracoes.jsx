import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Skeleton } from '../components/Skeleton';

const Configuracoes = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New User Form Data
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        perfil: 'viewer',
        cargo: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/auth/users', {
                headers: { 'x-auth-token': token }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            if (error.response?.status === 401) {
                alert('Sessão expirada ou sem permissão. Por favor, faça login novamente.');
                // Optional: redirect to login
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/auth/users/${id}`, {
                headers: { 'x-auth-token': token }
            });
            setUsers(users.filter(user => user._id !== id));
            alert('Usuário excluído com sucesso.');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Erro ao excluir usuário.');
        }
    };

    const handleResetPassword = async (id, userName) => {
        if (!window.confirm(`Tem certeza que deseja resetar a senha do usuário "${userName}" para a senha padrão (123456)?`)) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/auth/users/${id}/reset-password`, {}, {
                headers: { 'x-auth-token': token }
            });
            alert(`Senha do usuário "${userName}" resetada com sucesso para 123456.`);
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Erro ao resetar senha: ' + (error.response?.data?.msg || error.message));
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/auth/register', formData, {
                headers: { 'x-auth-token': token }
            });
            alert('Usuário criado com sucesso!');
            setIsModalOpen(false);
            setFormData({ nome: '', email: '', senha: '', perfil: 'viewer', cargo: '' });
            fetchUsers();
        } catch (error) {
            console.error('Error creating user:', error);
            alert('Erro ao criar usuário: ' + (error.response?.data?.msg || error.message));
        }
    };

    const filteredUsers = users.filter(user =>
        user.nome.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
            {/* Header */}
            <div>
                <nav className="flex items-center text-sm text-slate-500 mb-2">
                    <span>Início</span>
                    <span className="mx-2">/</span>
                    <span className="font-medium text-slate-900 dark:text-white">Configurações</span>
                </nav>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gerenciamento de Acessos</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Controle quem tem acesso ao sistema e seus níveis de permissão.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/30"
                    >
                        <span className="material-symbols-outlined">add</span>
                        Novo Usuário
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User List */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Filter */}
                    <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl border border-border-light dark:border-border-dark flex items-center gap-4">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">search</span>
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar usuários..."
                                className="form-input w-full pl-10"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-border-light dark:border-border-dark flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Usuários Cadastrados</h3>
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full">
                                {users.length} Total
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
                                    <tr>
                                        <th className="px-6 py-4">Usuário</th>
                                        <th className="px-6 py-4">Cargo</th>
                                        <th className="px-6 py-4">Perfil</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                    {loading ? (
                                        Array.from({ length: 3 }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-6 py-4"><Skeleton className="h-10 w-40" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                                                <td className="px-6 py-4"><Skeleton className="h-6 w-6 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                            {user.nome.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-slate-900 dark:text-white">{user.nome}</div>
                                                            <div className="text-xs text-slate-500">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{user.cargo || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize
                                                        ${user.perfil === 'admin' ? 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-900/30 dark:text-red-400' :
                                                            user.perfil === 'editor' ? 'bg-blue-50 text-blue-700 ring-blue-600/10 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                'bg-slate-50 text-slate-600 ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                        {user.perfil || 'viewer'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="size-2 rounded-full bg-green-500"></div>
                                                        <span className="text-slate-900 dark:text-white">Ativo</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleResetPassword(user._id, user.nome)}
                                                            className="text-slate-400 hover:text-yellow-600 transition-colors"
                                                            title="Resetar Senha"
                                                        >
                                                            <span className="material-symbols-outlined">lock_reset</span>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(user._id)}
                                                            className="text-slate-400 hover:text-red-500 transition-colors"
                                                            title="Excluir Usuário"
                                                        >
                                                            <span className="material-symbols-outlined">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column (Settings) */}
                <div className="flex flex-col gap-6">
                    <div className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="material-symbols-outlined text-primary">security</span>
                            <h3 className="font-bold text-slate-900 dark:text-white">Segurança</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Exigir 2FA</span>
                                <div className="w-10 h-6 bg-slate-200 dark:bg-slate-700 rounded-full relative cursor-not-allowed">
                                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400">Configurações globais de segurança (Em breve)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-surface-dark rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Novo Usuário</h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nome}
                                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                        className="form-input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="form-input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.senha}
                                        onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                                        className="form-input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                                    <input
                                        type="text"
                                        value={formData.cargo}
                                        onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                                        className="form-input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perfil</label>
                                    <select
                                        value={formData.perfil}
                                        onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
                                        className="form-select w-full"
                                    >
                                        <option value="viewer">Visualizador</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-blue-600"
                                    >
                                        Criar Usuário
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Configuracoes;
