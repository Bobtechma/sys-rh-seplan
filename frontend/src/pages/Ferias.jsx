import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CITY_HALL_LOGO } from '../utils/assets';

const Ferias = () => {
    const [ferias, setFerias] = useState([]);
    const [servidores, setServidores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // active, pending, all
    const [stats, setStats] = useState({ active: 0, pending: 0, total: 0 });

    // Concessivo State
    const [concessivoList, setConcessivoList] = useState([]);
    const [showConcessivoModal, setShowConcessivoModal] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        servidorId: '',
        tipo: 'Férias',
        periodos: [{ inicio: '', fim: '' }],
        observacao: ''
    });
    const [openMenuId, setOpenMenuId] = useState(null);

    useEffect(() => {
        fetchFerias();
        fetchServidores();
        fetchConcessivo();
    }, []);

    const fetchConcessivo = async () => {
        try {
            const response = await axios.get('/api/servidores/concessivo');
            setConcessivoList(response.data || []);
        } catch (error) {
            console.error('Error fetching concessivo:', error);
        }
    };

    const fetchFerias = async () => {
        try {
            const response = await axios.get('/api/ferias');
            const data = response.data.ferias || [];
            setFerias(data);

            const now = new Date();
            setStats({
                // 'Em Férias' = approved AND currently within vacation period
                active: data.filter(f => {
                    const s = (f.STATUS_SIT || f.status || '').toUpperCase();
                    const isApproved = s === 'APROVADO' || s === 'DEFERIDO' || s === 'EM FÉRIAS' || s === 'EM_FERIAS' || s === 'FÉRIAS';
                    if (!isApproved) return false;
                    const inicio = new Date(f.INICIO_FERIAS_SIT || f.inicio);
                    const fim = new Date(f.FIM_FERIAS_SIT || f.fim);
                    return inicio <= now && fim >= now;
                }).length,
                // 'Pendentes' = any status meaning awaiting approval
                pending: data.filter(f => {
                    const s = (f.STATUS_SIT || f.status || '').toUpperCase();
                    return s === 'PENDENTE' || s === 'AGUARDANDO APROVAÇÃO' || s === 'AGUARDANDO' || s === 'EM ANÁLISE' || s === 'EMTRAMITAÇÃO';
                }).length,
                total: data.length
            });
        } catch (error) {
            console.error('Error fetching ferias:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchServidores = async () => {
        try {
            const res = await axios.get('/api/servidores?limit=1000');
            setServidores(res.data.servidores || []);
        } catch (error) {
            console.error('Error fetching servers:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/afastamentos', formData);
            alert('Solicitação criada com sucesso!');
            setFormData({ servidorId: '', tipo: 'Férias', periodos: [{ inicio: '', fim: '' }], observacao: '' });
            fetchFerias(); // Refresh list
        } catch (error) {
            console.error('Error creating request:', error);
            alert('Erro ao criar solicitação');
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

    const handleConcessivoSelection = (servidorId) => {
        setShowConcessivoModal(false);
        setFormData({ ...formData, servidorId, tipo: 'Férias' });
        setShowModal(true);
    };

    const updateStatus = async (id, newStatus) => {
        if (!window.confirm(`Tem certeza que deseja alterar o status para ${newStatus}?`)) return;
        try {
            await axios.put(`/api/afastamentos/${id}`, { status: newStatus });
            fetchFerias();
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Erro ao atualizar status');
        }
    };

    const generateVacationDocument = async (request, type) => {
        const s = request.servidor;
        const inicio = new Date(request.INICIO_FERIAS_SIT || request.inicio).toLocaleDateString('pt-BR');
        const fim = new Date(request.FIM_FERIAS_SIT || request.fim).toLocaleDateString('pt-BR');
        const today = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

        const logoSrc = CITY_HALL_LOGO;

        const typeTitle = type === 'AVISO' ? 'AVISO DE FÉRIAS' : 'RECESSO DE FÉRIAS';
        const docTitle = type === 'AVISO' ? 'Aviso de Férias' : 'Recesso de Férias';
        const tipoDoc  = type === 'AVISO' ? 'AVF' : 'RCF';

        // Fetch unique sequential document number from backend
        let docNumero = 'S/N';
        try {
            const numRes = await axios.post('/api/documentos/next-number', { tipo: tipoDoc });
            docNumero = numRes.data.numero; // e.g. '042/2026'
        } catch (e) {
            console.error('Could not fetch document number:', e);
        }
        // MODELO - 33 Layout
        const content = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: black; background: white; width: 210mm; min-height: 297mm; box-sizing: border-box; font-size: 11px;">
                    
                    <!-- Header Top Right -->
                    <div style="text-align: right; font-size: 10px; margin-bottom: 20px;">
                        Secretaria Municipal de Administração - SEMAD
                    </div>

                    <!-- Main Form Border -->
                    <div style="border: 2px solid black;">
                        
                        <!-- Title Row -->
                        <div style="display: flex; border-bottom: 1px solid black;">
                            <div style="flex: 1; text-align: center; font-weight: bold; background-color: #d9d9d9; padding: 5px; font-size: 14px; border-right: 1px solid black;">
                                ${typeTitle}
                            </div>
                            <div style="width: 100px; padding: 5px; text-align: center; font-weight: bold;">
                                Nº: ${docNumero}
                            </div>
                        </div>

                        <!-- Law Citation -->
                        <div style="border-bottom: 1px solid black; text-align: center; font-weight: bold; padding: 3px; font-size: 10px;">
                            Lei nº 4.615, de 19 de junho de 2006 - Estatuto do Servidor Público Municipal - Art. 186.
                        </div>

                        <!-- Personal Data -->
                        <div style="display: flex; border-bottom: 1px solid black;">
                            <div style="flex: 1; padding: 2px 5px; border-right: 1px solid black;">
                                <strong>Nome:</strong><br>
                                <span style="text-transform: uppercase;">${s.NOME_SERV}</span>
                            </div>
                            <div style="width: 150px; padding: 2px 5px;">
                                <strong>Matrícula nº:</strong><br>
                                ${s.MATRICULA_SERV}
                            </div>
                        </div>

                        <div style="border-bottom: 1px solid black; padding: 2px 5px;">
                            <strong>Órgão Municipal:</strong><br>
                            SECRETARIA MUNICIPAL DE PLANEJAMENTO E DESENVOLVIMENTO - SEPLAN
                        </div>

                        <div style="border-bottom: 1px solid black; padding: 2px 5px;">
                            <strong>Unidade Administrativa:</strong><br>
                            ${s.SETOR_LOTACAO_SERV || ''}
                        </div>

                        <!-- Cargo Row -->
                        <div style="display: flex; border-bottom: 1px solid black;">
                            <div style="flex: 2; padding: 2px 5px; border-right: 1px solid black;">
                                <strong>Cargo:</strong><br>
                                ${s.CARGO_EFETIVO_SERV || s.CARGO_COMISSIONADO_SERV || ''}
                            </div>
                            <div style="flex: 1; padding: 2px 5px; border-right: 1px solid black;">
                                <strong>Classe:</strong><br>
                                ${s.CLASSE_SERV || ''}
                            </div>
                            <div style="flex: 1; padding: 2px 5px; border-right: 1px solid black;">
                                <strong>Padrão:</strong><br>
                                ${s.PADRAO_SERV || ''}
                            </div>
                            <div style="flex: 1; padding: 2px 5px;">
                                <strong>Nível:</strong><br>
                                ${s.NIVEL_SERV || ''}
                            </div>
                        </div>

                        <!-- Funcao / Data Row -->
                        <div style="display: flex; border-bottom: 1px solid black;">
                            <div style="flex: 3; padding: 2px 5px; border-right: 1px solid black;">
                                <strong>Função:</strong><br>
                                ${s.FUNCAO_SP_SERV || ''}
                            </div>
                            <div style="flex: 1; padding: 2px 5px;">
                                <strong>Data Nomeação:</strong><br>
                                ${s.ADMISSAO_SERV ? new Date(s.ADMISSAO_SERV).toLocaleDateString('pt-BR') : ''}
                            </div>
                        </div>

                        <!-- Acquisition Period -->
                        <div style="background-color: #d9d9d9; text-align: center; font-weight: bold; border-bottom: 1px solid black; padding: 3px;">
                            ${type === 'AVISO' ? 'Férias Relativas ao Período Aquisitivo' : 'Recesso Relativo ao Período Aquisitivo'}
                        </div>
                        <div style="display: flex; border-bottom: 1px solid black;">
                            <div style="flex: 1; padding: 5px; border-right: 1px solid black;">
                                <strong>De:</strong> ${(() => {
                if (!s.ADMISSAO_SERV) return '';
                const adm = new Date(s.ADMISSAO_SERV);
                const feriasInicio = new Date(request.INICIO_FERIAS_SIT || request.inicio);
                // Calculate the start of the acquisition period relative to vacation start
                // Usually it's the anniversary of admission prior to vacation start
                let aquisitivoInicio = new Date(adm);
                aquisitivoInicio.setFullYear(feriasInicio.getFullYear());

                // Adjust if anniversary hasn't happened yet in the vacation year
                if (aquisitivoInicio > feriasInicio) {
                    aquisitivoInicio.setFullYear(feriasInicio.getFullYear() - 1);
                }
                // In many public sectors, period is exactly 1 year. 
                // Sometimes it logic is simpler: Acquisition closes on anniversary.
                // Let's assume standard 12 months before the anniversary that validates this vacation.
                // If vacation is 2024, and admission is 2020-05-01.
                // 2023-05-01 to 2024-04-30 is the period?

                // Let's go with: Start of period = Anniversary previous to vacation start
                // But wait, if I take vacation in Jan 2024, and my anniversary is May.
                // Valid period is May 2022 - May 2023? Or May 2023 - May 2024 (not yet vested)?
                // Typically you take vacation AFTER period is vested.
                // So if I take vacation in Jan 2024, logic:
                // Anniversary 2023-05-01 was the last one passed.
                // So period is 2022-05-01 to 2023-04-30.

                // Logic: Find last admission anniversary BEFORE vacation start date.
                // Start = (Last Anniversary - 1 year). End = (Last Anniversary - 1 day).

                let lastAnniversary = new Date(s.ADMISSAO_SERV);
                lastAnniversary.setFullYear(feriasInicio.getFullYear());
                if (lastAnniversary > feriasInicio) {
                    lastAnniversary.setFullYear(feriasInicio.getFullYear() - 1);
                }

                const endPeriod = new Date(lastAnniversary);
                endPeriod.setDate(endPeriod.getDate() - 1); // Day before anniversary

                const startPeriod = new Date(lastAnniversary);
                startPeriod.setFullYear(startPeriod.getFullYear() - 1);

                // Override if user manually edited or passed it (not supported yet), so calculating dynamic
                return startPeriod.toLocaleDateString('pt-BR');
            })()}
                            </div>
                            <div style="flex: 1; padding: 5px;">
                                <strong>A:</strong> ${(() => {
                if (!s.ADMISSAO_SERV) return '';
                const adm = new Date(s.ADMISSAO_SERV);
                const feriasInicio = new Date(request.INICIO_FERIAS_SIT || request.inicio);

                let lastAnniversary = new Date(s.ADMISSAO_SERV);
                lastAnniversary.setFullYear(feriasInicio.getFullYear());
                if (lastAnniversary > feriasInicio) {
                    lastAnniversary.setFullYear(feriasInicio.getFullYear() - 1);
                }

                const endPeriod = new Date(lastAnniversary);
                endPeriod.setDate(endPeriod.getDate() - 1);

                return endPeriod.toLocaleDateString('pt-BR');
            })()}
                            </div>
                        </div>

                        <!-- Period of Enjoyment -->
                        <div style="background-color: #d9d9d9; text-align: center; font-weight: bold; border-bottom: 1px solid black; padding: 3px;">
                            ${type === 'AVISO' ? 'Período de Gozo de Férias' : 'Período de Gozo do Recesso'}
                        </div>
                        <div style="display: flex; border-bottom: 1px solid black;">
                            <div style="flex: 1; padding: 5px; border-right: 1px solid black;">
                                <strong>De:</strong> ${inicio}
                            </div>
                            <div style="flex: 1; padding: 5px;">
                                <strong>A:</strong> ${fim}
                            </div>
                        </div>

                        <!-- Observations -->
                        <div style="height: 100px; padding: 5px; border-bottom: 1px solid black;">
                            <strong>Observações</strong>
                        </div>

                        <!-- Signatures Row 1 -->
                        <div style="display: flex; border-bottom: 1px solid black; height: 80px;">
                            <div style="flex: 1; padding: 5px; border-right: 1px solid black; position: relative;">
                                <strong>Visto (Área de RH):</strong>
                                <div style="position: absolute; bottom: 5px; left: 5px;">
                                    São Luís, _____/_____/_______
                                </div>
                            </div>
                            <div style="flex: 1; padding: 5px; position: relative;">
                                <strong>Servidor:</strong>
                                <div style="position: absolute; bottom: 5px; left: 5px;">
                                    São Luís, _____/_____/_______
                                </div>
                            </div>
                        </div>

                        <!-- Signatures Row 2 -->
                        <div style="height: 80px; padding: 5px; position: relative;">
                            <strong>Chefia Imediata:</strong>
                            <div style="position: absolute; bottom: 5px; left: 5px;">
                                São Luís, _____/_____/_______
                            </div>
                        </div>

                    </div>

                    <!-- Footer Details -->
                    <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 8px;">
                        <div>1ª VIA - SEMAD / 2ª VIA - GABINETE / 3ª VIA - SERVIDOR / 4ª VIA - RH / 5ª DOSSIÊ</div>
                        <div style="display: flex; gap: 20px;">
                            <span>CÓDIGO AVF</span>
                            <span>MODELO - 33</span>
                        </div>
                    </div>
                </div>
            `;

        const container = document.getElementById('vacation-doc-container');
        if (!container) return;
        container.innerHTML = content;

        // Load html2canvas and jspdf dynamically if not present
        const loadScript = (src) => new Promise((resolve) => {
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            document.head.appendChild(s);
        });

        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

        const html2canvas = window.html2canvas;
        const { jsPDF } = window.jspdf;

        const canvas = await html2canvas(container.firstElementChild, { scale: 2 });
        const imgData = canvas.toDataURL('image/jpeg', 1.0);

        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${docTitle}_${s.NOME_SERV}.pdf`);

        container.innerHTML = ''; // Cleanup
    };

    const filteredFerias = ferias.filter(item => {
        const s = (item.STATUS_SIT || item.status || '').toUpperCase();
        if (filter === 'active') {
            // Approved OR historical records (null status = historical from Access)
            const isHistorical = !item.STATUS_SIT && !item.status;
            const isApproved = s === 'APROVADO' || s === 'DEFERIDO' || s === 'EM FÉRIAS' || s === 'EM_FERIAS' || s === 'FÉRIAS' || isHistorical;
            if (!isApproved) return false;
            const now = new Date();
            const inicio = new Date(item.INICIO_FERIAS_SIT || item.inicio);
            const fim = new Date(item.FIM_FERIAS_SIT || item.fim);
            return inicio <= now && fim >= now;
        }
        if (filter === 'pending') return s === 'PENDENTE' || s === 'AGUARDANDO APROVAÇÃO' || s === 'AGUARDANDO' || s === 'EM ANÁLISE' || s === 'EMTRAMITAÇÃO';
        return true;
    });

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col gap-8">
            <div className="flex flex-col gap-6">
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gestão de Férias</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie solicitações e histórico de férias.</p>
                    </div>
                    <div className="flex gap-3">
                        {concessivoList.length > 0 && (
                            <button
                                onClick={() => setShowConcessivoModal(true)}
                                className="relative flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg font-semibold transition shadow-sm dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                            >
                                <span className="material-symbols-outlined">notifications_active</span>
                                Início Período Concessivo
                                <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-surface-dark">
                                    {concessivoList.length}
                                </span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition shadow-sm"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Nova Solicitação
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div
                        onClick={() => setFilter('active')}
                        className={`cursor-pointer bg-surface-light dark:bg-surface-dark rounded-xl p-5 border shadow-sm transition-all ${filter === 'active' ? 'ring-2 ring-primary border-primary' : 'border-border-light dark:border-border-dark'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                                <span className="material-symbols-outlined">beach_access</span>
                            </div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Em Férias Agora</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
                    </div>

                    <div
                        onClick={() => setFilter('pending')}
                        className={`cursor-pointer bg-surface-light dark:bg-surface-dark rounded-xl p-5 border shadow-sm transition-all ${filter === 'pending' ? 'ring-2 ring-yellow-500 border-yellow-500' : 'border-border-light dark:border-border-dark'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600">
                                <span className="material-symbols-outlined">pending_actions</span>
                            </div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Pendentes</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.pending}</p>
                    </div>

                    <div
                        onClick={() => setFilter('all')}
                        className={`cursor-pointer bg-surface-light dark:bg-surface-dark rounded-xl p-5 border shadow-sm transition-all ${filter === 'all' ? 'ring-2 ring-slate-500 border-slate-500' : 'border-border-light dark:border-border-dark'}`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined">list</span>
                            </div>
                            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Total de Registros</span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
                    </div>
                </div>

                {/* Content: Cards (Mobile) & Table (Desktop) */}
                <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark shadow-sm overflow-hidden">

                    {/* Mobile Card View */}
                    <div className="md:hidden">
                        {loading ? (
                            <div className="p-4 text-center text-slate-500">Carregando...</div>
                        ) : filteredFerias.length === 0 ? (
                            <div className="p-4 text-center text-slate-500">Nenhum registro encontrado.</div>
                        ) : (
                            <div className="divide-y divide-border-light dark:divide-border-dark">
                                {filteredFerias.map(item => {
                                    const inicio = new Date(item.INICIO_FERIAS_SIT || item.inicio).toLocaleDateString('pt-BR');
                                    const fim = new Date(item.FIM_FERIAS_SIT || item.fim).toLocaleDateString('pt-BR');
                                    const initials = (item.servidor?.NOME_SERV || '??').substring(0, 2).toUpperCase();
                                    const status = item.STATUS_SIT || item.status || null;
                        const isHistorical = !status;
                        const statusLabel = isHistorical ? 'Histórico' : status;

                                    const sUpper = (isHistorical ? 'FERIAS' : String(status)).toUpperCase();
                                    const isApproved = sUpper === 'APROVADO' || sUpper === 'DEFERIDO' || sUpper === 'EM FÉRIAS' || sUpper === 'EM_FERIAS' || sUpper === 'FÉRIAS' || sUpper === 'FERIAS' || isHistorical;
                                    const isPending = sUpper === 'PENDENTE' || sUpper === 'AGUARDANDO APROVAÇÃO' || sUpper === 'AGUARDANDO' || sUpper === 'EMTRAMITAÇÃO';
                                    const isCancelled = sUpper === 'REJEITADO' || sUpper === 'CANCELADO' || sUpper === 'ENCERRADO' || sUpper === 'ARQUIVADO';

                                    let statusClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                                    if (isApproved) statusClass = 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
                                    if (isPending) statusClass = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
                                    if (isCancelled) statusClass = 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';

                                    return (
                                        <div key={item._id} className="p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                                                            {item.servidor?.NOME_SERV || 'Desconhecido'}
                                                        </p>
                                                        <p className="text-xs text-slate-500">Mat: {item.servidor?.MATRICULA_SERV}</p>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                                                    {status}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-xs text-slate-500 dark:text-slate-400">Setor</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                                                        {item.servidor?.SETOR_LOTACAO_SERV || '-'}
                                                    </span>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                    <span className="block text-xs text-slate-500 dark:text-slate-400">Período</span>
                                                    <span className="font-medium text-slate-700 dark:text-slate-300 block">
                                                        {inicio} - {fim}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                {isApproved && (
                                                    <>
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setOpenMenuId(openMenuId === item._id ? null : item._id);
                                                                }}
                                                                className={`p-2 rounded-lg flex items-center gap-2 text-sm font-medium ${openMenuId === item._id ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">print</span>
                                                                Imprimir
                                                            </button>
                                                            {openMenuId === item._id && (
                                                                <>
                                                                    <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)}></div>
                                                                    <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                generateVacationDocument(item, 'AVISO');
                                                                                setOpenMenuId(null);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700"
                                                                        >
                                                                            Aviso de Férias
                                                                        </button>
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                generateVacationDocument(item, 'RECESSO');
                                                                                setOpenMenuId(null);
                                                                            }}
                                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                                                        >
                                                                            Recesso de Férias
                                                                        </button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => updateStatus(item._id, 'CANCELADO')}
                                                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                                                            Cancelar
                                                        </button>
                                                    </>
                                                )}
                                                {isPending && (
                                                    <div className="flex gap-2 w-full">
                                                        <button
                                                            onClick={() => updateStatus(item._id, 'APROVADO')}
                                                            className="flex-1 p-2 rounded-lg bg-green-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-sm shadow-green-200 dark:shadow-none"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">check</span>
                                                            Aprovar
                                                        </button>
                                                        <button
                                                            onClick={() => updateStatus(item._id, 'REJEITADO')}
                                                            className="flex-1 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium text-sm flex items-center justify-center gap-2 border border-red-200 dark:border-red-800"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                                            Rejeitar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-background-light dark:bg-background-dark">
                                <tr>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Servidor</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Setor</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Período</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-light dark:divide-border-dark">
                                {loading ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Carregando...</td></tr>
                                ) : filteredFerias.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Nenhum registro encontrado.</td></tr>
                                ) : (
                                    filteredFerias.map(item => {
                                        const inicio = new Date(item.INICIO_FERIAS_SIT || item.inicio).toLocaleDateString('pt-BR');
                                        const fim = new Date(item.FIM_FERIAS_SIT || item.fim).toLocaleDateString('pt-BR');
                                        const initials = (item.servidor?.NOME_SERV || '??').substring(0, 2).toUpperCase();
                                        const status = item.STATUS_SIT || item.status || null;
                        const isHistorical = !status;
                        const statusLabel = isHistorical ? 'Histórico' : status;

                                        const sUpper = (isHistorical ? 'FERIAS' : String(status)).toUpperCase();
                                        const isApproved = sUpper === 'APROVADO' || sUpper === 'DEFERIDO' || sUpper === 'EM FÉRIAS' || sUpper === 'EM_FERIAS' || sUpper === 'FÉRIAS' || sUpper === 'FERIAS' || isHistorical;
                                        const isPending = sUpper === 'PENDENTE' || sUpper === 'AGUARDANDO APROVAÇÃO' || sUpper === 'AGUARDANDO' || sUpper === 'EMTRAMITAÇÃO';
                                        const isCancelled = sUpper === 'REJEITADO' || sUpper === 'CANCELADO' || sUpper === 'ENCERRADO' || sUpper === 'ARQUIVADO';

                                        let statusClass = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                                        if (isApproved) statusClass = 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300';
                                        if (isPending) statusClass = 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
                                        if (isCancelled) statusClass = 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';

                                        return (
                                            <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">{initials}</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.servidor?.NOME_SERV || 'Desconhecido'}</span>
                                                            <span className="text-xs text-slate-500">Mat: {item.servidor?.MATRICULA_SERV}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{item.servidor?.SETOR_LOTACAO_SERV}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{inicio} - {fim}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>{statusLabel || status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {isApproved && (
                                                            <>
                                                                <div className="relative">
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setOpenMenuId(openMenuId === item._id ? null : item._id);
                                                                        }}
                                                                        className={`p-1 rounded ${openMenuId === item._id ? 'bg-slate-100 dark:bg-slate-700 text-primary' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                                                        title="Imprimir Documento"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[20px]">print</span>
                                                                    </button>
                                                                    {openMenuId === item._id && (
                                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 block z-50">
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    generateVacationDocument(item, 'AVISO');
                                                                                    setOpenMenuId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 first:rounded-t-lg"
                                                                            >
                                                                                Aviso de Férias
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    generateVacationDocument(item, 'RECESSO');
                                                                                    setOpenMenuId(null);
                                                                                }}
                                                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 last:rounded-b-lg"
                                                                            >
                                                                                Recesso de Férias
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {/* Overlay to close menu when clicking outside */
                                                                        openMenuId === item._id && (
                                                                            <div
                                                                                className="fixed inset-0 z-40"
                                                                                onClick={() => setOpenMenuId(null)}
                                                                            ></div>
                                                                        )}
                                                                </div>
                                                                <button onClick={() => updateStatus(item._id, 'CANCELADO')} className="p-1 text-orange-600 hover:bg-orange-50 rounded" title="Cancelar Férias">
                                                                    <span className="material-symbols-outlined text-[20px]">cancel</span>
                                                                </button>
                                                            </>
                                                        )}
                                                        {isPending ? (
                                                            <>
                                                                <button onClick={() => updateStatus(item._id, 'APROVADO')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Aprovar"><span className="material-symbols-outlined text-[20px]">check</span></button>
                                                                <button onClick={() => updateStatus(item._id, 'REJEITADO')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Rejeitar"><span className="material-symbols-outlined text-[20px]">close</span></button>
                                                            </>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Hidden Container for PDF Generation */}
            <div id="vacation-doc-container" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}></div>

            {/* Concessivo Modal */}
            {showConcessivoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Servidores em Período Concessivo</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Servidores completando período aquisitivo nos próximos 30 dias.</p>
                            </div>
                            <button onClick={() => setShowConcessivoModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Servidor</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Admissão</th>
                                        <th className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Aquisitivo Completa em</th>
                                        <th className="px-6 py-3 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {concessivoList.map(s => {
                                        const admissao = new Date(s.ADMISSAO_SERV).toLocaleDateString('pt-BR');
                                        const nextDate = new Date();
                                        let targetDate = new Date(s.ADMISSAO_SERV);
                                        targetDate.setFullYear(nextDate.getFullYear());
                                        if (targetDate < new Date()) {
                                            targetDate.setFullYear(nextDate.getFullYear() + 1);
                                        }
                                        const completaEm = targetDate.toLocaleDateString('pt-BR');

                                        return (
                                            <tr key={s._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center font-bold text-purple-600 dark:text-purple-300 text-xs">
                                                            {(s.NOME_SERV || '??').substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-900 dark:text-white">{s.NOME_SERV}</div>
                                                            <div className="text-xs text-slate-500">Mat: {s.MATRICULA_SERV}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{admissao}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-purple-600 dark:text-purple-400">{completaEm}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleConcessivoSelection(s._id)}
                                                        className="text-sm font-medium text-primary hover:text-blue-700 dark:hover:text-blue-400"
                                                    >
                                                        Registrar Férias
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Nova Solicitação</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Servidor</label>
                                <select
                                    className="form-select w-full"
                                    value={formData.servidorId}
                                    onChange={e => setFormData({ ...formData, servidorId: e.target.value })}
                                    required
                                >
                                    <option value="">Selecione um servidor...</option>
                                    {servidores.map(s => (
                                        <option key={s._id} value={s._id}>{s.NOME_SERV}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Períodos de Férias (Máx: 3)
                                </label>
                                {formData.periodos.map((periodo, index) => (
                                    <div key={index} className="grid grid-cols-2 gap-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700 relative group">
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Início {index + 1}</label>
                                            <input
                                                type="date"
                                                className="form-input w-full text-sm"
                                                value={periodo.inicio}
                                                onChange={e => updatePeriodo(index, 'inicio', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Fim {index + 1}</label>
                                            <input
                                                type="date"
                                                className="form-input w-full text-sm"
                                                value={periodo.fim}
                                                onChange={e => updatePeriodo(index, 'fim', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {index > 0 && (
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
                                {formData.periodos.length < 3 && (
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
                                    className="form-textarea w-full"
                                    rows="3"
                                    value={formData.observacao}
                                    onChange={e => setFormData({ ...formData, observacao: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium">Salvar Solicitação</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ferias;
