import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const FormField = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">{label}</label>
        {children}
    </div>
);

const AddServer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        // Dados Pessoais
        NOME_SERV: '',
        CPF_SERV: '',
        NASCIMENTO_SERV: '',
        SEXO_SERV: '',
        ESTADO_CIVIL_SERV: '',
        NOME_PAI_SERV: '',
        NOME_MAE_SERV: '',
        TIPO_SANGUINEO_SERV: '',
        FATOR_SERV: '',
        // Documentos
        RG_SERV: '',
        OE_RG_SERV: '',
        PISPASEP_SERV: '',
        TITULO_ELEITORAL_SERV: '',
        ZONA_SERV: '',
        SECAO_SERV: '',
        CNH_SERV: '',
        VALIDADE_CNH_SERV: '',
        CTPS_SERV: '',
        CERT_RESERV_SERV: '',
        // Endereço e Contato
        ENDERECO_SERV: '',
        BAIRRO_SERV: '',
        CIDADE_SERV: '',
        ESTADO_SERV: '',
        CEP_SERV: '',
        EMAIL_SERV: '',
        FONES_SERV: '',
        FONES_TRAB_SERV: '',
        // Dados Bancários
        BANCO_SERV: '',
        AGENCIA_SERV: '',
        CONTACORRENTE_SERV: '',
        // Dados Funcionais
        MATRICULA_SERV: '',
        ADMISSAO_SERV: '',
        SETOR_LOTACAO_SERV: '',
        ATIVO_SERV: 'SIM',
        VINCULO_SERV: 'EFETIVO',
        CARGO_EFETIVO_SERV: '',
        CARGO_COMISSIONADO_SERV: '',
        FUNCAO_SP_SERV: '',
        TURNO_SERV: '',
        SIMBOLO_SERV: '',
        ORG_ORIGEM_SERV: '',
        CEDIDO_SERV: 'false',
        CHEFE_SERV: 'false',
        TRABALHA_SEXTA_TARDE: false,
        DATACAD_SERV: '',
        // Educação
        ESCOLARIDADE_SERV: '',
        CURSO_SERV: '',
        // Observações legadas (Access DB)
        OBS_DADOS_PESSOAIS_SERV: '',
        OBS_SERV: '',
        OBSATV_SERV: ''
    });

    const [observacoes, setObservacoes] = useState([]);
    const [newObsText, setNewObsText] = useState('');
    const [anexos, setAnexos] = useState([]);
    const [customOptions, setCustomOptions] = useState({});
    const [viewAnexo, setViewAnexo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [pageTitle, setPageTitle] = useState('Adicionar Novo Servidor');

    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Editar Servidor');
            fetchServidor();
        }
    }, [id]);

    const fetchServidor = async () => {
        try {
            const response = await axios.get(`/api/servidores/${id}`);
            const servidor = response.data.servidor;

            const formatDate = (dateString) => {
                if (!dateString) return '';
                const d = new Date(dateString);
                if (isNaN(d.getTime())) return '';
                return d.toISOString().split('T')[0];
            };

            setFormData({
                NOME_SERV: servidor.NOME_SERV || '',
                CPF_SERV: servidor.CPF_SERV || '',
                NASCIMENTO_SERV: formatDate(servidor.NASCIMENTO_SERV),
                SEXO_SERV: servidor.SEXO_SERV || '',
                ESTADO_CIVIL_SERV: servidor.ESTADO_CIVIL_SERV || '',
                NOME_PAI_SERV: servidor.NOME_PAI_SERV || '',
                NOME_MAE_SERV: servidor.NOME_MAE_SERV || '',
                TIPO_SANGUINEO_SERV: servidor.TIPO_SANGUINEO_SERV || '',
                FATOR_SERV: servidor.FATOR_SERV || '',
                RG_SERV: servidor.RG_SERV || '',
                OE_RG_SERV: servidor.OE_RG_SERV || '',
                PISPASEP_SERV: servidor.PISPASEP_SERV || '',
                TITULO_ELEITORAL_SERV: servidor.TITULO_ELEITORAL_SERV || '',
                ZONA_SERV: servidor.ZONA_SERV || '',
                SECAO_SERV: servidor.SECAO_SERV || '',
                CNH_SERV: servidor.CNH_SERV || '',
                VALIDADE_CNH_SERV: formatDate(servidor.VALIDADE_CNH_SERV),
                CTPS_SERV: servidor.CTPS_SERV || '',
                CERT_RESERV_SERV: servidor.CERT_RESERV_SERV || '',
                ENDERECO_SERV: servidor.ENDERECO_SERV || '',
                BAIRRO_SERV: servidor.BAIRRO_SERV || '',
                CIDADE_SERV: servidor.CIDADE_SERV || '',
                ESTADO_SERV: servidor.ESTADO_SERV || '',
                CEP_SERV: servidor.CEP_SERV || '',
                EMAIL_SERV: servidor.EMAIL_SERV || '',
                FONES_SERV: servidor.FONES_SERV || '',
                FONES_TRAB_SERV: servidor.FONES_TRAB_SERV || '',
                BANCO_SERV: servidor.BANCO_SERV || '',
                AGENCIA_SERV: servidor.AGENCIA_SERV || '',
                CONTACORRENTE_SERV: servidor.CONTACORRENTE_SERV || '',
                MATRICULA_SERV: servidor.MATRICULA_SERV || '',
                ADMISSAO_SERV: formatDate(servidor.ADMISSAO_SERV),
                SETOR_LOTACAO_SERV: servidor.SETOR_LOTACAO_SERV || '',
                ATIVO_SERV: servidor.ATIVO_SERV || 'SIM',
                VINCULO_SERV: servidor.VINCULO_SERV || 'EFETIVO',
                CARGO_EFETIVO_SERV: servidor.CARGO_EFETIVO_SERV || '',
                CARGO_COMISSIONADO_SERV: servidor.CARGO_COMISSIONADO_SERV || '',
                FUNCAO_SP_SERV: servidor.FUNCAO_SP_SERV || '',
                TURNO_SERV: servidor.TURNO_SERV || '',
                SIMBOLO_SERV: servidor.SIMBOLO_SERV || '',
                ORG_ORIGEM_SERV: servidor.ORG_ORIGEM_SERV || '',
                CEDIDO_SERV: servidor.CEDIDO_SERV || 'false',
                CHEFE_SERV: servidor.CHEFE_SERV || 'false',
                TRABALHA_SEXTA_TARDE: servidor.TRABALHA_SEXTA_TARDE || false,
                DATACAD_SERV: formatDate(servidor.DATACAD_SERV),
                ESCOLARIDADE_SERV: servidor.ESCOLARIDADE_SERV || '',
                CURSO_SERV: servidor.CURSO_SERV || '',
                OBS_DADOS_PESSOAIS_SERV: servidor.OBS_DADOS_PESSOAIS_SERV || '',
                OBS_SERV: servidor.OBS_SERV || '',
                OBSATV_SERV: servidor.OBSATV_SERV || ''
            });

            setObservacoes(servidor.OBSERVACOES || []);
            setAnexos(servidor.ANEXOS || []);
        } catch (error) {
            console.error('Error fetching servidor:', error);
            alert('Erro ao carregar dados do servidor');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
            return;
        }
        if (value === '+') {
            const newValue = window.prompt('Digite a nova opção para este campo:');
            if (newValue && newValue.trim() !== '') {
                const trimmedValue = newValue.trim().toUpperCase();
                setCustomOptions(prev => ({
                    ...prev,
                    [name]: [...new Set([...(prev[name] || []), trimmedValue])]
                }));
                setFormData(prev => ({ ...prev, [name]: trimmedValue }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEditObservation = async (obs) => {
        const newText = window.prompt('Editar observação:', obs.conteudo);
        if (newText === null || newText.trim() === '') return;
        try {
            const token = localStorage.getItem('token');
            const autor = localStorage.getItem('userName') || 'Usuário';
            const res = await axios.put(`/api/servidores/${id}/observacoes/${obs._id}`,
                { conteudo: newText, autor },
                { headers: { 'x-auth-token': token } }
            );
            setObservacoes(res.data);
        } catch (error) {
            console.error('Error editing observation:', error);
            alert('Erro ao editar observação');
        }
    };

    const handleDeleteObservation = async (obsId) => {
        if (!window.confirm('Tem certeza que deseja excluir esta observação?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(`/api/servidores/${id}/observacoes/${obsId}`, {
                headers: { 'x-auth-token': token }
            });
            setObservacoes(res.data);
        } catch (error) {
            console.error('Error deleting observation:', error);
            alert('Erro ao excluir observação');
        }
    };

    const handleAddObservation = async () => {
        const text = newObsText.trim();
        if (!text) return alert('Digite uma observação antes de adicionar.');
        try {
            const token = localStorage.getItem('token');
            const autor = localStorage.getItem('userName') || 'Usuário';
            const res = await axios.post(
                `/api/servidores/${id}/observacoes`,
                { conteudo: text, autor },
                { headers: { 'x-auth-token': token } }
            );
            setObservacoes(res.data);
            setNewObsText('');
        } catch (error) {
            console.error('Error adding observation:', error);
            alert('Erro ao adicionar observação: ' + (error.response?.data?.msg || error.message));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');
        const config = { headers: { 'x-auth-token': token } };
        try {
            if (isEditMode) {
                await axios.put(`/api/servidores/${id}`, formData, config);
                alert('Servidor atualizado com sucesso!');
            } else {
                await axios.post('/api/servidores', formData, config);
                alert('Servidor cadastrado com sucesso!');
            }
            navigate('/servidores');
        } catch (error) {
            console.error('Error saving servidor:', error);
            alert('Erro ao salvar servidor: ' + (error.response?.data?.msg || error.message));
        } finally {
            setLoading(false);
        }
    };

    const deleteAnexo = async (anexoId) => {
        if (!window.confirm('Tem certeza que deseja excluir este anexo?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/servidores/${id}/anexos/${anexoId}`, {
                headers: { 'x-auth-token': token }
            });
            setAnexos(prev => prev.filter(a => a._id !== anexoId));
        } catch (error) {
            console.error('Error deleting anexo:', error);
            alert('Erro ao excluir anexo');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const uploadData = new FormData();
        uploadData.append('file', file);
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.post(`/api/servidores/${id}/upload`, uploadData, {
                headers: {
                    'x-auth-token': token,
                    'Content-Type': 'multipart/form-data',
                }
            });
            setAnexos(res.data);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Erro ao enviar arquivo.');
        } finally {
            setLoading(false);
        }
    };

    const vinculoOptions = ['EFETIVO', 'COMISSIONADO', 'SERVIÇOS PRESTADOS', 'CEDIDO', 'ESTAGIÁRIO', 'TEMPORÁRIO'];
    const turnoOptions = ['MATUTINO', 'VESPERTINO', 'INTEGRAL', 'NOTURNO'];
    const escolaridadeOptions = ['FUNDAMENTAL INCOMPLETO', 'FUNDAMENTAL COMPLETO', 'MÉDIO INCOMPLETO', 'MÉDIO COMPLETO', 'SUPERIOR INCOMPLETO', 'SUPERIOR COMPLETO', 'PÓS-GRADUAÇÃO', 'MESTRADO', 'DOUTORADO'];

    return (
        <div className="space-y-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm font-medium">
                <span onClick={() => navigate('/dashboard')} className="text-slate-500 cursor-pointer hover:text-primary">Início</span>
                <span className="text-slate-400">/</span>
                <span onClick={() => navigate('/servidores')} className="text-slate-500 cursor-pointer hover:text-primary">Servidores</span>
                <span className="text-slate-400">/</span>
                <span className="text-slate-900 dark:text-white">{isEditMode ? 'Editar' : 'Adicionar Novo'}</span>
            </div>

            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{pageTitle}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Preencha os dados do servidor abaixo.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark">

                {/* Dados Pessoais */}
                <div className="p-6 md:p-8 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-primary">
                            <span className="material-symbols-outlined">person</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dados Pessoais</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                        <div className="lg:col-span-4">
                            <FormField label="Nome Completo *">
                                <input name="NOME_SERV" value={formData.NOME_SERV} onChange={handleChange} required placeholder="Nome do Servidor" className="form-input w-full" />
                            </FormField>
                        </div>
                        <div className="lg:col-span-2">
                            <FormField label="CPF">
                                <input name="CPF_SERV" value={formData.CPF_SERV} onChange={handleChange} placeholder="000.000.000-00" className="form-input w-full" />
                            </FormField>
                        </div>
                        <div className="lg:col-span-2">
                            <FormField label="Data de Nascimento">
                                <input type="date" name="NASCIMENTO_SERV" value={formData.NASCIMENTO_SERV} onChange={handleChange} className="form-input w-full" />
                            </FormField>
                        </div>
                        <div className="lg:col-span-2">
                            <FormField label="Sexo">
                                <select name="SEXO_SERV" value={formData.SEXO_SERV} onChange={handleChange} className="form-select w-full">
                                    <option value="">Selecione...</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Feminino</option>
                                </select>
                            </FormField>
                        </div>
                        <div className="lg:col-span-2">
                            <FormField label="Estado Civil">
                                <select name="ESTADO_CIVIL_SERV" value={formData.ESTADO_CIVIL_SERV} onChange={handleChange} className="form-select w-full">
                                    <option value="">Selecione...</option>
                                    <option value="SOLTEIRO(A)">Solteiro(a)</option>
                                    <option value="CASADO(A)">Casado(a)</option>
                                    <option value="DIVORCIADO(A)">Divorciado(a)</option>
                                    <option value="VIÚVO(A)">Viúvo(a)</option>
                                    <option value="UNIÃO ESTÁVEL">União Estável</option>
                                </select>
                            </FormField>
                        </div>
                        <div className="lg:col-span-3">
                            <FormField label="Nome da Mãe">
                                <input name="NOME_MAE_SERV" value={formData.NOME_MAE_SERV} onChange={handleChange} className="form-input w-full" />
                            </FormField>
                        </div>
                        <div className="lg:col-span-3">
                            <FormField label="Nome do Pai">
                                <input name="NOME_PAI_SERV" value={formData.NOME_PAI_SERV} onChange={handleChange} className="form-input w-full" />
                            </FormField>
                        </div>
                        <div className="lg:col-span-2">
                            <FormField label="Tipo Sanguíneo">
                                <select name="TIPO_SANGUINEO_SERV" value={formData.TIPO_SANGUINEO_SERV} onChange={handleChange} className="form-select w-full">
                                    <option value="">Selecione...</option>
                                    {['A', 'B', 'AB', 'O'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </FormField>
                        </div>
                        <div className="lg:col-span-2">
                            <FormField label="Fator RH">
                                <select name="FATOR_SERV" value={formData.FATOR_SERV} onChange={handleChange} className="form-select w-full">
                                    <option value="">Selecione...</option>
                                    <option value="+">Positivo (+)</option>
                                    <option value="-">Negativo (-)</option>
                                </select>
                            </FormField>
                        </div>
                    </div>
                </div>

                {/* Documentos */}
                <div className="p-6 md:p-8 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                            <span className="material-symbols-outlined">badge</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Documentos</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField label="RG">
                            <input name="RG_SERV" value={formData.RG_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Órgão Emissor">
                            <input name="OE_RG_SERV" value={formData.OE_RG_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="PIS/PASEP">
                            <input name="PISPASEP_SERV" value={formData.PISPASEP_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="CTPS">
                            <input name="CTPS_SERV" value={formData.CTPS_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Título Eleitoral">
                            <input name="TITULO_ELEITORAL_SERV" value={formData.TITULO_ELEITORAL_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Zona Eleitoral">
                            <input name="ZONA_SERV" value={formData.ZONA_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Seção Eleitoral">
                            <input name="SECAO_SERV" value={formData.SECAO_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Cert. de Reservista">
                            <input name="CERT_RESERV_SERV" value={formData.CERT_RESERV_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="CNH">
                            <input name="CNH_SERV" value={formData.CNH_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Validade CNH">
                            <input type="date" name="VALIDADE_CNH_SERV" value={formData.VALIDADE_CNH_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                    </div>
                </div>

                {/* Endereço e Contato */}
                <div className="p-6 md:p-8 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600">
                            <span className="material-symbols-outlined">home</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Endereço e Contato</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="lg:col-span-2">
                            <FormField label="Endereço">
                                <input name="ENDERECO_SERV" value={formData.ENDERECO_SERV} onChange={handleChange} className="form-input w-full" />
                            </FormField>
                        </div>
                        <FormField label="Bairro">
                            <input name="BAIRRO_SERV" value={formData.BAIRRO_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="CEP">
                            <input name="CEP_SERV" value={formData.CEP_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Cidade">
                            <input name="CIDADE_SERV" value={formData.CIDADE_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Estado (UF)">
                            <input name="ESTADO_SERV" value={formData.ESTADO_SERV} onChange={handleChange} maxLength={2} className="form-input w-full" />
                        </FormField>
                        <FormField label="E-mail">
                            <input type="email" name="EMAIL_SERV" value={formData.EMAIL_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Telefone Pessoal">
                            <input name="FONES_SERV" value={formData.FONES_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Telefone Trabalho">
                            <input name="FONES_TRAB_SERV" value={formData.FONES_TRAB_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                    </div>
                </div>

                {/* Dados Bancários */}
                <div className="p-6 md:p-8 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-cyan-600">
                            <span className="material-symbols-outlined">account_balance</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dados Bancários</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField label="Banco">
                            <input name="BANCO_SERV" value={formData.BANCO_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Agência">
                            <input name="AGENCIA_SERV" value={formData.AGENCIA_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Conta Corrente">
                            <input name="CONTACORRENTE_SERV" value={formData.CONTACORRENTE_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                    </div>
                </div>

                {/* Dados Funcionais */}
                <div className="p-6 md:p-8 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-violet-600">
                            <span className="material-symbols-outlined">work</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Dados Funcionais</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField label="Matrícula">
                            <input name="MATRICULA_SERV" value={formData.MATRICULA_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Data de Admissão">
                            <input type="date" name="ADMISSAO_SERV" value={formData.ADMISSAO_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <div className="lg:col-span-2">
                            <FormField label="Setor / Lotação">
                                <input name="SETOR_LOTACAO_SERV" value={formData.SETOR_LOTACAO_SERV} onChange={handleChange} className="form-input w-full" />
                            </FormField>
                        </div>
                        <FormField label="Vínculo">
                            <select name="VINCULO_SERV" value={formData.VINCULO_SERV} onChange={handleChange} className="form-select w-full">
                                {vinculoOptions.map(v => <option key={v} value={v}>{v}</option>)}
                                {(customOptions.VINCULO_SERV || []).map(v => <option key={v} value={v}>{v}</option>)}
                                <option value="+">+ Adicionar novo...</option>
                            </select>
                        </FormField>
                        <FormField label="Status">
                            <select name="ATIVO_SERV" value={formData.ATIVO_SERV} onChange={handleChange} className="form-select w-full">
                                <option value="SIM">Ativo</option>
                                <option value="NÃO">Inativo</option>
                            </select>
                        </FormField>
                        <div className="lg:col-span-2">
                            <FormField label="Cargo Efetivo">
                                <input name="CARGO_EFETIVO_SERV" value={formData.CARGO_EFETIVO_SERV} onChange={handleChange} className="form-input w-full" />
                            </FormField>
                        </div>
                        <div className="lg:col-span-2">
                            <FormField label="Cargo Comissionado">
                                <input name="CARGO_COMISSIONADO_SERV" value={formData.CARGO_COMISSIONADO_SERV} onChange={handleChange} className="form-input w-full" />
                            </FormField>
                        </div>
                        <div className="lg:col-span-2">
                            <FormField label="Função">
                                <input name="FUNCAO_SP_SERV" value={formData.FUNCAO_SP_SERV} onChange={handleChange} className="form-input w-full" />
                            </FormField>
                        </div>
                        <FormField label="Símbolo">
                            <input name="SIMBOLO_SERV" value={formData.SIMBOLO_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Turno">
                            <select name="TURNO_SERV" value={formData.TURNO_SERV} onChange={handleChange} className="form-select w-full">
                                <option value="">Selecione...</option>
                                {turnoOptions.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Órgão de Origem (Cedido)">
                            <input name="ORG_ORIGEM_SERV" value={formData.ORG_ORIGEM_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <FormField label="Servidor Cedido?">
                            <select name="CEDIDO_SERV" value={formData.CEDIDO_SERV} onChange={handleChange} className="form-select w-full">
                                <option value="false">Não</option>
                                <option value="true">Sim</option>
                            </select>
                        </FormField>
                        <FormField label="É Chefe de Setor?">
                            <select name="CHEFE_SERV" value={formData.CHEFE_SERV} onChange={handleChange} className="form-select w-full">
                                <option value="false">Não</option>
                                <option value="true">Sim</option>
                            </select>
                        </FormField>
                        <FormField label="Data de Cadastro">
                            <input type="date" name="DATACAD_SERV" value={formData.DATACAD_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                        <div className="flex items-center gap-3 mt-6">
                            <input type="checkbox" id="trabalha_sexta" name="TRABALHA_SEXTA_TARDE" checked={!!formData.TRABALHA_SEXTA_TARDE} onChange={handleChange} className="w-4 h-4 accent-primary" />
                            <label htmlFor="trabalha_sexta" className="text-sm font-medium text-slate-700 dark:text-slate-300">Trabalha sexta à tarde</label>
                        </div>
                    </div>
                </div>

                {/* Educação */}
                <div className="p-6 md:p-8 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg text-teal-600">
                            <span className="material-symbols-outlined">school</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Educação</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Escolaridade">
                            <select name="ESCOLARIDADE_SERV" value={formData.ESCOLARIDADE_SERV} onChange={handleChange} className="form-select w-full">
                                <option value="">Selecione...</option>
                                {escolaridadeOptions.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Curso / Área de Formação">
                            <input name="CURSO_SERV" value={formData.CURSO_SERV} onChange={handleChange} className="form-input w-full" />
                        </FormField>
                    </div>
                </div>

                {/* Observações */}
                <div className="p-6 md:p-8 border-b border-border-light dark:border-border-dark">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600">
                            <span className="material-symbols-outlined">sticky_note_2</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Observações</h3>
                    </div>
                    <div className="space-y-4">
                        {/* List of existing observations */}
                        {observacoes.length === 0 && (
                            <p className="text-sm text-slate-400 italic">Nenhuma observação registrada.</p>
                        )}
                        {observacoes.map((obs, idx) => (
                            <div key={obs._id || idx} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 group relative">
                                <p className="text-sm text-slate-800 dark:text-slate-200 pr-6">{obs.conteudo}</p>
                                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                                    <span>Por: {obs.autor || 'Sistema'}</span>
                                    <span>{obs.data ? new Date(obs.data).toLocaleDateString('pt-BR') : ''}</span>
                                </div>
                                {obs._id && isEditMode && (
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => handleEditObservation(obs)}
                                            className="text-slate-400 hover:text-blue-500 p-1 bg-white dark:bg-slate-800 rounded shadow-sm"
                                            title="Editar observação"
                                        >
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteObservation(obs._id)}
                                            className="text-slate-400 hover:text-red-500 p-1 bg-white dark:bg-slate-800 rounded shadow-sm"
                                            title="Excluir observação"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Historical notes from Access DB */}
                        {formData.OBS_SERV && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700/50">
                                <span className="block text-xs font-bold text-amber-800 dark:text-amber-500 mb-1">Nota Histórica (Geral):</span>
                                <p className="text-sm text-slate-800 dark:text-slate-200">{formData.OBS_SERV}</p>
                            </div>
                        )}
                        {formData.OBS_DADOS_PESSOAIS_SERV && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700/50">
                                <span className="block text-xs font-bold text-amber-800 dark:text-amber-500 mb-1">Nota Histórica (Pessoal):</span>
                                <p className="text-sm text-slate-800 dark:text-slate-200">{formData.OBS_DADOS_PESSOAIS_SERV}</p>
                            </div>
                        )}
                        {formData.OBSATV_SERV && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-700/50">
                                <span className="block text-xs font-bold text-amber-800 dark:text-amber-500 mb-1">Nota Histórica (Atividades):</span>
                                <p className="text-sm text-slate-800 dark:text-slate-200">{formData.OBSATV_SERV}</p>
                            </div>
                        )}

                        {/* Add new observation — only available in edit mode */}
                        {isEditMode && (
                            <div className="border-t border-border-light dark:border-border-dark pt-4">
                                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                                    Adicionar Nova Observação Interna
                                </label>
                                <textarea
                                    value={newObsText}
                                    onChange={e => setNewObsText(e.target.value)}
                                    rows="3"
                                    className="form-textarea w-full"
                                    placeholder="Digite uma observação..."
                                />
                                <div className="flex justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={handleAddObservation}
                                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">add_comment</span>
                                        Adicionar Observação
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Anexos — only in edit mode */}
                {isEditMode && (
                    <div className="p-6 md:p-8 border-b border-border-light dark:border-border-dark">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600">
                                <span className="material-symbols-outlined">attach_file</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Anexos</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium transition text-sm">
                                    <span className="material-symbols-outlined">upload</span>
                                    Escolher Arquivo
                                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={loading} />
                                </label>
                                {loading && <span className="text-sm text-slate-500">Carregando...</span>}
                            </div>

                            {anexos.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Nenhum anexo cadastrado.</p>
                            ) : (
                                <div className="space-y-2">
                                    {anexos.map((anexo, idx) => (
                                        <div key={anexo._id || idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-slate-400">description</span>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{anexo.originalname || anexo.filename}</p>
                                                    <p className="text-xs text-slate-400">{anexo.data ? new Date(anexo.data).toLocaleDateString('pt-BR') : ''}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {anexo.data64 ? (
                                                    <button type="button" onClick={() => setViewAnexo(anexo)} className="text-primary hover:underline text-sm">Ver</button>
                                                ) : null}
                                                <button type="button" onClick={() => deleteAnexo(anexo._id)} className="text-red-400 hover:text-red-600 transition-colors">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer / Actions */}
                <div className="p-6 md:p-8 flex justify-end gap-3">
                    <button type="button" onClick={() => navigate('/servidores')} className="px-6 py-3 rounded-xl border border-border-light dark:border-border-dark text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-all">
                        Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="px-8 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-xl">save</span>
                                {isEditMode ? 'Salvar Alterações' : 'Cadastrar Servidor'}
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Anexo Viewer Modal */}
            {viewAnexo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setViewAnexo(null)}>
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white">{viewAnexo.originalname}</h3>
                            <button onClick={() => setViewAnexo(null)} className="text-slate-500 hover:text-red-500">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {viewAnexo.mimetype && viewAnexo.mimetype.startsWith('image/') ? (
                            <img src={`data:${viewAnexo.mimetype};base64,${viewAnexo.data64}`} alt={viewAnexo.originalname} className="max-w-full" />
                        ) : (
                            <iframe
                                src={`data:${viewAnexo.mimetype || 'application/pdf'};base64,${viewAnexo.data64}`}
                                className="w-full h-[70vh]"
                                title={viewAnexo.originalname}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddServer;
