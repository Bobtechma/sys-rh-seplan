# ⚡ Antigravity Master Guide: Sys RH SEPLAN

Este documento é a "Fonte de Verdade" e o manual de execução rigoroso para manter a consistência, usabilidade e estabilidade do sistema **Sys RH SEPLAN** (Prefeitura de São Luís). Utilize estas diretrizes como restrições (constraints) inegociáveis para todas as atualizações via Antigravity.

---

## 💼 1. Identidade & Contexto do Sistema
* **Nome do Sistema:** Sys RH SEPLAN
* **Tipo:** Dashboard Administrativo / SaaS Interno (Gestão de Recursos Humanos).
* **Foco Principal:** Densidade de dados, clareza visual, facilidade de filtragem e segurança da informação.
* **Idioma Oficial:** Português (Brasil).

---

## 🎨 2. Design System & Design Tokens
**[SKILL: UI CONSISTENCY]**

O Antigravity deve usar estritamente a paleta de cores abaixo (baseada no padrão Tailwind CSS visualizado):

### Variáveis CSS (Paleta Oficial do Dashboard)
```css
:root {
  /* Cores Principais (Ações e Destaques) */
  --rh-primary-blue: #2563EB;     /* Azul principal (Botões como "+ Adicionar Servidor") */
  --rh-active-bg: #EFF6FF;        /* Azul super claro (Fundo do item ativo no menu lateral) */
  --rh-active-text: #1D4ED8;      /* Azul escuro (Texto do item ativo no menu lateral) */
  
  /* Cores de Fundo (Backgrounds) */
  --rh-bg-app: #F9FAFB;           /* Fundo geral da aplicação (Cinza ultra-claro) */
  --rh-bg-surface: #FFFFFF;       /* Fundo de cards, tabelas e modais (Branco puro) */
  
  /* Escala de Cinzas (Tipografia e Bordas) */
  --rh-text-dark: #111827;        /* Títulos principais (ex: "Visão Geral") */
  --rh-text-main: #374151;        /* Texto comum das tabelas (Nomes de servidores) */
  --rh-text-muted: #6B7280;       /* Texto de apoio (Matrículas, labels de filtros) */
  --rh-border: #E5E7EB;           /* Bordas de cards, inputs e divisórias de tabela */
  
  /* Cores Semânticas (Usadas em ícones de relatórios e gráficos) */
  --rh-icon-purple: #8B5CF6;
  --rh-icon-orange: #F97316;
  --rh-icon-teal: #14B8A6;
  --rh-icon-red: #EF4444;
}
```

---

## 🧩 3. Padrões de Componentes Estritos

### Tipografia e Espaçamento
* **Fontes:** Sem serifa, limpa e legível (Inter/Roboto).
* **Bordas (Border Radius):** Cards, inputs e botões devem usar bordas levemente arredondadas (equivalente a `border-radius: 8px` ou `rounded-lg` no Tailwind).

### Tabelas de Dados (Data Grids)
* **Estrutura:** Fundo branco (`--rh-bg-surface`), sem divisórias verticais. Apenas linhas horizontais finas (`--rh-border`) separando os registros.
* **Cabeçalhos (th):** Texto em caixa alta (uppercase), fonte pequena, cor `--rh-text-muted` e negrito sutil.
* **Avatares de Iniciais:** Círculos com fundo azul claro e texto azul escuro (ex: "AN" para Adailton Nunes).
* **Ações:** Ícones de ação (como o ícone de "olho" para visualizar) devem ficar alinhados à extrema direita, em cor cinza discreta.

### Formulários e Filtros
* **Inputs/Selects:** Fundo branco, borda cinza clara (`--rh-border`), texto cinza escuro. Altura confortável (aprox. 40px - 44px).
* **Layout de Filtros:** Sempre agrupados em um bloco ou card próprio no topo da página (como visto na tela "Servidores Públicos"), com botão "Limpar Filtros" discreto (texto azul).

### Cards (Dashboard e Relatórios)
* Fundo branco puro, borda ou sombra ultra-leve (drop-shadow-sm).
* Ícones envolvidos por um pequeno bloco com cantos arredondados e cor de fundo translúcida correspondente à cor do ícone.

---

## 🚀 4. Superpoderes do Antigravity (Regras de Execução)

### 🛡️ Skill 1: Zero Regression Policy (Gestão de Estado) - *DIRETRIZ PRINCIPAL*
- **Regra:** Por ser um sistema React/Next.js/Vue (baseado em estados), o Antigravity é ESTRITAMENTE PROIBIDO de remover ou alterar *Hooks* de estado (`useState`, `useEffect`), chamadas de API ou lógicas de paginação/filtros já existentes sem comando explícito. Adições devem ser modulares.

### 📐 Skill 2: Data Density & Spacing
- **Regra:** Não adicione espaçamentos (`padding`/`margin`) exagerados. O painel precisa exibir muitos dados na tela sem forçar a rolagem desnecessária. Mantenha a densidade visual equilibrada (nem muito esmagado, nem muito vazio).

### 📱 Skill 3: Table Responsiveness (Mobile)
- **Regra:** Nenhuma tabela ("table", "grid") pode quebrar a tela (causar *overflow* invisível). Em telas menores (`< 1024px`), tabelas complexas devem ganhar `overflow-x-auto` para rolagem horizontal ou serem convertidas em listas de *Cards*.

### 🔔 Skill 4: Feedback Visual Rigoroso
- **Regra:** Toda ação de mutação (Adicionar, Editar, Excluir um Servidor, Gerar PDF) DEVE incluir estado de *Loading* (botão desabilitado com spinner) e exibir um *Toast/Notificação* ao concluir ou falhar.

### 🔗 Skill 5: Menu Lateral (Sidebar Sync)
- **Regra:** Ao criar uma nova tela ou módulo (ex: "Avaliações"), o novo item deve ser adicionado ao Menu Lateral (Sidebar). O item ativo deve SEMPRE receber a classe/estilo de fundo azul claro (`--rh-active-bg`) e texto azul (`--rh-active-text`).

---

## 🚨 5. Checklist de Validação (Pre-Commit)
O Antigravity deve processar este checklist silenciosamente antes de confirmar a alteração de código:

- [ ] **Zero Regressão?** As rotas de navegação, paginação e filtros da tabela anterior continuam intactos? Nenhuma funcionalidade quebrou?
- [ ] **Padrão Tailwind/Cores?** Foi usado o azul correto (`#2563EB`) para ações primárias em vez de cores aleatórias?
- [ ] **Alinhamento da Tabela?** As novas colunas da tabela estão alinhadas corretamente (textos à esquerda, valores/ações à direita)?
- [ ] **Estados de Interface?** Foram tratados os cenários de "Dados Vazios" (Empty State) ou "Carregando" na nova tela?
- [ ] **Idioma?** Todos os novos rótulos, botões e alertas estão em Português (Brasil)?

---
*Ficheiro otimizado para IA (Antigravity). Configurado para Sistemas de Gestão/Dashboard com foco em integridade de dados.*