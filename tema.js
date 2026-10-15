// ============================================================
// TEMA + ACESSIBILIDADE — Ciclo de temas, fonte e contraste
// ============================================================
// Este arquivo cuida de:
//   1) Aplicar/alternar TEMA (claro, escuro, rosa, verde, oceano, meianoite, fogo)
//   2) Ciclar TAMANHO DA FONTE (normal → grande → gigante → normal)
//   3) Alternar CONTRASTE (normal ↔ alto)
//   4) Resetar tudo ao padrão
//   5) Abrir/fechar o painel de acessibilidade
// ============================================================


// ============================================================
// CONSTANTES — listas e nomes amigáveis
// ============================================================

// Tamanhos possíveis de fonte
const FONTES = ["normal", "grande", "gigante"];

// Modos de contraste
const CONTRASTES = ["normal", "alto"];

// Temas disponíveis (o botão cicla por todos nesta ordem)
const TEMAS = ["claro", "escuro", "rosa", "verde", "oceano", "meianoite", "fogo"];

// Nomes amigáveis que aparecem nos botões
const NOMES_TEMAS = {
    "claro":      "☀️ Claro",
    "escuro":     "🌙 Escuro",
    "rosa":       "🌸 Rosa",
    "verde":      "🌿 Verde",
    "oceano":     "🌊 Oceano",
    "meianoite":  "🌌 Meia-noite",
    "fogo":       "🔥 Fogo"
};


// ============================================================
// TEMA
// ============================================================

/**
 * Aplica um tema específico.
 * Salva no localStorage e atualiza os botões.
 */
function aplicarTema(tema) {
    if (!TEMAS.includes(tema)) tema = "claro";

    document.documentElement.setAttribute("data-tema", tema);
    localStorage.setItem("desafiei_tema", tema);
    atualizarBotoes();
}

/**
 * Alterna para o próximo tema da lista (ciclo).
 */
function alternarTema() {
    const atual = document.documentElement.getAttribute("data-tema") || "claro";
    const idx = TEMAS.indexOf(atual);
    const proximo = TEMAS[(idx + 1) % TEMAS.length];   // se chegar no fim, volta ao começo
    aplicarTema(proximo);
}


// ============================================================
// FONTE
// ============================================================

/**
 * Aplica um tamanho de fonte específico.
 */
function aplicarFonte(tamanho) {
    if (!FONTES.includes(tamanho)) tamanho = "normal";

    document.documentElement.setAttribute("data-fonte", tamanho);
    localStorage.setItem("desafiei_fonte", tamanho);
    atualizarBotoes();
}

/**
 * Cicla entre os tamanhos de fonte: normal → grande → gigante → normal
 */
function ciclarFonte() {
    const atual = document.documentElement.getAttribute("data-fonte") || "normal";
    const idx = FONTES.indexOf(atual);
    const proximo = FONTES[(idx + 1) % FONTES.length];
    aplicarFonte(proximo);
}


// ============================================================
// CONTRASTE
// ============================================================

/**
 * Aplica um modo de contraste específico.
 */
function aplicarContraste(modo) {
    if (!CONTRASTES.includes(modo)) modo = "normal";

    document.documentElement.setAttribute("data-contraste", modo);
    localStorage.setItem("desafiei_contraste", modo);
    atualizarBotoes();
}

/**
 * Alterna entre contraste normal e alto.
 */
function ciclarContraste() {
    const atual = document.documentElement.getAttribute("data-contraste") || "normal";
    const proximo = atual === "normal" ? "alto" : "normal";
    aplicarContraste(proximo);
}


// ============================================================
// RESET — Volta tudo ao padrão
// ============================================================
function resetarAcessibilidade() {
    aplicarTema("claro");
    aplicarFonte("normal");
    aplicarContraste("normal");
    atualizarBotoes();
}


// ============================================================
// ATUALIZA OS TEXTOS DOS BOTÕES
// ============================================================
function atualizarBotoes() {
    const tema      = document.documentElement.getAttribute("data-tema") || "claro";
    const fonte     = document.documentElement.getAttribute("data-fonte") || "normal";
    const contraste = document.documentElement.getAttribute("data-contraste") || "normal";

    // 🔥 No celular, mostra só o emoji (economia de espaço)
    const ehCelular = window.innerWidth <= 700;
    const nomeCompleto = NOMES_TEMAS[tema] || "☀️ Claro";
    const soEmoji = nomeCompleto.split(" ")[0];  // pega só o emoji

    const textoBotaoTema = ehCelular ? soEmoji : nomeCompleto;

    // Botão do tema no MENU
    const btnTemaMenu = document.getElementById("btn-tema");
    if (btnTemaMenu) btnTemaMenu.textContent = textoBotaoTema;

    // Botão do tema no PAINEL (esse sempre mostra completo)
    const btnTemaPainel = document.getElementById("btn-tema-painel");
    if (btnTemaPainel) btnTemaPainel.textContent = nomeCompleto;

    // 🔤 Botão de fonte
    const btnFonte = document.getElementById("btn-fonte");
    if (btnFonte) {
        const labels = { normal: "A", grande: "A+", gigante: "A++" };
        btnFonte.textContent = `🔤 ${labels[fonte] || "A"}`;
    }

    // 🔲 Botão de contraste
    const btnContraste = document.getElementById("btn-contraste");
    if (btnContraste) {
        btnContraste.textContent = contraste === "alto" ? "🔲 Alto" : "🔲 Normal";
    }
}

// 🔥 Atualiza o botão quando o usuário gira ou redimensiona a tela
window.addEventListener("resize", () => {
    if (typeof atualizarBotoes === "function") atualizarBotoes();
});


// ============================================================
// PAINEL DE ACESSIBILIDADE (abre/fecha)
// ============================================================

/**
 * Abre/fecha o painel de acessibilidade.
 * Chamado pelo botão ♿ (id="btn-acessibilidade").
 */
function alternarPainelAcessibilidade(event) {
    if (event) event.stopPropagation();   // evita que o clique feche o painel imediatamente

    const painel = document.getElementById("painel-acessibilidade");
    if (!painel) return;
    painel.classList.toggle("aberto");
}

// Fecha o painel ao clicar FORA dele
document.addEventListener("click", (e) => {
    const painel = document.getElementById("painel-acessibilidade");
    const botao  = document.getElementById("btn-acessibilidade");
    if (!painel || !botao) return;

    // Se o clique foi fora do painel E fora do botão, fecha
    if (!painel.contains(e.target) && !botao.contains(e.target)) {
        painel.classList.remove("aberto");
    }
});

// Fecha o painel ao apertar ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        const painel = document.getElementById("painel-acessibilidade");
        if (painel) painel.classList.remove("aberto");
    }
});


// ============================================================
// INICIALIZAÇÃO — aplica tema salvo OU preferência do sistema
// ============================================================
window.addEventListener("DOMContentLoaded", () => {

    // 1) Tema: prioridade = localStorage > sistema > claro
    let temaSalvo = localStorage.getItem("desafiei_tema");

    if (!temaSalvo) {
        // Detecta preferência do sistema
        const prefereEscuro = window.matchMedia &&
                              window.matchMedia("(prefers-color-scheme: dark)").matches;
        temaSalvo = prefereEscuro ? "escuro" : "claro";
    }

    aplicarTema(temaSalvo);
    aplicarFonte(localStorage.getItem("desafiei_fonte") || "normal");
    aplicarContraste(localStorage.getItem("desafiei_contraste") || "normal");
    atualizarBotoes();

    console.log("🎨 tema.js carregado. Tema atual:", temaSalvo);
});

// 🔥 Escuta mudanças de preferência do sistema EM TEMPO REAL
if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        // Só troca automaticamente se o usuário NUNCA escolheu manualmente
        if (!localStorage.getItem("desafiei_tema")) {
            aplicarTema(e.matches ? "escuro" : "claro");
        }
    });
}