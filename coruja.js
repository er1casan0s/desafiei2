// ============================================================
// Coruja Guia — Tutorial interativo COM NOME + SAUDAÇÃO
// ============================================================

let nomeAluno = "";
let primeiroNome = "";


// ------------------------------------------------------------
// Busca o nome do aluno na API
// ------------------------------------------------------------
async function carregarNomeAluno() {
    try {
        const resp = await fetch("/api/meu-perfil");
        if (!resp.ok) return;
        const u = await resp.json();
        nomeAluno = u.nome || "";
        primeiroNome = nomeAluno.split(" ")[0] || "";
    } catch (e) {
        console.warn("Erro ao carregar nome:", e);
    }
}


// ------------------------------------------------------------
// Saudação dinâmica
// ------------------------------------------------------------
function getSaudacao() {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12)  return "Bom dia";
    if (hora >= 12 && hora < 18) return "Boa tarde";
    return "Boa noite";
}


// ------------------------------------------------------------
// Array de passos — SEMPRE uma função que gera novo array
// ------------------------------------------------------------
function getPassosTutorial() {
    const oNome = primeiroNome || "estudante";
    const saudacao = getSaudacao();

    return [
        { emoji: "🦉", texto: `${saudacao}, <strong>${oNome}</strong>! Eu sou a Coruja do Desafiei! Vou te mostrar como funciona o site.` },
        { emoji: "📚", texto: `Aqui, <strong>${oNome}</strong>, ficam seus desafios diários de <strong>Português</strong>, <strong>Matemática</strong> e <strong>Conhecimentos Gerais</strong>!` },
        { emoji: "⭐", texto: `Cada acerto te dá <strong>XP</strong>! E das <strong>17h às 23h59</strong> o XP é <strong>DOBRADO</strong>, ${oNome}! 🌙` },
        { emoji: "🔥", texto: `Mantenha a <strong>ofensiva</strong>: entre todo dia para não perder sua sequência!` },
        { emoji: "🏆", texto: `Suba de <strong>Latão</strong> até <strong>Diamante</strong>! São <strong>10 estágios</strong> para conquistar.` },
        { emoji: "🌙", texto: `De <strong>madrugada (0h às 5h)</strong> você só pode revisar e fazer anotações. Hora de descansar!` },
        { emoji: "👥", texto: `Crie <strong>grupos de estudo</strong> e convide amigos pelo link, ${oNome}!` },
        { emoji: "🎉", texto: `Prontinho, <strong>${oNome}</strong>! Se eu desaparecer, clique em mim de novo ali no cantinho. Bom estudo! 🚀` }
    ];
}


// ------------------------------------------------------------
// Estado
// ------------------------------------------------------------
let passosTutorial = [];
let passoAtual = 0;
let tutorialAberto = false;


// ------------------------------------------------------------
// Iniciar / fechar / navegar
// ------------------------------------------------------------
function iniciarTutorial() {
    passosTutorial = getPassosTutorial();
    passoAtual = 0;
    tutorialAberto = true;
    mostrarPasso();
}

function fecharTutorial() {
    const balao = document.getElementById("coruja-balao");
    if (balao) balao.classList.remove("ativo");
    tutorialAberto = false;
    localStorage.setItem("desafiei_tutorial_visto", "1");
}

function proximoPasso() {
    passoAtual++;
    if (passoAtual >= passosTutorial.length) {
        fecharTutorial();
    } else {
        mostrarPasso();
    }
}

function passoAnterior() {
    if (passoAtual > 0) {
        passoAtual--;
        mostrarPasso();
    }
}


// ------------------------------------------------------------
// Renderiza o balão — usa addEventListener (mais confiável!)
// ------------------------------------------------------------
function mostrarPasso() {
    const balao = document.getElementById("coruja-balao");
    if (!balao) return;

    if (passoAtual < 0) passoAtual = 0;
    if (passoAtual >= passosTutorial.length) passoAtual = passosTutorial.length - 1;

    const passo = passosTutorial[passoAtual];
    const primeiro = passoAtual === 0;
    const ultimo = passoAtual === passosTutorial.length - 1;

    const bolinhas = passosTutorial.map((_, i) => `
        <span style="
            display:inline-block;
            width:7px;height:7px;
            border-radius:50%;
            margin:0 2px;
            background:${i === passoAtual ? 'var(--primaria)' : 'var(--borda)'};
        "></span>
    `).join("");

    balao.classList.add("ativo");
    balao.innerHTML = `
        <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="font-size:38px;line-height:1">${passo.emoji}</span>
            <div style="flex:1;min-width:0">
                <p style="margin-bottom:14px;font-size:14px;line-height:1.5">
                    ${passo.texto}
                </p>
                <div style="margin-bottom:12px;text-align:center">${bolinhas}</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">
                    <button id="btn-anterior" class="btn btn-secundario"
                        style="padding:8px 14px;font-size:13px;display:${primeiro ? 'none' : 'inline-flex'}">
                        ⬅️ Anterior
                    </button>
                    <button id="btn-proximo" class="btn" style="padding:8px 14px;font-size:13px">
                        ${ultimo ? '✅ Concluir' : 'Próximo ➡️'}
                    </button>
                    <button id="btn-pular" class="btn btn-secundario"
                        style="padding:8px 14px;font-size:13px;display:${ultimo ? 'none' : 'inline-flex'}">
                        Pular
                    </button>
                </div>
            </div>
        </div>
    `;

    // 🔥 AQUI ESTÁ A CORREÇÃO: usar addEventListener em vez de onclick inline
    const btnProx = document.getElementById("btn-proximo");
    const btnAnt = document.getElementById("btn-anterior");
    const btnPul = document.getElementById("btn-pular");

    if (btnProx) {
        btnProx.addEventListener("click", (e) => {
            e.stopPropagation();
            if (ultimo) fecharTutorial();
            else proximoPasso();
        });
    }
    if (btnAnt) {
        btnAnt.addEventListener("click", (e) => {
            e.stopPropagation();
            passoAnterior();
        });
    }
    if (btnPul) {
        btnPul.addEventListener("click", (e) => {
            e.stopPropagation();
            fecharTutorial();
        });
    }
}


// ------------------------------------------------------------
// Inicialização
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", async () => {
    await carregarNomeAluno();

    const coruja = document.getElementById("coruja-guia");
    const balao = document.getElementById("coruja-balao");
    if (!coruja || !balao) return;

    coruja.addEventListener("click", (e) => {
        e.stopPropagation();
        if (tutorialAberto) fecharTutorial();
        else iniciarTutorial();
    });

    document.addEventListener("click", (e) => {
        if (!tutorialAberto) return;
        if (!balao.contains(e.target) && !coruja.contains(e.target)) {
            fecharTutorial();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && tutorialAberto) fecharTutorial();
    });

    if (!localStorage.getItem("desafiei_tutorial_visto")) {
        setTimeout(iniciarTutorial, 1200);
    }
});