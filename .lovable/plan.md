

# 🎯 Sistema de Simulados INSS

Sistema completo de preparação para o concurso de Técnico do Seguro Social, com visual colorido e motivacional, gamificação e backend Supabase.

---

## 🗄️ Banco de Dados (Supabase)

### Tabelas
- **profiles** — nome, avatar, data de cadastro (criado automaticamente no signup)
- **user_roles** — controle de papéis (admin/user) em tabela separada com função `has_role` security definer
- **subjects** — matérias (Português, RLM, Direito Administrativo, etc.)
- **topics** — assuntos dentro de cada matéria
- **questions** — enunciado, alternativas (A-E), resposta correta, comentário/justificativa, matéria, assunto, nível de dificuldade
- **exams** — simulados realizados: usuário, configuração (matérias, quantidade, tempo), data
- **exam_answers** — respostas do aluno por questão, marcações, tempo gasto por questão

### Segurança (RLS)
- Alunos só acessam seus próprios dados
- Admins gerenciam questões e visualizam estatísticas gerais
- Função `has_role()` security definer para evitar recursão

---

## 🔐 Autenticação

- Tela de **Login** com email/senha — visual motivacional com ilustração temática INSS
- Tela de **Cadastro** com nome, email e senha
- **Recuperação de senha** com envio de email e página de redefinição (`/reset-password`)
- Rotas protegidas: redireciona para login se não autenticado
- Rota `/admin` protegida por role admin

---

## 🏠 Painel do Aluno (Dashboard)

- **Boas-vindas** personalizada com nome do aluno
- **Cards de estatísticas**: total de simulados, taxa de acerto geral, tempo médio por questão, questões respondidas
- **Gráfico de evolução** — desempenho ao longo do tempo (linha) usando Recharts
- **Desempenho por matéria** — gráfico de barras/radar mostrando % de acerto por disciplina
- **Histórico de simulados** — lista com data, nota, matérias e tempo, com opção de revisar
- Cores vibrantes, ícones motivacionais, badges de conquista

---

## 📝 Gerador de Simulados

- Seleção de **matérias** com checkboxes coloridos (multi-seleção)
- **Quantidade de questões** configurável (slider ou input: 10, 20, 30, 40, 50)
- **Modo**: Aleatório (mistura matérias) ou Temático (uma matéria por vez)
- **Cronômetro**: configurar tempo total (30min, 1h, 2h, personalizado) ou sem limite
- Botão "Iniciar Simulado" com animação motivacional

---

## ⏱️ Tela do Simulado

- **Cronômetro regressivo** fixo no topo com alerta visual nos últimos 5 minutos
- **Navegação lateral** com grid de números das questões (coloridos: respondida, marcada, não respondida)
- **Questão** com enunciado e alternativas (A-E) em cards clicáveis
- **Botão marcar** para revisão posterior (ícone de bandeira)
- **Navegação**: botões Anterior/Próxima + grid de navegação rápida
- **Finalização**: botão finalizar ou automática ao acabar o tempo, com confirmação
- Design limpo e focado para não distrair durante a prova

---

## 📊 Resultado do Simulado

- **Nota/Percentual** de acerto com animação de destaque
- **Tempo total** gasto
- **Desempenho por matéria** com barras de progresso coloridas
- **Comparação** com a média geral de todos os usuários
- **Gabarito detalhado**: lista de questões com resposta do aluno, resposta correta e comentário/justificativa
- Questões erradas destacadas em vermelho, certas em verde
- Botão para revisar questões erradas

---

## ⚙️ Painel Administrativo (`/admin`)

- Acesso apenas para usuários com role **admin**
- **Dashboard admin**: total de questões, usuários cadastrados, simulados realizados
- **Gerenciar Questões**: tabela com filtros por matéria/assunto, editar, excluir
- **Cadastro de questão**: formulário com enunciado, 5 alternativas, resposta correta, comentário, matéria e assunto
- **Importação em massa**: upload de arquivo CSV/JSON com parser e preview antes de confirmar
- **Gerenciar Matérias e Assuntos**: CRUD simples

---

## 🎨 Design e UX

- Paleta vibrante: gradientes de roxo, azul e verde, com acentos em laranja/amarelo
- Ícones motivacionais e emojis nos títulos
- Cards com sombras coloridas e bordas arredondadas
- Animações sutis de transição entre páginas
- Layout responsivo (desktop e mobile)
- Sidebar de navegação com ícones: Dashboard, Novo Simulado, Histórico, (Admin)
- Feedback visual com toasts de sucesso/erro

