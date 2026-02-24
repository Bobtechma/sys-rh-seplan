import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { CITY_HALL_LOGO } from '../utils/assets';

const getVinculoMacro = (s) => {
    const vinculoTitle = String(s.VINCULO_SERV || '').toUpperCase();
    if (s.SERVICO_PRESTADO_SERV === 'SIM' || vinculoTitle === 'SERVIÇOS PRESTADOS' || vinculoTitle === 'SERVICOS PRESTADOS') return 'SERVIÇOS PRESTADOS';
    if (vinculoTitle === 'EFETIVO' || s.CARGO_EFETIVO_SERV) return 'EFETIVO';
    if (vinculoTitle === 'COMISSIONADO' || s.CARGO_COMISSIONADO_SERV) return 'COMISSIONADO';
    if (vinculoTitle === 'CONTRATADO') return 'CONTRATADO';
    return vinculoTitle;
};

const Relatorios = () => {
    const [selectedReport, setSelectedReport] = useState('dossie');
    const [serverSearch, setServerSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedServer, setSelectedServer] = useState(null);
    const [referenceMonth, setReferenceMonth] = useState('');
    const [loading, setLoading] = useState(false);
    const [isBulkGenerating, setIsBulkGenerating] = useState(false);
    const [bulkGenerateCount, setBulkGenerateCountLocal] = useState({ current: 0, total: 0 });

    // Filters State
    const [filterNome, setFilterNome] = useState('');
    const [filterMatricula, setFilterMatricula] = useState('');
    const [filterSetor, setFilterSetor] = useState('');
    const [filterVinculo, setFilterVinculo] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterCargo, setFilterCargo] = useState('');
    const [filterFeriasStatus, setFilterFeriasStatus] = useState('');
    const [filterFeriasPeriodoInicio, setFilterFeriasPeriodoInicio] = useState('');
    const [filterFeriasPeriodoFim, setFilterFeriasPeriodoFim] = useState('');
    const [filterFeriasAno, setFilterFeriasAno] = useState(String(new Date().getFullYear()));

    const location = useLocation();

    useEffect(() => {
        // Set default month to current month
        const now = new Date();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        setReferenceMonth(`${now.getFullYear()}-${month}`);

        // Check for report query param using useLocation
        const params = new URLSearchParams(location.search);
        const reportParam = params.get('report');
        if (reportParam) {
            setSelectedReport(reportParam);
        }

        fetchDynamicOptions();
    }, [location.search]);

    // Dynamic Filter Options
    const [setoresOpt, setSetoresOpt] = useState([]);
    const [cargosOpt, setCargosOpt] = useState([]);

    const fetchDynamicOptions = async () => {
        try {
            const token = localStorage.getItem('token');
            const [setoresRes, cargosRes] = await Promise.all([
                axios.get('/api/servidores/setores', { headers: { 'x-auth-token': token } }),
                axios.get('/api/servidores/cargos', { headers: { 'x-auth-token': token } })
            ]);
            setSetoresOpt(setoresRes.data || []);
            setCargosOpt(cargosRes.data || []);
        } catch (error) {
            console.error('Error loading dynamic options:', error);
        }
    };

    const handleSearch = async (query) => {
        setServerSearch(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`/api/servidores?search=${query}&limit=5`, {
                headers: { 'x-auth-token': token }
            });
            setSearchResults(res.data.servidores || []);
        } catch (error) {
            console.error('Error searching servers:', error);
        }
    };

    const selectServer = (server) => {
        setSelectedServer(server);
        setServerSearch('');
        setSearchResults([]);
    };

    const getReportConfig = (type) => {
        switch (type) {
            case 'dossie': return { icon: 'person_book', color: 'blue', title: 'Dossiê do Servidor', desc: 'Relatório completo com dados pessoais, funcionais e anexos.' };
            case 'servidores': return { icon: 'groups', color: 'purple', title: 'Lista de Servidores', desc: 'Listagem geral de todos os servidores cadastrados.' };
            case 'ferias': return { icon: 'beach_access', color: 'orange', title: 'Relatório de Férias', desc: 'Histórico de solicitações de férias aprovadas e pendentes de aprovação.' };
            case 'afastamentos': return { icon: 'medical_services', color: 'red', title: 'Relatório de Afastamentos', desc: 'Histórico de licenças médicas e outros.' };
            case 'frequencia': return { icon: 'calendar_month', color: 'teal', title: 'Frequência Mensal', desc: 'Folha de ponto mensal com marcações.' };
            case 'aniversariantes': return { icon: 'cake', color: 'purple', title: 'Aniversariantes', desc: 'Lista de servidores que fazem aniversário no mês.' };
            default: return {};
        }
    };

    const generatePDF = async (mode = 'single') => {
        setLoading(true);
        if (mode === 'all') {
            setIsBulkGenerating(true);
            setBulkGenerateCountLocal({ current: 0, total: '...' });

            // Critical Yield: Give React time to paint the massive SVG overlay BEFORE freezing the network/CPU
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        // 1. Create a Clean, Hidden Iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.width = '210mm';
        iframe.style.left = '-10000px';
        iframe.style.top = '0';
        document.body.appendChild(iframe);

        try {
            const token = localStorage.getItem('token');

            // Base64 Logo - Provided by user to fix 404/CORS issues definitively
            const logoDataUri = CITY_HALL_LOGO;
            const imgTag = `<img src="${logoDataUri}" style="height: 4rem; width: auto; object-fit: contain;">`;

            // 2. Prepare HTML Content Element (in memory, styles inline)
            const bodyContent = document.createElement('div');
            bodyContent.style.fontFamily = 'Arial, sans-serif';
            bodyContent.style.color = '#000000';
            bodyContent.style.background = '#ffffff';
            bodyContent.style.width = '100%';

            // Initialize Iframe Document Early (Fix for ReferenceError in bulk generation)
            const doc = iframe.contentWindow.document;
            doc.open();
            doc.write(`
                <html>
                    <head>
                        <style>
                            @page { size: A4; margin: 10mm; }
                            body { margin: 0; font-family: 'Helvetica', 'Arial', sans-serif; -webkit-print-color-adjust: exact; }
                            .no-break { page-break-inside: avoid; break-inside: avoid; }
                            table { width: 100%; border-collapse: collapse; font-size: 0.8rem; page-break-inside: auto; }
                            tr { page-break-inside: avoid; break-inside: avoid; page-break-after: auto; }
                            td { padding: 4px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                            h1, h2, h3 { page-break-after: avoid; }
                            .observation-item { page-break-inside: avoid; break-inside: avoid; border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
                            .section-container { margin-bottom: 1.5rem; page-break-inside: auto; }
                        </style>
                    </head>
                    <body></body>
                </html>
            `);
            doc.close();
            doc.body.appendChild(bodyContent);

            // Common Header
            const headerHtml = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 1.5rem;">
                ${imgTag}
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: bold; color: #0f172a; margin: 0;">Prefeitura de São Luís</h1>
                    <p style="font-size: 0.875rem; color: #64748b; margin: 0;">Secretaria Municipal de Planejamento e Desenvolvimento - SEPLAN</p>
                    <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
            </div>
            `;

            let contentHtml = '';
            let isLandscape = false;
            let filename = `Relatorio_${selectedReport}_${Date.now()}.pdf`;

            if (selectedReport === 'dossie') {
                if (!selectedServer) throw new Error('Selecione um servidor.');
                const res = await axios.get(`/api/servidores/${selectedServer.IDPK_SERV || selectedServer._id}`, { headers: { 'x-auth-token': token } });
                const s = res.data.servidor;
                filename = `Dossie_${s.NOME_SERV.replace(/\s+/g, '_')}.pdf`;

                // Attachments
                let attachmentsHtml = '<p style="font-size: 0.875rem; color: #64748b; font-style: italic;">Nenhum anexo encontrado.</p>';
                if (s.ANEXOS && s.ANEXOS.length > 0) {
                    attachmentsHtml = '<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem;">';
                    s.ANEXOS.forEach(anexo => {
                        if (anexo.tipo.startsWith('image/') && anexo.conteudo) {
                            attachmentsHtml += `
                            <div style="border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem; page-break-inside: avoid;">
                                <p style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${anexo.nome}</p>
                                <img src="${anexo.conteudo}" style="width: 100%; height: auto; border-radius: 0.25rem; object-fit: contain; max-height: 16rem;">
                            </div>`;
                        } else {
                            attachmentsHtml += `
                            <div style="border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem; display: flex; align-items: center; gap: 0.5rem; page-break-inside: avoid;">
                                <span style="font-size: 1.5rem; color: #94a3b8;">📄</span>
                                <div style="overflow: hidden;">
                                    <p style="font-weight: 500; color: #0f172a; margin: 0;">${anexo.nome}</p>
                                    <p style="font-size: 0.75rem; color: #64748b; margin: 0;">Anexo</p>
                                </div>
                            </div>`;
                        }
                    });
                    attachmentsHtml += '</div>';
                }

                // Dados Pessoais e Documentos
                contentHtml = `
                    <div style="page-break-after: avoid;">
                        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #0d7ff2;">Dossiê do Servidor</h2>
                    </div>

                <div class="section-container">
                    <h2 style="font-size: 1.125rem; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">Dados Pessoais e Documentação</h2>
                    <table>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; width: 25%; font-weight: bold; color: #64748b;">Nome Completo:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.NOME_SERV || '-'}</td>
                            <td class="font-bold text-slate-500" style="width: 25%;">CPF:</td>
                            <td>${s.CPF_SERV || '-'}</td>
                        </tr>
                        <tr>
                            <td class="font-bold text-slate-500">Data de Nascimento:</td>
                            <td>${s.NASCIMENTO_SERV ? new Date(s.NASCIMENTO_SERV).toLocaleDateString('pt-BR') : '-'}</td>
                            <td class="font-bold text-slate-500">RG:</td>
                            <td>${s.RG_SERV || '-'} ${s.OE_RG_SERV ? `(${s.OE_RG_SERV})` : ''}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Sexo:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.SEXO_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Estado Civil:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.ESTADO_CIVIL_SERV || '-'}</td>
                        </tr>
                         <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Pai:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.NOME_PAI_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Mãe:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.NOME_MAE_SERV || '-'}</td>
                        </tr>
                         <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Título Eleitoral:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.TITULO_ELEITORAL_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Zona/Seção:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.ZONA_SERV || '-'} / ${s.SECAO_SERV || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">PIS/PASEP:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.PISPASEP_SERV || '-'}</td>
                             <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Tipo Sanguíneo:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.TIPO_SANGUINEO_SERV || ''} ${s.FATOR_SERV || ''}</td>
                        </tr>
                    </table>
                </div>

                <div class="section-container">
                    <h2 style="font-size: 1.125rem; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">Endereço e Contato</h2>
                    <table>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; width: 25%; font-weight: bold; color: #64748b;">Endereço:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;" colspan="3">${s.ENDERECO_SERV || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Bairro:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.BAIRRO_SERV || '-'}</td>
                             <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">CEP:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.CEP_SERV || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Cidade/UF:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.CIDADE_SERV || '-'} / ${s.ESTADO_SERV || '-'}</td>
                             <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Email:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.EMAIL_SERV || '-'}</td>
                        </tr>
                         <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Telefones:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;" colspan="3">${s.FONES_SERV || '-'} ${s.FONES_TRAB_SERV ? `/ Trab: ${s.FONES_TRAB_SERV}` : ''}</td>
                        </tr>
                    </table>
                </div>

                <div class="section-container">
                    <h2 style="font-size: 1.125rem; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 0.5rem;">Dados Funcionais e Bancários</h2>
                    <table>
                         <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; width: 25%; font-weight: bold; color: #64748b;">Matrícula:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.MATRICULA_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; width: 25%; font-weight: bold; color: #64748b;">Admissão:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.ADMISSAO_SERV ? new Date(s.ADMISSAO_SERV).toLocaleDateString('pt-BR') : '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Lotação:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.SETOR_LOTACAO_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Vínculo:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.VINCULO_SERV || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Cargo Efetivo:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.CARGO_EFETIVO_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Cargo Comissionado:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.CARGO_COMISSIONADO_SERV || '-'}</td>
                        </tr>
                         <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Função:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.FUNCAO_SP_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Símbolo:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.SIMBOLO_SERV || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Servidor Cedido?:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.CEDIDO_SERV === 'true' || s.CEDIDO_SERV === 'SIM' ? 'Sim' : 'Não'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Órgão de Origem:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.ORG_ORIGEM_SERV || '-'}</td>
                        </tr>
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Banco:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.BANCO_SERV || '-'}</td>
                             <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Ag/Conta:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">Ag: ${s.AGENCIA_SERV || '-'} / CC: ${s.CONTACORRENTE_SERV || '-'}</td>
                        </tr>
                         <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Escolaridade:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.ESCOLARIDADE_SERV || '-'}</td>
                             <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: #64748b;">Curso:</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${s.CURSO_SERV || '-'}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h2 style="font-size: 1.125rem; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem;">Observações</h2>
                    
                    ${(s.OBS_SERV || s.OBS_DADOS_PESSOAIS_SERV || s.OBSATV_SERV) ? `
                        <div class="no-break" style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 1rem;">
                            ${s.OBS_DADOS_PESSOAIS_SERV ? `<p style="margin-bottom: 0.5rem; font-size: 0.8rem; color: #92400e;"><strong>Dados Pessoais:</strong> ${s.OBS_DADOS_PESSOAIS_SERV}</p>` : ''}
                            ${s.OBSATV_SERV ? `<p style="margin-bottom: 0.5rem; font-size: 0.8rem; color: #92400e;"><strong>Atividades:</strong> ${s.OBSATV_SERV}</p>` : ''}
                            ${s.OBS_SERV ? `<p style="margin: 0; font-size: 0.8rem; color: #92400e;"><strong>Geral:</strong> ${s.OBS_SERV}</p>` : ''}
                        </div>
                    ` : ''}

                    <h3 style="font-size: 0.9rem; font-weight: bold; color: #64748b; margin-bottom: 0.5rem;">Histórico</h3>
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem;">
                        ${(s.OBSERVACOES && s.OBSERVACOES.length > 0) ? s.OBSERVACOES.map(obs => `
                            <div class="observation-item">
                                <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: #64748b; margin-bottom: 0.2rem;">
                                    <span>${new Date(obs.data).toLocaleDateString('pt-BR')} ${new Date(obs.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>Por: ${obs.autor || 'Sistema'} | ${obs.categoria || 'Geral'}</span>
                                </div>
                                <p style="font-size: 0.8rem; color: #334155; white-space: pre-wrap; margin: 0;">${obs.conteudo}</p>
                            </div>
                        `).join('') : '<p style="font-size: 0.8rem; color: #64748b; font-style: italic; padding: 0.5rem;">Nenhum histórico de observações registrado.</p>'}
                    </div>
                </div>

                <div>
                    <h2 style="font-size: 1.125rem; font-weight: bold; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-bottom: 1rem;">Anexos</h2>
                    ${attachmentsHtml}
                </div>
            `;
                bodyContent.innerHTML = headerHtml + contentHtml;

            } else if (selectedReport === 'frequencia') {
                if (!referenceMonth) throw new Error('Selecione o mês de referência.');

                // Helper to generate HTML for a single server frequency page
                const generateFrequencyPage = (s, refMonth, baseImgTag, calendarEvents = [], absences = []) => {
                    if (!refMonth) return '';
                    const [year, month] = refMonth.split('-');
                    const daysInMonth = new Date(year, month, 0).getDate();
                    const monthName = new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' });

                    let rows = '';
                    for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(year, month - 1, day);
                        const dayOfWeek = date.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        const dayName = date.toLocaleString('pt-BR', { weekday: 'long' }).toUpperCase();

                        // Normalize date for comparison
                        date.setUTCHours(0, 0, 0, 0);

                        // 1. Check for Calendar Event
                        const event = calendarEvents.find(e => {
                            const eDateStart = new Date(e.data);
                            eDateStart.setUTCHours(0, 0, 0, 0);

                            let eDateEnd = new Date(eDateStart);
                            if (e.dataFim) {
                                eDateEnd = new Date(e.dataFim);
                                eDateEnd.setUTCHours(0, 0, 0, 0);
                            }

                            // Check if current day falls within [start, end]
                            const isWithinDateRange = date.getTime() >= eDateStart.getTime() && date.getTime() <= eDateEnd.getTime();

                            if (isWithinDateRange) {
                                // If it's a specific event, check if the server is in the list
                                if (e.global === false && e.servidores) {
                                    const serverIdStr = String(s.IDPK_SERV || s._id);
                                    if (!e.servidores.includes(serverIdStr)) {
                                        return false; // Skip this event for this server
                                    }
                                }
                                return true;
                            }
                            return false;
                        });

                        // 2. Check for Vacation/Absence
                        // We check if the current date falls within any absence period for this server
                        // Note: dates in DB are typically ISO strings or Date objects.
                        const absence = absences.find(a => {
                            // Ensure the absence belongs to this server
                            if (String(a.IDFK_SERV) !== String(s.IDPK_SERV || s._id)) return false;

                            const start = new Date(a.INICIO_FERIAS_SIT);
                            const end = new Date(a.FIM_FERIAS_SIT);
                            start.setUTCHours(0, 0, 0, 0);
                            end.setUTCHours(0, 0, 0, 0);

                            return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
                        });

                        const sTurno = (s.TURNO_SERV || 'Integral').toLowerCase();
                        let sig1 = '', sig2 = '', sig3 = '', sig4 = '';
                        let rowContent = '';

                        const bgCheck = (isWeekend || event || absence) ? 'background-color: #e5e7eb;' : '';

                        if (event) {
                            // Holiday/Recess/Ponto Facultativo Logic
                            rowContent = `<td colspan="4" style="border: 1px solid black; padding: 2px; text-align: center; font-size: 10px; font-weight: bold; ${bgCheck}">${event.tipo} - ${event.descricao}</td>`;
                        } else if (absence) {
                            // Vacation Logic
                            let label = 'AFASTAMENTO';
                            if (absence.ASSUNTO_SIT && absence.ASSUNTO_SIT.toUpperCase().includes('FÉRIAS')) {
                                label = 'FÉRIAS';
                            } else if (absence.ASSUNTO_SIT) {
                                label = absence.ASSUNTO_SIT.toUpperCase();
                            }
                            rowContent = `<td colspan="4" style="border: 1px solid black; padding: 2px; text-align: center; font-size: 10px; font-weight: bold; ${bgCheck}">${label}</td>`;
                        } else if (isWeekend) {
                            rowContent = `<td colspan="4" style="border: 1px solid black; padding: 2px; text-align: center; font-size: 10px; ${bgCheck}">${dayName}</td>`;
                        } else {
                            // Regular Day Logic
                            // 1. Turno Logic
                            if (sTurno === 'matutino') {
                                sig3 = 'XXXXXXXX';
                                sig4 = 'XXXXXXXX';
                            } else if (sTurno === 'vespertino') {
                                sig1 = 'XXXXXXXX';
                                sig2 = 'XXXXXXXX';
                            }

                            // 2. Friday Logic (Sexta-feira is day 5)
                            // If it's Friday AND user DOES NOT work Friday afternoon
                            if (dayOfWeek === 5 && !s.TRABALHA_SEXTA_TARDE) {
                                sig3 = '-----';
                                sig4 = '-----';
                            }

                            rowContent = `
                                <td style="border: 1px solid black; padding: 2px; width: 20%; text-align: center; vertical-align: middle;">${sig1}</td>
                                <td style="border: 1px solid black; padding: 2px; width: 20%; text-align: center; vertical-align: middle;">${sig2}</td>
                                <td style="border: 1px solid black; padding: 2px; width: 20%; text-align: center; vertical-align: middle;">${sig3}</td>
                                <td style="border: 1px solid black; padding: 2px; width: 20%; text-align: center; vertical-align: middle;">${sig4}</td>
                            `;
                        }

                        rows += `
            <tr>
                <td style="border: 1px solid black; padding: 2px; text-align: center; height: 1.5rem; font-size: 10px; ${bgCheck}">${day}</td>
                ${rowContent}
            </tr>`;
                    }

                    const freqImgTag = baseImgTag.replace(/4rem/g, '2.5rem');

                    return `
        <div class="frequency-page" style="font-family: Arial, sans-serif; font-size: 11px; color: black; padding: 10mm; background: white; width: 100%; box-sizing: border-box; overflow: hidden;">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; border-bottom: 2px solid black; padding-bottom: 0.5rem;">
                    ${freqImgTag}
                    <div style="flex: 1; text-align: center; line-height: 1;">
                    <p style="font-weight: bold; text-transform: uppercase; margin:0; font-size: 10px;">Prefeitura Municipal de São Luís - Maranhão</p>
                    <p style="text-transform: uppercase; margin:0; font-size: 10px;">Secretaria Municipal de Planejamento e Desenvolvimento - SEPLAN</p>
                    <p style="margin:0; font-size: 10px;">Superintendência de Área Administrativa Interna - SADIN</p>
                    <p style="margin:0; font-size: 10px;">Recursos Humanos - RH</p>
                    </div>
            </div>
            
            <div style="text-align: center; font-weight: bold; border-bottom: 2px solid black; margin-bottom: 0.5rem; padding-bottom: 0.25rem; text-transform: uppercase; font-size: 10px;">
                    ÓRGÃO MUNICIPAL: Secretaria Municipal de Planejamento e Desenvolvimento - SEPLAN<br>
                    SETOR: ${s.SETOR_LOTACAO_SERV || 'NÃO INFORMADO'}
            </div>

            <div style="display: flex; border: 1px solid black; margin-bottom: 2px;">
                <div style="width: 50%; border-right: 1px solid black; padding: 2px; background-color: #f3f4f6; font-weight: bold; font-size: 10px;">Registro Individual de Frequência</div>
                <div style="width: 25%; border-right: 1px solid black; padding: 2px; font-size: 10px;"><span style="font-weight: bold;">Mês:</span> ${monthName.toUpperCase()}</div>
                <div style="width: 25%; padding: 2px; font-size: 10px;"><span style="font-weight: bold;">Ano:</span> ${year}</div>
            </div>

            <div style="border: 1px solid black; margin-bottom: 2px; padding: 2px; font-size: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                    <span><span style="font-weight: bold;">NOME:</span> ${s.NOME_SERV}</span>
                    <span><span style="font-weight: bold;">MATRÍCULA:</span> ${s.MATRICULA_SERV}</span>
                    </div>
            </div>

            <div style="border: 1px solid black; margin-bottom: 5px; padding: 2px; font-size: 10px;">
                    <div style="display: flex; justify-content: space-between;">
                    <span style="width: 50%;"><span style="font-weight: bold;">CARGO EFETIVO:</span> ${s.CARGO_EFETIVO_SERV || ''}</span>
                    <span style="width: 50%;"><span style="font-weight: bold;">FUNÇÃO/SERVIÇO:</span> ${s.CARGO_COMISSIONADO_SERV || ''}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                    <span style="width: 100%;"><span style="font-weight: bold;">SETOR:</span> ${s.SETOR_LOTACAO_SERV || ''}</span>
                    </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; border: 1px solid black; font-size: 10px; margin-bottom: 5px;">
                <thead>
                    <tr>
                        <th style="border: 1px solid black; padding: 1px; width: 2rem;">DIA</th>
                        <th style="border: 1px solid black; padding: 1px;" colspan="2">MANHÃ</th>
                        <th style="border: 1px solid black; padding: 1px;" colspan="2">TARDE</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>

            <div style="border: 1px solid black; padding: 5px; display: flex; justify-content: space-between; height: 50px; align-items: flex-end; font-size: 10px;">
                    <div style="width: 50%; border-right: 1px solid black; padding-right: 5px;">
                    <div style="font-weight: bold; margin-bottom: 10px;">Visto (Coordenação):</div>
                    <div>São Luís, _____ / _____ / ________</div>
                    </div>
                    <div style="width: 50%; padding-left: 5px;">
                    <div style="font-weight: bold; margin-bottom: 10px;">Chefia Imediata:</div>
                    <div>São Luís, _____ / _____ / ________</div>
                    </div>
            </div>
        </div>`;
                };

                if (mode === 'all') {
                    // Optimized Bulk Generation (Iterative)
                    const res = await axios.get('/api/servidores', {
                        params: { limit: 10000, sort: 'NOME_SERV:asc', status: 'ativo', cedido: 'false' },
                        headers: { 'x-auth-token': token }
                    });
                    let allServers = res.data.servidores || [];

                    // Fetch Calendar Events
                    const calendarRes = await axios.get('/api/calendario', { headers: { 'x-auth-token': token } });
                    const calendarEvents = calendarRes.data || [];

                    // Fetch Absences (Ideally strictly for the month, but fetching all recent is safer if filter is tricky)
                    const absencesRes = await axios.get('/api/afastamentos', {
                        params: { limit: 5000 },
                        headers: { 'x-auth-token': token }
                    });
                    const allAbsences = absencesRes.data.afastamentos || [];

                    // Apply Filters
                    if (filterSetor) allServers = allServers.filter(s => s.SETOR_LOTACAO_SERV === filterSetor);
                    if (filterVinculo) allServers = allServers.filter(s => getVinculoMacro(s) === filterVinculo);
                    if (filterCargo) {
                        const term = filterCargo.toLowerCase();
                        allServers = allServers.filter(s =>
                            (s.CARGO_EFETIVO_SERV && s.CARGO_EFETIVO_SERV.toLowerCase().includes(term)) ||
                            (s.CARGO_COMISSIONADO_SERV && s.CARGO_COMISSIONADO_SERV.toLowerCase().includes(term)) ||
                            (s.FUNCAO_SP_SERV && s.FUNCAO_SP_SERV.toLowerCase().includes(term))
                        );
                    }
                    if (filterNome) allServers = allServers.filter(s => s.NOME_SERV.toLowerCase().includes(filterNome.toLowerCase()));

                    if (allServers.length === 0) throw new Error('Nenhum servidor encontrado com os filtros selecionados.');

                    // Load libraries sequentially
                    const loadScript = (src) => new Promise((resolve, reject) => {
                        if (doc.querySelector(`script[src="${src}"]`)) return resolve();
                        const scriptTag = doc.createElement('script');
                        scriptTag.src = src;
                        scriptTag.onload = resolve;
                        scriptTag.onerror = reject;
                        doc.head.appendChild(scriptTag);
                    });

                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');

                    const html2canvas = iframe.contentWindow.html2canvas;
                    const { jsPDF } = iframe.contentWindow.jspdf;

                    if (!html2canvas || !jsPDF) throw new Error('Falha ao carregar bibliotecas de PDF.');

                    const docPDF = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
                    setBulkGenerateCountLocal({ current: 0, total: allServers.length });

                    for (let i = 0; i < allServers.length; i++) {
                        const s = allServers[i];

                        setBulkGenerateCountLocal({ current: i + 1, total: allServers.length });

                        // Give main thread breathing room
                        await new Promise(r => setTimeout(r, 50));

                        const pageHtml = generateFrequencyPage(s, referenceMonth, imgTag, calendarEvents, allAbsences);
                        bodyContent.innerHTML = pageHtml;

                        const images = bodyContent.getElementsByTagName('img');
                        if (images.length > 0) {
                            await Promise.all(Array.from(images).map(img => {
                                if (img.complete) return Promise.resolve();
                                return new Promise(resolve => {
                                    img.onload = resolve;
                                    img.onerror = resolve;
                                    setTimeout(resolve, 500);
                                });
                            }));
                        }

                        await new Promise(r => setTimeout(r, 50));

                        const canvas = await html2canvas(bodyContent, { scale: 2, useCORS: true, logging: false });
                        const imgData = canvas.toDataURL('image/jpeg', 0.95);
                        const imgProps = docPDF.getImageProperties(imgData);
                        const pdfWidth = docPDF.internal.pageSize.getWidth();
                        const pdfH = (imgProps.height * pdfWidth) / imgProps.width;

                        if (i > 0) docPDF.addPage();
                        docPDF.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfH);

                        bodyContent.innerHTML = '';
                    }

                    const pdfBlobUrl = docPDF.output('bloburl');
                    window.open(pdfBlobUrl, '_blank');

                    setLoading(false);
                    setIsBulkGenerating(false);
                    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
                    return; // Exit function since we handled download manually
                } else {
                    // Single Generation
                    if (!selectedServer) throw new Error('Selecione um servidor para a geração individual.');

                    const res = await axios.get(`/api/servidores/${selectedServer.IDPK_SERV || selectedServer._id}`, { headers: { 'x-auth-token': token } });
                    const s = res.data.servidor;

                    // Fetch Calendar Events
                    const calendarRes = await axios.get('/api/calendario', { headers: { 'x-auth-token': token } });
                    const calendarEvents = calendarRes.data || [];

                    // Fetch Absences for this server
                    const absencesRes = await axios.get('/api/afastamentos', {
                        params: { limit: 1000 }, // Fetch recent absences
                        headers: { 'x-auth-token': token }
                    });
                    // Filter for this server client-side to be safe
                    const allAbsences = (absencesRes.data.afastamentos || []).filter(a => String(a.IDFK_SERV) === String(s.IDPK_SERV || s._id));

                    filename = `Frequencia_${s.NOME_SERV.replace(/\s+/g, '_')}_${referenceMonth}.pdf`;
                    contentHtml = generateFrequencyPage(s, referenceMonth, imgTag, calendarEvents, allAbsences);
                }
                bodyContent.innerHTML = contentHtml;
                bodyContent.innerHTML = contentHtml;
            } else if (selectedReport === 'afastamentos') {
                const res = await axios.get('/api/afastamentos', {
                    params: { limit: 1000 },
                    headers: { 'x-auth-token': token }
                });
                let list = res.data.afastamentos || [];

                // Filter by Reference Month if provided
                if (referenceMonth) {
                    const [year, month] = referenceMonth.split('-');
                    const startOfMonth = new Date(year, month - 1, 1);
                    const endOfMonth = new Date(year, month, 0);

                    list = list.filter(item => {
                        const start = new Date(item.INICIO_FERIAS_SIT);
                        const end = new Date(item.FIM_FERIAS_SIT);
                        // Check if overlap
                        return (start <= endOfMonth && end >= startOfMonth);
                    });
                }

                // Sort by Start Date
                list.sort((a, b) => new Date(a.INICIO_FERIAS_SIT) - new Date(b.INICIO_FERIAS_SIT));

                const headers = ['Servidor', 'Matrícula', 'Tipo', 'Início', 'Fim', 'Status'];
                let rows = '';

                if (list.length === 0) {
                    contentHtml = `<p style="text-align: center; color: #64748b; padding: 2rem;">Nenhum afastamento encontrado para o período selecionado.</p>`;
                } else {
                    list.forEach(item => {
                        rows += `
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${item.servidor?.NOME_SERV || 'Desconhecido'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${item.servidor?.MATRICULA_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${item.ASSUNTO_SIT}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${new Date(item.INICIO_FERIAS_SIT).toLocaleDateString()}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${new Date(item.FIM_FERIAS_SIT).toLocaleDateString()}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${item.STATUS_SIT}</td>
                        </tr>`;
                    });

                    contentHtml = `
                    <h2 style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1.5rem; color: #0d7ff2;">Relatório de Afastamentos</h2>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem; text-align: left;">
                        <thead style="background-color: #f1f5f9; color: #334155; font-weight: bold;">
                            <tr>${headers.map(h => `<th style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${h}</th>`).join('')}</tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>`;
                }
                bodyContent.innerHTML = headerHtml + contentHtml;

            } else if (selectedReport === 'aniversariantes') {
                if (!referenceMonth) throw new Error('Selecione o mês de referência.');
                const [year, month] = referenceMonth.split('-');
                isLandscape = true; // Set to Landscape

                // Fetch servers with birth month
                const res = await axios.get('/api/servidores', {
                    params: {
                        limit: 10000,
                        birthMonth: parseInt(month),
                        status: 'ativo',
                        sort: 'NOME_SERV:asc'
                    },
                    headers: { 'x-auth-token': token }
                });

                const list = res.data.servidores || [];
                if (list.length === 0) throw new Error('Nenhum aniversariante encontrado para este mês.');

                // Sort by Day of Month
                list.sort((a, b) => {
                    const dayA = new Date(a.NASCIMENTO_SERV).getDate();
                    const dayB = new Date(b.NASCIMENTO_SERV).getDate();
                    return dayA - dayB;
                });

                // 1. Reduce Global Header Margin
                const headerHtml = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem;">
                ${imgTag}
                <div>
                    <h1 style="font-size: 1.5rem; font-weight: bold; color: #0f172a; margin: 0;">Prefeitura de São Luís</h1>
                    <p style="font-size: 0.875rem; color: #64748b; margin: 0;">Secretaria Municipal de Planejamento e Desenvolvimento - SEPLAN</p>
                    <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem;">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
            </div>
            `;

                contentHtml = `
                    <div style="text-align: center; margin-bottom: 0.5rem;">
                        <h2 style="font-size: 1.5rem; font-weight: bold; color: #0d7ff2; margin-bottom: 0.25rem;">Aniversariantes do Mês</h2>
                        <p style="font-size: 1.2rem; font-weight: bold; color: #334155; text-transform: uppercase; margin: 0;">${new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' })} / ${year}</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem; page-break-inside: auto; table-layout: fixed;">
                        <thead>
                            <tr style="background-color: #f1f5f9; color: #334155; height: 30px;">
                                <th style="padding: 0.25rem 0.5rem; border-bottom: 2px solid #e2e8f0; text-align: center; width: 15%;">Data</th>
                                <th style="padding: 0.25rem 0.5rem; border-bottom: 2px solid #e2e8f0; text-align: left; width: 55%;">Aniversariante</th>
                                <th style="padding: 0.25rem 0.5rem; border-bottom: 2px solid #e2e8f0; text-align: left; width: 30%;">Setor</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${list.map(s => {
                    const birthDate = new Date(s.NASCIMENTO_SERV);
                    const day = birthDate.getDate().toString().padStart(2, '0');

                    return `
                                <tr style="page-break-inside: avoid; break-inside: avoid;">
                                    <td style="padding: 0.25rem 0.5rem; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #0d7ff2; text-align: center; width: 15%;">${day}/${month.padStart(2, '0')}/${year}</td>
                                    <td style="padding: 0.25rem 0.5rem; border-bottom: 1px solid #e2e8f0; width: 55%; word-break: break-word;">${s.NOME_SERV}</td>
                                    <td style="padding: 0.25rem 0.5rem; border-bottom: 1px solid #e2e8f0; width: 30%; word-break: break-word;">${s.SETOR_LOTACAO_SERV || '-'}</td>
                                </tr>
                                `;
                }).join('')}
                        </tbody>
                    </table>
                `;
                bodyContent.innerHTML = headerHtml + contentHtml;
            } else {
                // List Reports
                let headers = [], rows = '';
                isLandscape = true;

                if (selectedReport === 'servidores') {
                    const res = await axios.get('/api/servidores', {
                        params: { limit: 10000 },
                        headers: { 'x-auth-token': token }
                    });
                    let list = res.data.servidores || [];

                    // Apply Filters Client-Side
                    if (filterNome) list = list.filter(s => s.NOME_SERV.toLowerCase().includes(filterNome.toLowerCase()));
                    if (filterMatricula) list = list.filter(s => s.MATRICULA_SERV.includes(filterMatricula));
                    if (filterSetor) list = list.filter(s => s.SETOR_LOTACAO_SERV === filterSetor);
                    if (filterVinculo) list = list.filter(s => getVinculoMacro(s) === filterVinculo);
                    if (filterStatus) {
                        // Normalize ATIVO_SERV to SIM/NAO for comparison
                        const normalizeStatus = (val) => {
                            const v = String(val || '').toUpperCase();
                            if (v === 'SIM' || v === 'ATIVO' || v === 'ATIVA') return 'SIM';
                            if (v === 'NAO' || v === 'NÃO' || v === 'INATIVO' || v === 'INATIVA' || v === 'DEMITIDO' || v === 'EXONERADO') return 'NÃO';
                            return v;
                        };
                        list = list.filter(s => normalizeStatus(s.ATIVO_SERV || s.status) === filterStatus);
                    }
                    if (filterCargo) list = list.filter(s => (s.CARGO_SERV || s.CARGO_EFETIVO_SERV || '').toLowerCase().includes(filterCargo.toLowerCase()));

                    headers = ['Nome', 'Matrícula', 'Vínculo', 'Cargo', 'Setor', 'Status'];
                    list.forEach(item => {
                        rows += `
                        <tr>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${item.NOME_SERV}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${item.MATRICULA_SERV}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${getVinculoMacro(item) ? getVinculoMacro(item).toLowerCase() : '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${item.CARGO_SERV || item.CARGO_EFETIVO_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${item.SETOR_LOTACAO_SERV || '-'}</td>
                            <td style="padding: 0.5rem; border-bottom: 1px solid #e2e8f0;">${item.status || item.ATIVO_SERV || '-'}</td>
                        </tr>`;
                    });
                } else if (selectedReport === 'ferias') {
                    // Build query params - filtering is done server-side
                    const params = new URLSearchParams();
                    if (filterFeriasAno) params.append('year', filterFeriasAno);
                    if (filterSetor) params.append('setor', filterSetor);
                    if (filterFeriasStatus) params.append('status', filterFeriasStatus);

                    const res = await axios.get('/api/ferias-data?' + params.toString(), { headers: { 'x-auth-token': token } });
                    let list = (res.data && res.data.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);

                    // Client-side date range filter (within the selected year)
                    if (filterFeriasPeriodoInicio) {
                        const from = new Date(filterFeriasPeriodoInicio);
                        list = list.filter(f => f.INICIO_FERIAS_SIT && new Date(f.INICIO_FERIAS_SIT) >= from);
                    }
                    if (filterFeriasPeriodoFim) {
                        const to = new Date(filterFeriasPeriodoFim);
                        list = list.filter(f => f.FIM_FERIAS_SIT && new Date(f.FIM_FERIAS_SIT) <= to);
                    }

                    headers = ['Servidor', 'Matricula', 'Setor', 'Solicit.', 'Inicio', 'Fim', 'Status'];
                    if (list.length === 0) {
                        contentHtml = '<p style="text-align:center;color:#64748b;padding:2rem">Nenhum registro de ferias encontrado.</p>';
                    } else {
                        list.forEach(item => {
                            const solicitacaoDate = item.DATADOC_SIT ? new Date(item.DATADOC_SIT) : (item.DATACAD_SIT ? new Date(item.DATACAD_SIT) : null);
                            const solicitacaoStr = solicitacaoDate ? solicitacaoDate.toLocaleDateString('pt-BR') : '-';
                            const inicioStr = item.INICIO_FERIAS_SIT ? new Date(item.INICIO_FERIAS_SIT).toLocaleDateString('pt-BR') : '-';
                            const fimStr = item.FIM_FERIAS_SIT ? new Date(item.FIM_FERIAS_SIT).toLocaleDateString('pt-BR') : '-';
                            const statusStr = item.STATUS_SIT || '-';
                            const nomeStr = item.NOME_SERV || '-';
                            const matStr = item.MATRICULA_SERV || '-';
                            const setorStr = item.SETOR_SERV || '-';
                            rows += '<tr>'
                                + '<td style="padding:0.5rem;border-bottom:1px solid #e2e8f0;font-weight:bold">' + nomeStr + '</td>'
                                + '<td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">' + matStr + '</td>'
                                + '<td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">' + setorStr + '</td>'
                                + '<td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">' + solicitacaoStr + '</td>'
                                + '<td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">' + inicioStr + '</td>'
                                + '<td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">' + fimStr + '</td>'
                                + '<td style="padding:0.5rem;border-bottom:1px solid #e2e8f0">' + statusStr + '</td>'
                                + '</tr>';
                        });
                    }
                } else {
                    contentHtml = '<p style="text-align:center;color:#64748b;padding:2rem">Relatorio em desenvolvimento.</p>';
                }

                if (rows) {
                    const headerRow = headers.map(h => '<th style="padding:0.5rem;border-bottom:1px solid #e2e8f0">' + h + '</th>').join('');
                    contentHtml = '<h2 style="font-size:1.25rem;font-weight:bold;margin-bottom:1.5rem;color:#0d7ff2">' + getReportConfig(selectedReport).title + '</h2>'
                        + '<table style="width:100%;border-collapse:collapse;font-size:0.75rem;text-align:left">'
                        + '<thead style="background-color:#f1f5f9;color:#334155;font-weight:bold"><tr>' + headerRow + '</tr></thead>'
                        + '<tbody>' + rows + '</tbody>'
                        + '</table>';
                }
                bodyContent.innerHTML = headerHtml + contentHtml;
            }

            // 3. Content is already injected at the start

            // Wait for ALL images (attachments AND logo) to be ready
            // We removed the :not([src^="data:"]) filter so it waits for the logo too
            const images = bodyContent.getElementsByTagName('img');
            if (images.length > 0) {
                await Promise.all(Array.from(images).map(img => {
                    if (img.complete) return Promise.resolve();
                    return new Promise(resolve => {
                        img.onload = resolve;
                        img.onerror = resolve;
                        setTimeout(resolve, 500);
                    });
                }));
            }
            // Extra buffer time for rendering
            await new Promise(resolve => setTimeout(resolve, 800));

            const script = doc.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = async () => {
                try {
                    const element = doc.body;
                    const worker = iframe.contentWindow.html2pdf().set({
                        margin: 10,
                        filename: filename,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: isLandscape ? 'landscape' : 'portrait' },
                        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
                    }).from(element);

                    const pdfBlobUrl = await worker.output('bloburl');
                    window.open(pdfBlobUrl, '_blank');

                    setLoading(false);
                    setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
                } catch (innerError) {
                    console.error('Inner PDF Error:', innerError);
                    alert('Erro interno ao gerar PDF: ' + innerError.message);
                    setLoading(false);
                }
            };
            script.onerror = () => {
                alert('Falha ao carregar biblioteca de PDF.');
                setLoading(false);
            };
            doc.head.appendChild(script);

        } catch (error) {
            console.error('Generators Error:', error);
            alert('Erro ao iniciar gerador: ' + (error.message || 'Falha desconhecida.'));
            setLoading(false);
            setIsBulkGenerating(false);
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Selecione o tipo de relatório que deseja gerar</p>
                </div>
            </div>

            {/* Report Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {['dossie', 'servidores', 'ferias', 'afastamentos', 'frequencia', 'aniversariantes'].map((type) => {
                    const config = getReportConfig(type);
                    const isSelected = selectedReport === type;
                    return (
                        <div
                            key={type}
                            onClick={() => setSelectedReport(type)}
                            className={`cursor-pointer bg-surface-light dark:bg-surface-dark p-6 rounded-xl border transition-all group ${isSelected
                                ? 'border-primary bg-blue-50 dark:bg-blue-900/10'
                                : 'border-border-light dark:border-border-dark hover:border-primary'}`}
                        >
                            <div className={`size-12 rounded-lg flex items-center justify-center mb-4 transition-colors ${isSelected
                                ? 'bg-primary text-white'
                                : `bg-${config.color}-50 dark:bg-${config.color}-900/30 text-${config.color}-600 dark:text-${config.color}-400`}`}>
                                <span className="material-symbols-outlined">{config.icon}</span>
                            </div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{config.title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{config.desc}</p>
                        </div>
                    );
                })}
            </div>

            {/* Selection Area for Specific Reports */}
            {(selectedReport === 'dossie' || selectedReport === 'frequencia') && (
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark mb-8 transition-all duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Selecionar Servidor</h3>

                    {!selectedServer ? (
                        <div className="relative max-w-2xl">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 material-symbols-outlined">search</span>
                            <input
                                type="text"
                                value={serverSearch}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white text-sm focus:ring-primary focus:border-primary outline-none"
                                placeholder="Buscar por nome ou matrícula..."
                            />

                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                                    {searchResults.map(s => (
                                        <div
                                            key={s.IDPK_SERV || s._id}
                                            onClick={() => selectServer(s)}
                                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700 last:border-0"
                                        >
                                            <p className="font-medium text-slate-900 dark:text-white">{s.NOME_SERV}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Matrícula: {s.MATRICULA_SERV}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center justify-between max-w-2xl">
                            <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-sm">person</span>
                                </div>
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    {selectedServer.NOME_SERV} ({selectedServer.MATRICULA_SERV})
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedServer(null)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    )}

                    {selectedReport === 'frequencia' && (
                        <>
                            <div className="mt-4 border-t border-border-light dark:border-border-dark pt-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mês de Referência</label>
                                <input
                                    type="month"
                                    value={referenceMonth}
                                    onChange={(e) => setReferenceMonth(e.target.value)}
                                    className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                                />
                            </div>

                            <div className="mt-4 border-t border-border-light dark:border-border-dark pt-4">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Filtros de Geração em Massa</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Setor</label>
                                        <select
                                            value={filterSetor}
                                            onChange={(e) => setFilterSetor(e.target.value)}
                                            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Todos</option>
                                            {setoresOpt.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Vínculo</label>
                                        <select
                                            value={filterVinculo}
                                            onChange={(e) => setFilterVinculo(e.target.value)}
                                            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Todos</option>
                                            <option value="EFETIVO">Estatutário/Efetivo</option>
                                            <option value="COMISSIONADO">Comissionado</option>
                                            <option value="CONTRATADO">Temporário/Contratado</option>
                                            <option value="SERVIÇOS PRESTADOS">Serviços Prestados</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                                        <select
                                            value={filterCargo}
                                            onChange={(e) => setFilterCargo(e.target.value)}
                                            className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 text-sm outline-none focus:ring-primary focus:border-primary"
                                        >
                                            <option value="">Todos</option>
                                            {cargosOpt.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Filters for Férias */}
            {selectedReport === 'ferias' && (
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark mb-8 transition-all duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Filtrar Férias</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ano</label>
                            <select
                                value={filterFeriasAno}
                                onChange={(e) => setFilterFeriasAno(e.target.value)}
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            >
                                {Array.from({ length: new Date().getFullYear() - 2009 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Período — De</label>
                            <input
                                type="date"
                                value={filterFeriasPeriodoInicio}
                                onChange={(e) => setFilterFeriasPeriodoInicio(e.target.value)}
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Período — Até</label>
                            <input
                                type="date"
                                value={filterFeriasPeriodoFim}
                                onChange={(e) => setFilterFeriasPeriodoFim(e.target.value)}
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Setor</label>
                            <select
                                value={filterSetor}
                                onChange={(e) => setFilterSetor(e.target.value)}
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="">Todos</option>
                                {setoresOpt.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                            <select
                                value={filterFeriasStatus}
                                onChange={(e) => setFilterFeriasStatus(e.target.value)}
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="">Todos</option>
                                <option value="APROVADO">Aprovado / Deferido</option>
                                <option value="PENDENTE">Aguardando Aprovação</option>
                                <option value="REJEITADO">Cancelado / Rejeitado</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters for Aniversariantes and Afastamentos */}
            {(selectedReport === 'aniversariantes' || selectedReport === 'afastamentos') && (
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark mb-8 transition-all duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                        {selectedReport === 'aniversariantes' ? 'Filtrar Aniversariantes' : 'Filtrar Afastamentos'}
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mês de Referência</label>
                        <input
                            type="month"
                            value={referenceMonth}
                            onChange={(e) => setReferenceMonth(e.target.value)}
                            className="rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                        />
                    </div>
                </div>
            )}

            {/* Filters for Server List */}
            {selectedReport === 'servidores' && (
                <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-xl border border-border-light dark:border-border-dark mb-8 transition-all duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Filtrar Relatório</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                            <input
                                type="text"
                                value={filterNome}
                                onChange={(e) => setFilterNome(e.target.value)}
                                placeholder="Buscar nome..."
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Matrícula</label>
                            <input
                                type="text"
                                value={filterMatricula}
                                onChange={(e) => setFilterMatricula(e.target.value)}
                                placeholder="Buscar matrícula..."
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Vínculo</label>
                            <select
                                value={filterVinculo}
                                onChange={(e) => setFilterVinculo(e.target.value)}
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="">Todos</option>
                                <option value="EFETIVO">Estatutário/Efetivo</option>
                                <option value="COMISSIONADO">Comissionado</option>
                                <option value="CONTRATADO">Temporário/Contratado</option>
                                <option value="SERVIÇOS PRESTADOS">Serviços Prestados</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo</label>
                            <input
                                type="text"
                                value={filterCargo}
                                onChange={(e) => setFilterCargo(e.target.value)}
                                placeholder="Buscar cargo..."
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Setor</label>
                            <select
                                value={filterSetor}
                                onChange={(e) => setFilterSetor(e.target.value)}
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="">Todos</option>
                                <option value="SEPLAN">SEPLAN</option>
                                <option value="SEMUS">SEMUS</option>
                                <option value="SEMED">SEMED</option>
                                <option value="RH">RH</option>
                                <option value="Financeiro">Financeiro</option>
                                <option value="Administrativo">Administrativo</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white px-3 py-2 outline-none focus:ring-primary focus:border-primary"
                            >
                                <option value="">Todos</option>
                                <option value="SIM">Ativo</option>
                                <option value="NÃO">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
                {selectedReport === 'frequencia' && (
                    <button
                        onClick={() => generatePDF('all')}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg shadow-green-500/30 flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin material-symbols-outlined">progress_activity</span>
                                Gerando Todos...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">groups</span>
                                Gerar Todos (Mês)
                            </>
                        )}
                    </button>
                )}

                <button
                    onClick={() => generatePDF(selectedReport === 'frequencia' ? 'single' : 'default')}
                    disabled={loading || (selectedReport === 'frequencia' && !selectedServer) || (selectedReport === 'dossie' && !selectedServer)}
                    className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <span className="animate-spin material-symbols-outlined">progress_activity</span>
                            Gerando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">picture_as_pdf</span>
                            Visualizar PDF
                        </>
                    )}
                </button>
            </div>

            {/* Bulk Loading Overlay */}
            {isBulkGenerating && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center animate-fade-in flex flex-col items-center">
                        <div className="relative mb-6">
                            {/* Coffee Cup SVG Animation */}
                            <svg className="w-24 h-24 text-primary animate-bounce-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
                                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
                                <line x1="6" y1="2" x2="6" y2="4" className="animate-pulse"></line>
                                <line x1="10" y1="2" x2="10" y2="4" className="animate-pulse" style={{ animationDelay: '0.2s' }}></line>
                                <line x1="14" y1="2" x2="14" y2="4" className="animate-pulse" style={{ animationDelay: '0.4s' }}></line>
                            </svg>
                            <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                {bulkGenerateCount.current} / {bulkGenerateCount.total}
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Processando Lote...</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                            A geração de todas as frequências da Secretaria requer um processo de colagem minucioso que pode demorar alguns minutinhos. Que tal preparar um cafezinho enquanto nossa formiguinha digital trabalha? <span role="img" aria-label="formiga">🐜</span><span role="img" aria-label="cafe">☕</span>
                        </p>

                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                            <div
                                className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                                style={{ width: Math.max(5, (bulkGenerateCount.current / Math.max(1, parseInt(bulkGenerateCount.total) || 1)) * 100) + '%' }}
                            >
                                <div className="absolute inset-0 bg-white/30 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)', width: '200%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Relatorios;
