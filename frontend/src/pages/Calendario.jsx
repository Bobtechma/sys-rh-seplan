import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CalendarioManagers = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        data: '',
        dataFim: '',
        tipo: 'FERIADO',
        descricao: '',
        global: true,
        servidores: []
    });
    const [allServers, setAllServers] = useState([]);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/calendario', {
                headers: { 'x-auth-token': token }
            });
            setEvents(res.data);

            // Also fetch active servers for the Recesso multi-select
            const servRes = await axios.get('/api/servidores?limit=5000&status=ativo', {
                headers: { 'x-auth-token': token }
            });
            // We sort by name alphabetically
            const sortedServers = (servRes.data.servidores || []).sort((a, b) => a.NOME_SERV.localeCompare(b.NOME_SERV));
            setAllServers(sortedServers);
        } catch (error) {
            console.error('Erro ao buscar eventos/servidores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/calendario', formData, {
                headers: { 'x-auth-token': token }
            });
            alert('Evento adicionado!');
            setFormData({ data: '', dataFim: '', tipo: 'FERIADO', descricao: '', global: true, servidores: [] });
            fetchEvents();
        } catch (error) {
            console.error('Erro ao adicionar evento:', error);
            alert('Erro ao salvar evento: ' + (error.response?.data?.msg || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/calendario/${id}`, {
                headers: { 'x-auth-token': token }
            });
            fetchEvents();
        } catch (error) {
            console.error('Erro ao excluir evento:', error);
        }
    };

    const toggleServerSelection = (id) => {
        setFormData(prev => {
            const current = prev.servidores || [];
            if (current.includes(id)) {
                return { ...prev, servidores: current.filter(s => s !== id) };
            } else {
                return { ...prev, servidores: [...current, id] };
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6 p-6">
            <div className="flex flex-col gap-2">
                <nav className="flex gap-2 text-sm text-slate-500">
                    <span onClick={() => navigate('/dashboard')} className="cursor-pointer hover:text-primary">Início</span>
                    <span>/</span>
                    <span className="text-slate-900">Calendário</span>
                </nav>
                <h1 className="text-2xl font-bold text-slate-900">Gerenciar Calendário</h1>
                <p className="text-slate-500">Cadastre feriados e pontos facultativos para os relatórios de frequência.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                <h2 className="text-lg font-bold mb-4">Adicionar Novo Evento</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-sm font-medium mb-1">Data de Início</label>
                            <input
                                type="date"
                                value={formData.data}
                                onChange={e => setFormData({ ...formData, data: e.target.value })}
                                required
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Data de Fim (Opcional)</label>
                            <input
                                type="date"
                                value={formData.dataFim}
                                onChange={e => setFormData({ ...formData, dataFim: e.target.value })}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Tipo</label>
                            <select
                                value={formData.tipo}
                                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                className="w-full p-2 border rounded"
                            >
                                <option value="FERIADO">Feriado</option>
                                <option value="PONTO FACULTATIVO">Ponto Facultativo</option>
                                <option value="RECESSO">Recesso</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Descrição</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    required
                                    placeholder="Ex: Natal"
                                    className="w-full p-2 border rounded"
                                />
                                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                    Adicionar
                                </button>
                            </div>
                        </div>
                    </div>

                    {formData.tipo === 'RECESSO' && (
                        <div className="mt-4 p-4 border rounded bg-slate-50">
                            <label className="block text-sm font-bold mb-2">Escopo do Recesso</label>
                            <div className="flex gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="global"
                                        checked={formData.global}
                                        onChange={() => setFormData({ ...formData, global: true, servidores: [] })}
                                        className="form-radio"
                                    />
                                    <span>Geral (Todos os Servidores)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="global"
                                        checked={!formData.global}
                                        onChange={() => setFormData({ ...formData, global: false })}
                                        className="form-radio"
                                    />
                                    <span>Específico (Selecionar Servidores)</span>
                                </label>
                            </div>

                            {!formData.global && (
                                <div className="max-h-60 overflow-y-auto border rounded bg-white p-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {allServers.map(servidor => (
                                            <label key={servidor.IDPK_SERV || servidor._id} className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-slate-100 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.servidores.includes(String(servidor.IDPK_SERV || servidor._id))}
                                                    onChange={() => toggleServerSelection(String(servidor.IDPK_SERV || servidor._id))}
                                                    className="form-checkbox"
                                                />
                                                <span className="truncate">{servidor.NOME_SERV}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {allServers.length === 0 && <p className="text-sm text-slate-500 p-2">Nenhum servidor ativo encontrado.</p>}
                                </div>
                            )}
                        </div>
                    )}
                </form>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-slate-200">
                <h2 className="text-lg font-bold mb-4">Eventos Cadastrados</h2>
                {loading ? <p>Carregando...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="p-3">Data</th>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3">Descrição</th>
                                    <th className="p-3 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.length === 0 ? (
                                    <tr><td colSpan="4" className="p-4 text-center text-slate-500">Nenhum evento cadastrado.</td></tr>
                                ) : (
                                    events.map(event => {
                                        let dataStr = new Date(event.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                                        if (event.dataFim) {
                                            dataStr += ` até ${new Date(event.dataFim).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`;
                                        }

                                        let escopo = 'Global';
                                        if (event.tipo === 'RECESSO' && event.global === false) {
                                            escopo = `${(event.servidores || []).length} selecionado(s)`;
                                        }

                                        return (
                                            <tr key={event._id} className="border-b hover:bg-slate-50">
                                                <td className="p-3">{dataStr}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${event.tipo === 'FERIADO' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{event.tipo}</span>
                                                </td>
                                                <td className="p-3">
                                                    {event.descricao} <span className="text-xs text-slate-400 ml-2">({escopo})</span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <button onClick={() => handleDelete(event._id)} className="text-red-500 hover:underline">Excluir</button>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CalendarioManagers;
