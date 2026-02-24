import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Help = () => {
    const [selectedModule, setSelectedModule] = useState(null);
    const [activeTab, setActiveTab] = useState('descricao'); // 'descricao' | 'passo-a-passo'
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

    const handleWhatsApp = (phone) => {
        const user = localStorage.getItem('userName') || 'Usuário';
        const now = new Date();
        const dateStr = now.toLocaleDateString('pt-BR');
        const timeStr = now.toLocaleTimeString('pt-BR');
        const message = `preciso de suporte, ${user} - ${dateStr} - ${timeStr}`;
        const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
        exit: { opacity: 0 }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    const tutorialData = {
        painel: {
            title: "Painel Principal",
            icon: "dashboard",
            color: "from-blue-500 to-blue-700",
            description: "Visão geral dos indicadores de RH.",
            details: [
                {
                    subtitle: "O que é o Painel Principal?",
                    content: "O Dashboard é a tela inicial do sistema. Nele você encontra um resumo em tempo real da situação do quadro de servidores: total de ativos, quantos estão em férias, quantos estão afastados e os aniversariantes do mês. Também exibe gráficos de composição por vínculo e por cargo."
                },
                {
                    subtitle: "Indicadores Disponíveis",
                    items: [
                        { label: "Total de Servidores", text: "Contagem de todos os servidores com status Ativo no sistema." },
                        { label: "Em Férias", text: "Servidores cujo período de férias inclui a data de hoje." },
                        { label: "Afastados", text: "Servidores com licença ou afastamento vigente." },
                        { label: "Aniversariantes do Mês", text: "Servidores que fazem aniversário no mês atual." }
                    ]
                },
                {
                    subtitle: "Acesso Rápido",
                    content: "Na seção de Acesso Rápido você encontra atalhos para as ações mais frequentes: Adicionar Servidor, Ver Relatórios e Registrar Afastamento. Use-os para navegar rapidamente sem precisar do menu lateral."
                }
            ],
            steps: [
                {
                    titulo: "Como interpretar os cards de indicadores",
                    passos: [
                        "Ao entrar no sistema, o Dashboard carrega automaticamente.",
                        "Os 4 cards no topo mostram os números atuais: Total, Em Férias, Afastados e Aniversariantes.",
                        "Clique em qualquer card para ir direto ao módulo correspondente (ex: clicar em 'Afastados' abre a aba de Afastamentos).",
                        "Os dados são atualizados em tempo real a cada acesso à página."
                    ]
                },
                {
                    titulo: "Como usar os gráficos",
                    passos: [
                        "Role a página para baixo para ver os gráficos de composição.",
                        "O gráfico de Vínculos mostra a proporção entre Efetivos, Comissionados, Contratados, etc.",
                        "O gráfico de Cargos exibe os cargos mais frequentes no quadro.",
                        "Passe o cursor sobre as fatias do gráfico para ver os valores exatos."
                    ]
                },
                {
                    titulo: "Como usar o Acesso Rápido",
                    passos: [
                        "Role até a seção 'Acesso Rápido' no dashboard.",
                        "Clique em 'Adicionar Servidor' para ir direto ao formulário de cadastro.",
                        "Clique em 'Relatórios' para ir à página de geração de relatórios.",
                        "Clique em 'Afastamentos' para registrar ou consultar um afastamento."
                    ]
                }
            ]
        },
        servidores: {
            title: "Gestão de Servidores",
            icon: "groups",
            color: "from-violet-500 to-violet-700",
            description: "Cadastro e manutenção de dados dos servidores.",
            details: [
                {
                    subtitle: "O que é este módulo?",
                    content: "A Gestão de Servidores é o coração do sistema. Aqui são cadastrados todos os dados pessoais e funcionais de cada servidor, e é possível editar, consultar, inativar e gerenciar documentos anexos."
                },
                {
                    subtitle: "Dados Pessoais",
                    items: [
                        { label: "Nome Completo", text: "Nome civil completo do servidor (obrigatório)." },
                        { label: "CPF", text: "Cadastro de Pessoa Física — identificador único no sistema." },
                        { label: "Data de Nascimento", text: "Usada para cálculo de idade e aniversariantes do mês." }
                    ]
                },
                {
                    subtitle: "Dados Funcionais",
                    items: [
                        { label: "Matrícula", text: "Número funcional único do servidor." },
                        { label: "Setor/Lotação", text: "Departamento onde o servidor está lotado." },
                        { label: "Vínculo", text: "Tipo de contratação: Efetivo, Comissionado, Serviços Prestados, Cedido, etc." },
                        { label: "Cargo Efetivo", text: "Cargo de concurso público do servidor estatutário." },
                        { label: "Cargo Comissionado", text: "Cargo de chefia ou direção, quando houver." },
                        { label: "Turno", text: "Período de trabalho: Matutino, Vespertino ou Integral." },
                        { label: "Status (Ativo/Inativo)", text: "Controla se o servidor aparece nos relatórios e contagens." }
                    ]
                },
                {
                    subtitle: "Observações e Anexos",
                    content: "O perfil do servidor permite adicionar observações textuais (registradas com data e hora automáticas) e anexar documentos digitalizados como portarias, certidões, contratos e comprovantes."
                }
            ],
            steps: [
                {
                    titulo: "Como cadastrar um novo servidor",
                    passos: [
                        "No menu lateral, clique em 'Servidores' e depois no botão '+ Adicionar Servidor', ou use o atalho do Dashboard.",
                        "Preencha o Nome Completo e CPF — ambos são obrigatórios.",
                        "Informe a Data de Nascimento (formato DD/MM/AAAA) e a Matrícula.",
                        "Selecione o Vínculo correto (Efetivo, Comissionado, Serviços Prestados, etc.).",
                        "Preencha o Setor de Lotação, Cargo, Função e Turno.",
                        "Clique em 'Salvar'. O servidor aparecerá na lista com status Ativo."
                    ]
                },
                {
                    titulo: "Como editar os dados de um servidor",
                    passos: [
                        "Na lista de servidores, encontre o servidor desejado usando a busca no topo.",
                        "Clique no nome do servidor para abrir o perfil completo.",
                        "No perfil, clique no botão 'Editar' (ícone de lápis).",
                        "Altere os campos necessários.",
                        "Clique em 'Salvar Alterações'. O sistema registrará a mudança automaticamente."
                    ]
                },
                {
                    titulo: "Como inativar um servidor desligado",
                    passos: [
                        "Abra o perfil do servidor.",
                        "Clique em 'Editar'.",
                        "Mude o campo 'Status' de 'Ativo' para 'Inativo'.",
                        "Preencha uma observação explicando o motivo (ex: 'Exonerado em 24/02/2026').",
                        "Salve as alterações. O servidor não aparecerá mais nos relatórios de ativos."
                    ]
                },
                {
                    titulo: "Como anexar documentos ao perfil",
                    passos: [
                        "Abra o perfil do servidor.",
                        "Role até a seção 'Anexos'.",
                        "Clique em 'Adicionar Anexo' e selecione o arquivo (PDF, JPG, PNG — máx. 5MB).",
                        "Aguarde o upload completar. O arquivo ficará listado com data de envio.",
                        "Para excluir um anexo, clique no ícone de lixeira ao lado do arquivo."
                    ]
                },
                {
                    titulo: "Como buscar um servidor",
                    passos: [
                        "Na tela de Servidores, use a barra de busca no topo.",
                        "Digite o nome, matrícula ou CPF do servidor.",
                        "A lista é filtrada em tempo real conforme você digita.",
                        "Use os filtros laterais para refinar por Setor, Vínculo ou Status (Ativo/Inativo)."
                    ]
                }
            ]
        },
        ferias: {
            title: "Controle de Férias",
            icon: "beach_access",
            color: "from-emerald-500 to-emerald-700",
            description: "Gerenciamento de solicitações e concessões de férias.",
            details: [
                {
                    subtitle: "O que é este módulo?",
                    content: "O módulo de Férias permite registrar, acompanhar e controlar os períodos de férias de todos os servidores. Também alerta sobre servidores que estão próximos de acumular dois períodos de férias (período concessivo vencendo)."
                },
                {
                    subtitle: "Campos do Registro de Férias",
                    items: [
                        { label: "Servidor", text: "Quem vai tirar as férias." },
                        { label: "Período Aquisitivo", text: "O ano de referência ao qual as férias se referem (ex: 2024)." },
                        { label: "Início", text: "Data de início do gozo das férias." },
                        { label: "Fim", text: "Data de retorno — calculada automaticamente." },
                        { label: "Dias", text: "Quantidade de dias de férias (ex: 30 dias)." }
                    ]
                },
                {
                    subtitle: "Status e Documentos",
                    content: "Cada registro pode ter status como Aguardando Aprovação, Aprovado ou Rejeitado. Ao aprovar, é possível gerar o Aviso de Férias (Modelo 33) ou Recesso de Férias em PDF, com número de documento automático."
                }
            ],
            steps: [
                {
                    titulo: "Como registrar uma solicitação de férias",
                    passos: [
                        "No menu lateral, clique em 'Férias'.",
                        "Clique no botão '+ Nova Solicitação' (canto superior direito).",
                        "No modal, selecione o servidor no campo de busca.",
                        "Informe a data de início das férias.",
                        "O sistema calcula automaticamente a data de fim com base nos dias de direito.",
                        "Clique em 'Salvar Solicitação'. O registro aparece com status 'Aguardando Aprovação'."
                    ]
                },
                {
                    titulo: "Como aprovar uma solicitação de férias",
                    passos: [
                        "Na lista da aba Férias, localize o registro com status 'Aguardando Aprovação'.",
                        "Clique nos três pontos (⋮) ou no botão de ações do registro.",
                        "Selecione 'Aprovar'. O status muda para 'Aprovado'.",
                        "O servidor passará a constar como 'Em Férias' no Dashboard durante o período."
                    ]
                },
                {
                    titulo: "Como gerar o Aviso de Férias (Modelo 33)",
                    passos: [
                        "Localize o registro de férias na lista.",
                        "Clique no ícone de impressora ou no menu de ações.",
                        "Selecione 'Aviso de Férias'. O sistema gerará um número único automático (ex: 001/2026).",
                        "O documento PDF será gerado com todos os dados preenchidos automaticamente.",
                        "Salve ou imprima o PDF gerado."
                    ]
                },
                {
                    titulo: "Como gerar o Recesso de Férias",
                    passos: [
                        "Localize o registro de férias na lista.",
                        "Clique no menu de ações do registro.",
                        "Selecione 'Recesso de Férias'.",
                        "O sistema atribui um número sequencial independente (ex: 001/2026 para RCF).",
                        "O PDF é gerado com os dados do servidor e o período de recesso."
                    ]
                },
                {
                    titulo: "Como verificar servidores próximos do vencimento",
                    passos: [
                        "Na aba Férias, role até a seção 'Próximos do Período Concessivo'.",
                        "Esta lista exibe servidores cujo período de 24 meses para tirar férias está vencendo.",
                        "Clique no nome do servidor para iniciar rapidamente uma solicitação de férias para ele.",
                        "O formulário abrirá pré-preenchido com os dados do servidor."
                    ]
                }
            ]
        },
        afastamentos: {
            title: "Afastamentos",
            icon: "medical_services",
            color: "from-amber-500 to-amber-700",
            description: "Registro de licenças e afastamentos diversos.",
            details: [
                {
                    subtitle: "O que é este módulo?",
                    content: "Registre qualquer tipo de ausência legal do servidor: licença médica, maternidade, paternidade, eleitoral, capacitação, prêmio, etc. Os afastamentos aparecem no Dashboard e em relatórios específicos."
                },
                {
                    subtitle: "Tipos de Afastamento",
                    items: [
                        { label: "Licença Médica", text: "Ausência por motivo de saúde, com atestado médico." },
                        { label: "Licença Maternidade", text: "Afastamento para gestantes (180 dias conforme lei municipal)." },
                        { label: "Licença Paternidade", text: "Afastamento para pais (prazo conforme legislação)." },
                        { label: "Licença Prêmio", text: "Licença concedida por tempo de serviço." },
                        { label: "Afastamento Eleitoral", text: "Para servidores em funções eleitorais." },
                        { label: "Capacitação / Treinamento", text: "Afastamento para cursos e aperfeiçoamento." }
                    ]
                },
                {
                    subtitle: "Documentação",
                    content: "É possível registrar o número do atestado, CID, e outros detalhes. Documentos comprobatórios podem ser referenciados nas observações do perfil do servidor."
                }
            ],
            steps: [
                {
                    titulo: "Como registrar um afastamento",
                    passos: [
                        "No menu lateral, clique em 'Afastamentos'.",
                        "Clique no botão '+ Novo Afastamento'.",
                        "Selecione o servidor, usando a busca por nome ou matrícula.",
                        "Escolha o tipo de afastamento na lista suspensa.",
                        "Informe a data de início e a data de retorno prevista.",
                        "Adicione observações relevantes (ex: CID, número do atestado).",
                        "Clique em 'Salvar'. O servidor ficará marcado como 'Afastado' no Dashboard."
                    ]
                },
                {
                    titulo: "Como encerrar um afastamento",
                    passos: [
                        "Na lista de afastamentos, localize o registro ativo.",
                        "Clique no menu de ações (⋮) do registro.",
                        "Selecione 'Encerrar Afastamento'.",
                        "Confirme a data real de retorno.",
                        "O status muda para 'Encerrado' e o servidor volta a constar como ativo."
                    ]
                },
                {
                    titulo: "Como consultar o histórico de afastamentos",
                    passos: [
                        "Na tela de Afastamentos, use o filtro de status e selecione 'Encerrado'.",
                        "Também é possível filtrar por período (data início e data fim).",
                        "Para ver os afastamentos de um servidor específico, abra o perfil dele e role até a seção de situações."
                    ]
                }
            ]
        },
        relatorios: {
            title: "Relatórios",
            icon: "description",
            color: "from-sky-500 to-sky-700",
            description: "Geração e exportação de relatórios em PDF.",
            details: [
                {
                    subtitle: "O que é este módulo?",
                    content: "A seção de Relatórios permite gerar documentos oficiais em PDF para diversas finalidades: lista de servidores, controle de férias, aniversariantes, ponto mensal, afastamentos e dossiês individuais."
                },
                {
                    subtitle: "Tipos de Relatórios",
                    items: [
                        { label: "Lista de Servidores", text: "Relação de todos os servidores com filtros por setor, vínculo, cargo, nome, matrícula e status." },
                        { label: "Relatório de Férias", text: "Lista de registros de férias filtrada por ano, setor e status." },
                        { label: "Aniversariantes", text: "Servidores que fazem aniversário em um determinado mês." },
                        { label: "Afastamentos", text: "Registros de afastamentos filtrados por período e tipo." },
                        { label: "Ponto Mensal (Frequência)", text: "Folha de frequência mensal para um servidor específico." },
                        { label: "Dossiê do Servidor", text: "Documento completo com todos os dados cadastrais do servidor." }
                    ]
                },
                {
                    subtitle: "Filtros e Exportação",
                    content: "Cada relatório possui filtros específicos que aparecem após a seleção. Após configurar os filtros, clique em 'Gerar Relatório' para produzir o PDF."
                }
            ],
            steps: [
                {
                    titulo: "Como gerar a Lista de Servidores",
                    passos: [
                        "No menu lateral, clique em 'Relatórios'.",
                        "No painel central, selecione 'Lista de Servidores'.",
                        "Os filtros aparecerão: preencha Nome, Matrícula, Setor, Vínculo, Cargo e/ou Status conforme necessário.",
                        "Deixe os campos em branco para incluir todos os servidores.",
                        "Clique em 'Gerar Relatório'. O PDF será aberto em uma nova aba."
                    ]
                },
                {
                    titulo: "Como gerar o Relatório de Férias",
                    passos: [
                        "Selecione 'Relatório de Férias' na lista de relatórios.",
                        "No painel de filtros, selecione o Ano desejado (padrão: ano atual).",
                        "Opcionalmente, filtre por Setor, Status ou Período (De/Até).",
                        "Clique em 'Gerar Relatório'. O PDF traz a lista de férias do período escolhido."
                    ]
                },
                {
                    titulo: "Como gerar o relatório de Aniversariantes",
                    passos: [
                        "Selecione 'Aniversariantes' na lista de relatórios.",
                        "No filtro, selecione o Mês e Ano de referência.",
                        "Clique em 'Gerar Relatório'. O PDF lista todos os aniversariantes do mês."
                    ]
                },
                {
                    titulo: "Como gerar o Ponto Mensal de um servidor",
                    passos: [
                        "Selecione 'Ponto Mensal (Frequência)' na lista de relatórios.",
                        "Na busca, digite o nome do servidor e selecione-o na lista.",
                        "Escolha o Mês e Ano de referência.",
                        "Clique em 'Gerar Relatório'. O PDF traz a folha de frequência individual."
                    ]
                },
                {
                    titulo: "Como gerar o Dossiê de um servidor",
                    passos: [
                        "Selecione 'Dossiê do Servidor' na lista de relatórios.",
                        "Na busca, digite o nome ou matrícula e selecione o servidor.",
                        "Clique em 'Gerar Relatório'. O PDF compila todos os dados cadastrais do servidor em um documento formal."
                    ]
                }
            ]
        },
        configuracoes: {
            title: "Configurações",
            icon: "settings",
            color: "from-slate-500 to-slate-700",
            description: "Gerenciamento de usuários e preferências do sistema.",
            details: [
                {
                    subtitle: "O que é este módulo?",
                    content: "Área administrativa para gerenciar usuários do sistema, alterar senhas, configurar preferências visuais e acessar logs. O acesso a algumas funcionalidades é restrito a administradores."
                },
                {
                    subtitle: "Preferências Pessoais",
                    items: [
                        { label: "Tema", text: "Alternância entre Modo Claro (Day) e Modo Escuro (Night)." },
                        { label: "Senha", text: "Altere sua senha de acesso." }
                    ]
                },
                {
                    subtitle: "Gestão de Usuários (Admin)",
                    items: [
                        { label: "Criar Usuário", text: "Adicionar novo login para um colaborador da equipe." },
                        { label: "Redefinir Senha", text: "Resetar a senha de um usuário que esqueceu o acesso." },
                        { label: "Excluir Usuário", text: "Remover o acesso de usuários desligados da equipe." }
                    ]
                }
            ],
            steps: [
                {
                    titulo: "Como alterar o tema do sistema",
                    passos: [
                        "No canto superior direito da tela, clique no ícone de sol ☀️ ou lua 🌙.",
                        "O sistema alterna entre Modo Claro e Modo Escuro instantaneamente.",
                        "A preferência é salva automaticamente para sua próxima sessão."
                    ]
                },
                {
                    titulo: "Como alterar sua própria senha",
                    passos: [
                        "No menu lateral, clique em 'Configurações'.",
                        "Na seção 'Minha Conta', clique em 'Alterar Senha'.",
                        "Digite sua senha atual e depois a nova senha duas vezes.",
                        "Clique em 'Salvar'. Será necessário fazer login novamente com a nova senha."
                    ]
                },
                {
                    titulo: "Como criar um novo usuário (Admin)",
                    passos: [
                        "No menu lateral, clique em 'Configurações'.",
                        "Role até a seção 'Usuários do Sistema'.",
                        "Clique em '+ Novo Usuário'.",
                        "Preencha o nome, e-mail e senha inicial do novo usuário.",
                        "Selecione o nível de acesso (Padrão ou Administrador).",
                        "Clique em 'Criar Usuário'. O colaborador poderá fazer login imediatamente."
                    ]
                },
                {
                    titulo: "Como redefinir a senha de um usuário (Admin)",
                    passos: [
                        "Na seção 'Usuários do Sistema', localize o usuário na tabela.",
                        "Clique no ícone de chave 🔑 ou no botão 'Redefinir Senha' na linha do usuário.",
                        "Confirme a ação no diálogo que aparecer.",
                        "Uma nova senha temporária será gerada. Informe-a ao usuário para que ele faça login e altere."
                    ]
                }
            ]
        }
    };

    const handleModuleClick = (key) => {
        setSelectedModule(key);
        setActiveTab('descricao');
    };

    return (
        <div className="space-y-6 relative">
            <AnimatePresence mode="wait">
                {!selectedModule ? (
                    <motion.div
                        key="grid"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-6"
                    >
                        <motion.div className="bg-gradient-to-r from-primary/10 to-transparent p-6 rounded-2xl border border-primary/10 flex justify-between items-center flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/20 rounded-xl">
                                    <span className="material-symbols-outlined text-primary text-3xl">school</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Central de Ajuda</h1>
                                    <p className="text-slate-600 dark:text-slate-400">Selecione um módulo para ver descrição e passo a passo.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsSupportModalOpen(true)}
                                className="bg-primary hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95"
                            >
                                <span className="material-symbols-outlined">support_agent</span>
                                Suporte Técnico
                            </button>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Object.entries(tutorialData).map(([key, data]) => (
                                <TutorialCard
                                    key={key}
                                    icon={data.icon}
                                    title={data.title}
                                    description={data.description}
                                    color={data.color}
                                    stepsCount={data.steps.length}
                                    variants={itemVariants}
                                    onClick={() => handleModuleClick(key)}
                                />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="detail"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-6"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedModule(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                            >
                                <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">arrow_back</span>
                            </button>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">{tutorialData[selectedModule].icon}</span>
                                {tutorialData[selectedModule].title}
                            </h2>
                            <button
                                onClick={() => setIsSupportModalOpen(true)}
                                className="ml-auto bg-primary hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm shadow-md transition-all"
                            >
                                <span className="material-symbols-outlined text-lg">support_agent</span>
                                Suporte
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
                            <button
                                onClick={() => setActiveTab('descricao')}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'descricao'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">info</span>
                                    Descrição
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('passo-a-passo')}
                                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'passo-a-passo'
                                    ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">format_list_numbered</span>
                                    Passo a Passo
                                </span>
                            </button>
                        </div>

                        {/* Tab Content */}
                        <AnimatePresence mode="wait">
                            {activeTab === 'descricao' ? (
                                <motion.div
                                    key="desc"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="grid gap-6"
                                >
                                    {tutorialData[selectedModule].details.map((section, idx) => (
                                        <div key={idx} className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark">
                                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 border-b border-border-light dark:border-border-dark pb-2">
                                                {section.subtitle}
                                            </h3>
                                            {section.content && (
                                                <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                                                    {section.content}
                                                </p>
                                            )}
                                            {section.items && (
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    {section.items.map((item, i) => (
                                                        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                                                            <span className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{item.label}</span>
                                                            <span className="text-sm text-slate-500 dark:text-slate-400">{item.text}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="steps"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className="grid gap-6"
                                >
                                    {tutorialData[selectedModule].steps.map((tutorial, idx) => (
                                        <div key={idx} className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark">
                                            <div className="flex items-center gap-3 mb-5">
                                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                    {idx + 1}
                                                </div>
                                                <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                                                    {tutorial.titulo}
                                                </h3>
                                            </div>
                                            <ol className="space-y-3">
                                                {tutorial.passos.map((passo, pi) => (
                                                    <li key={pi} className="flex gap-4 items-start">
                                                        <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-primary/40 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                                                            {pi + 1}
                                                        </span>
                                                        <span className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{passo}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Support Modal */}
            <AnimatePresence>
                {isSupportModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSupportModalOpen(false)}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700"
                        >
                            <div className="p-6 bg-primary text-white flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined">support_agent</span>
                                    Fale com o Suporte
                                </h3>
                                <button onClick={() => setIsSupportModalOpen(false)} className="hover:bg-white/20 p-1 rounded-full text-white transition-colors">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                <p className="text-slate-600 dark:text-slate-300 text-center">
                                    Precisa de ajuda? Entre em contato com nossa equipe técnica:
                                </p>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">WhatsApp</h4>
                                    <button
                                        onClick={() => handleWhatsApp('98987481998')}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 transition-all group"
                                    >
                                        <div className="bg-green-500 text-white p-2 rounded-lg">
                                            <span className="material-symbols-outlined text-xl">chat</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">Alexander Sousa</div>
                                            <div className="text-sm opacity-80">(98) 98748-1998</div>
                                        </div>
                                        <span className="material-symbols-outlined ml-auto opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                                    </button>

                                    <button
                                        onClick={() => handleWhatsApp('98986101224')}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 transition-all group"
                                    >
                                        <div className="bg-green-500 text-white p-2 rounded-lg">
                                            <span className="material-symbols-outlined text-xl">chat</span>
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold">Jairon Ribeiro</div>
                                            <div className="text-sm opacity-80">(98) 98610-1224</div>
                                        </div>
                                        <span className="material-symbols-outlined ml-auto opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center text-xs text-slate-500">
                                Horário de atendimento: Segunda a Sexta, das 08:00 às 18:00
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TutorialCard = ({ icon, title, description, color, stepsCount, onClick, variants }) => (
    <motion.div
        variants={variants}
        onClick={onClick}
        className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark hover:shadow-lg hover:border-primary/30 transition-all duration-300 group cursor-pointer"
    >
        <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 bg-gradient-to-br ${color} rounded-xl shadow-md`}>
                <span className="material-symbols-outlined text-white text-2xl">{icon}</span>
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white group-hover:text-primary transition-colors flex items-center gap-2">
                    {title}
                    <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
            </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 border-t border-border-light dark:border-border-dark pt-3 mt-2">
            <span className="material-symbols-outlined text-sm">format_list_numbered</span>
            <span>{stepsCount} procedimento{stepsCount !== 1 ? 's' : ''} documentado{stepsCount !== 1 ? 's' : ''}</span>
        </div>
    </motion.div>
);

export default Help;
