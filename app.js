// ============================================================
// DESAFIEI 2.0 — JavaScript principal
// Cuida de login, cadastro, desafios, XP, ranking e grupos
// ============================================================

// ============================================================
// CONSTANTES GLOBAIS (estágios — precisam bater com o backend!)
// ============================================================
const ESTAGIOS = [
    { nome: "Latão I",   min_xp: 0    },
    { nome: "Latão II",  min_xp: 100  },
    { nome: "Bronze",    min_xp: 300  },
    { nome: "Prata",     min_xp: 600  },
    { nome: "Ouro",      min_xp: 1000 },
    { nome: "Platina",   min_xp: 1600 },
    { nome: "Esmeralda", min_xp: 2400 },
    { nome: "Rubi",      min_xp: 3400 },
    { nome: "Mestre",    min_xp: 4800 },
    { nome: "Diamante",  min_xp: 7000 },
];


// ============================================================
// FUNÇÕES DE PROGRESSO E ESTÁGIO
// ============================================================
function calcularProgresso(xp) {
    let atual = ESTAGIOS[0];
    let proximo = null;

    for (let i = 0; i < ESTAGIOS.length; i++) {
        if (xp >= ESTAGIOS[i].min_xp) {
            atual = ESTAGIOS[i];
            proximo = ESTAGIOS[i + 1] || null;
        }
    }

    if (!proximo) {
        return { atual, proximo, percentual: 100, faltam: 0 };
    }

    const range = proximo.min_xp - atual.min_xp;
    const progresso = xp - atual.min_xp;
    const percentual = Math.min(100, Math.round((progresso / range) * 100));
    const faltam = proximo.min_xp - xp;

    return { atual, proximo, percentual, faltam };
}

function classeEstagio(nome) {
    if (!nome) return "badge-latao";
    if (nome.includes("Latão"))     return "badge-latao";
    if (nome.includes("Bronze"))    return "badge-bronze";
    if (nome.includes("Prata"))     return "badge-prata";
    if (nome.includes("Ouro"))      return "badge-ouro";
    if (nome.includes("Platina"))   return "badge-platina";
    if (nome.includes("Esmeralda")) return "badge-esmeralda";
    if (nome.includes("Rubi"))      return "badge-rubi";
    if (nome.includes("Mestre"))    return "badge-mestre";
    if (nome.includes("Diamante"))  return "badge-diamante";
    return "badge-latao";
}


// ============================================================
// AUTENTICAÇÃO
// ============================================================
async function fazerCadastro(event) {
    event.preventDefault();
    const form = event.target;
    const dados = new FormData(form);

    const resp = await fetch("/cadastro", { method: "POST", body: dados });
    const json = await resp.json();

    if (json.erro) {
        alert("⚠️ " + json.erro);
        return;
    }
    window.location.href = json.redirect;
}

async function fazerLogin(event) {
    event.preventDefault();
    const form = event.target;
    const dados = new FormData(form);

    const resp = await fetch("/login", { method: "POST", body: dados });
    const json = await resp.json();

    if (json.erro) {
        alert("⚠️ " + json.erro);
        return;
    }
    window.location.href = json.redirect;
}


// ============================================================
// CABEÇALHO DO USUÁRIO (avatar, nome, ofensiva e barra de XP)
// ============================================================
async function atualizarCabecalho() {
    const resp = await fetch("/api/meu-perfil");
    if (!resp.ok) return;
    const u = await resp.json();

    // ----- Avatar -----
    const avatarEl = document.getElementById("avatar-usuario");
    if (avatarEl) {
        if (u.foto) {
            avatarEl.innerHTML = `<img src="${u.foto}" alt="Avatar">`;
        } else {
            avatarEl.textContent = u.avatar_emoji || "🦉";
        }
    }

    // ----- Nome e infos -----
    const nomeEl = document.getElementById("nome-usuario");
    if (nomeEl) nomeEl.textContent = `Olá, ${u.nome}! 👋`;

    const infoEl = document.getElementById("info-usuario");
    if (infoEl) {
        infoEl.innerHTML = `
            ${u.idade} anos •
            <span class="badge-estagio ${classeEstagio(u.estagio)}">${u.estagio}</span>
        `;
    }

    // ----- Ofensiva -----
    const ofensivaEl = document.getElementById("ofensiva-valor");
    if (ofensivaEl) {
        const qtdOfensiva = u.ofensiva || 0;
        ofensivaEl.textContent = `${qtdOfensiva} ${qtdOfensiva === 1 ? "dia" : "dias"}`;
    }

    // ----- Barra de progresso -----
    const { atual, proximo, percentual, faltam } = calcularProgresso(u.xp);

    const xpAtualEl = document.getElementById("xp-atual");
    if (xpAtualEl) xpAtualEl.textContent = `${u.xp} XP`;

    const barraEl = document.getElementById("barra-progresso");
    if (barraEl) barraEl.style.width = `${percentual}%`;

    const textoBarraEl = document.getElementById("texto-barra");
    if (textoBarraEl) textoBarraEl.textContent = `${percentual}%`;

    // ----- Pills -----
    const statEstagioEl = document.getElementById("stat-estagio");
    if (statEstagioEl) statEstagioEl.textContent = u.estagio;

    const statXpEl = document.getElementById("stat-xp");
    if (statXpEl) statXpEl.textContent = u.xp;

    const statProximoEl = document.getElementById("stat-proximo");
    if (statProximoEl) statProximoEl.textContent = proximo ? faltam : "MAX";
}


// ============================================================
// RELÓGIO EM TEMPO REAL
// ============================================================
function iniciarRelogio() {
    function atualizar() {
        const agora = new Date();
        const hh = String(agora.getHours()).padStart(2, "0");
        const mm = String(agora.getMinutes()).padStart(2, "0");
        const ss = String(agora.getSeconds()).padStart(2, "0");
        const el = document.getElementById("relogio");
        if (el) el.textContent = `${hh}:${mm}:${ss}`;

        const infoEl = document.getElementById("relogio-info");
        if (infoEl) {
            const h = agora.getHours();
            let msg = "";
            if (h >= 5 && h < 12)       msg = "☀️ Bom dia! XP normal (x1)";
            else if (h >= 12 && h < 17) msg = "🌤️ Boa tarde! XP normal (x1)";
            else if (h >= 17 && h < 24) msg = "🌙 Boa noite! XP DOBRADO (x2)";
            else                        msg = "🌌 Madrugada — só revisão e anotações";
            infoEl.textContent = msg;
        }
    }
    atualizar();
    setInterval(atualizar, 1000);
}


// ============================================================
// CARREGAR DESAFIO DO DIA (dashboard)
// ============================================================
async function carregarDesafio() {
    const resp = await fetch("/api/desafio-hoje");
    const dados = await resp.json();
    const elCards = document.getElementById("cards-dias");
    const elDesafio = document.getElementById("area-desafio");
    if (!elCards || !elDesafio) return;

    // ---------- MODO MADRUGADA ----------
    if (dados.bloqueado_madrugada) {
        elCards.innerHTML = "";
        elDesafio.innerHTML = `
            <div class="card" style="text-align:center">
                <div style="font-size:56px;margin-bottom:8px">🌙</div>
                <h2>Modo Revisão</h2>
                <p style="color:var(--texto-sec);margin:8px 0 18px">${dados.mensagem_bloqueio}</p>
                <textarea id="anotacao" rows="4" placeholder="Escreva suas anotações..."></textarea>
                <button class="btn btn-sucesso" onclick="salvarAnotacao()">💾 Salvar</button>
            </div>`;
        return;
    }

    // ---------- CARDS DOS 7 DIAS ----------
    const nivelEmoji = { "iniciante": "🌱", "medio": "🚀", "dificil": "🔥" };
    const nivelNome  = { "iniciante": "Iniciante", "medio": "Médio", "dificil": "Difícil" };
    const diasLabel  = {
        segunda: "Segunda", terca: "Terça", quarta: "Quarta",
        quinta: "Quinta", sexta: "Sexta", sabado: "Sábado", domingo: "Domingo"
    };

    let htmlCards = `
        <div class="card">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px">
                <h2>📅 Sua semana</h2>
                <span class="badge-estagio">${nivelEmoji[dados.nivel] || "🌱"} Nível ${nivelNome[dados.nivel]}</span>
            </div>
            <p style="color:var(--texto-sec);font-size:13px;margin-bottom:14px">
                💡 Você pode praticar os dias anteriores, mas só o <strong>dia atual</strong> dá XP!
            </p>
            <div class="dias-grid">
    `;

    for (const d of dados.dias) {
        let classe = "dia-card";
        let icone = "📘";
        let statusTxt = "Disponível";
        let clique = "";
        let badge = "";

        if (d.is_hoje) {
            // 🎯 Dia atual → joga com XP
            classe += " hoje";
            icone = "🎯";
            statusTxt = "JOGAR (XP)";
            badge = `<div class="dia-badge-xp">+XP</div>`;
            clique = `onclick="abrirDesafioDoDia('${d.dia}', true)"`;

        } else if (d.status === "futuro") {
            // 🔒 Futuro → bloqueado
            classe += " bloqueado";
            icone = "🔒";
            statusTxt = "Aguardando";

        } else if (d.concluido) {
            // ✅ Já concluído (passado) → pode praticar
            classe += " concluido pratica";
            icone = "✅";
            statusTxt = "Praticar";
            clique = `onclick="abrirDesafioDoDia('${d.dia}', false)"`;

        } else if (d.liberado) {
            // 📝 Passado não concluído → prática
            classe += " pratica";
            icone = "📝";
            statusTxt = "Praticar";
            clique = `onclick="abrirDesafioDoDia('${d.dia}', false)"`;
        }

        htmlCards += `
            <div class="${classe}" ${clique}>
                <div class="dia-emoji">${icone}</div>
                <div class="dia-nome">${diasLabel[d.dia]}</div>
                <div class="dia-status">${statusTxt}</div>
                ${badge}
            </div>
        `;
    }
    htmlCards += `</div></div>`;
    elCards.innerHTML = htmlCards;

    // ---------- CONVITE PARA JOGAR O DESAFIO DE HOJE ----------
    if (dados.desafio) {
        const multTxt = dados.multiplicador > 1
            ? `<span style="color:var(--alegria-2);font-weight:800">✨ XP EM DOBRO (x${dados.multiplicador})</span>`
            : `Multiplicador: x${dados.multiplicador}`;

        elDesafio.innerHTML = `
            <div class="card" style="text-align:center;background:var(--grad-hero);color:#fff;border:none;padding:36px 24px">
                <div style="font-size:56px;margin-bottom:8px">🎯</div>
                <h2 style="color:#fff">${dados.desafio.titulo}</h2>
                <p style="opacity:0.9;margin-top:8px">${multTxt}</p>
                <button class="btn btn-alegria" onclick="abrirDesafioDoDia('${dados.dia}', true)"
                        style="margin-top:18px;font-size:18px;padding:16px 32px">
                    🚀 Começar desafio do dia
                </button>
            </div>
        `;
        return;
    }

    // ---------- SEM DESAFIO DE HOJE: conteúdos ----------
    mostrarConteudos(elDesafio);
}

function abrirDesafioDoDia(dia, isHoje) {
    sessionStorage.setItem("desafiei_dia_escolhido", dia);
    sessionStorage.setItem("desafiei_dia_xp", isHoje ? "1" : "0");

    // 🫧 Transição em bolha
    transicaoBolha("/desafio");
}

// ============================================================
// CARDS DE CONTEÚDOS PARA ESTUDAR
// ============================================================
async function mostrarConteudos(el) {
    const resp = await fetch("/api/conteudos");
    const conteudos = await resp.json();

    let html = `
        <div class="card" style="text-align:center">
            <div style="font-size:52px">📚</div>
            <h2>Hora de estudar!</h2>
            <p style="color:var(--texto-sec);margin-top:6px">
                Não há desafio disponível agora. Aproveite para revisar conteúdos!
            </p>
        </div>
    `;

    for (const [disciplina, itens] of Object.entries(conteudos)) {
        html += `
            <div class="card">
                <h3 style="margin-bottom:14px">📖 ${disciplina}</h3>
                <div class="conteudos-grid">
                    ${itens.map(c => `
                        <a href="${c.link}" target="_blank" class="conteudo-card">
                            <div class="conteudo-icone">${c.icone || "📘"}</div>
                            <div class="conteudo-titulo">${c.titulo}</div>
                            <div class="conteudo-desc">${c.descricao}</div>
                        </a>
                    `).join("")}
                </div>
            </div>
        `;
    }

    el.innerHTML = html;
}


// ============================================================
// PÁGINA /desafio — fluxo dedicado
// ============================================================
async function iniciarPaginaDesafio() {
    const el = document.getElementById("area-desafio");
    const elTitulo = document.getElementById("titulo-desafio");
    if (!el) return;

    const diaEscolhido = sessionStorage.getItem("desafiei_dia_escolhido");
    const ehDiaXp = sessionStorage.getItem("desafiei_dia_xp") === "1";

    let dados;
    if (diaEscolhido && !ehDiaXp) {
        // Modo prática: dia anterior
        const r = await fetch(`/api/desafio-pratica/${diaEscolhido}`);
        dados = await r.json();

        if (dados.erro) {
            el.innerHTML = `
                <div class="card" style="text-align:center">
                    <div style="font-size:56px">🔒</div>
                    <h2>Dia indisponível</h2>
                    <p style="color:var(--texto-sec);margin-top:8px">${dados.erro}</p>
                    <a href="/dashboard" class="btn" style="margin-top:16px">🏠 Voltar</a>
                </div>`;
            return;
        }
        dados.ganha_xp = false;
    } else {
        // Desafio do dia (com XP)
        const r = await fetch("/api/desafio-hoje");
        dados = await r.json();
        dados.ganha_xp = true;
    }

    if (dados.bloqueado_madrugada) {
        el.innerHTML = `
            <div class="card" style="text-align:center">
                <div style="font-size:56px">🌙</div>
                <h2>Sem desafio disponível</h2>
                <p style="color:var(--texto-sec);margin-top:8px">${dados.mensagem_bloqueio || "Volte amanhã!"}</p>
                <a href="/dashboard" class="btn" style="margin-top:16px">🏠 Voltar</a>
            </div>`;
        return;
    }

    if (!dados.desafio) {
        el.innerHTML = `
            <div class="card" style="text-align:center">
                <div style="font-size:56px">⏰</div>
                <h2>Desafio não encontrado</h2>
                <a href="/dashboard" class="btn" style="margin-top:16px">🏠 Voltar</a>
            </div>`;
        return;
    }

    if (elTitulo) {
        elTitulo.textContent = `${dados.desafio.titulo} ${dados.ganha_xp ? "(XP)" : "(Prática)"}`;
    }

        // Aviso de prática
    if (!dados.ganha_xp) {
        const aviso = document.createElement("div");
        aviso.className = "alerta alerta-aviso";
        aviso.style.marginBottom = "16px";
        aviso.innerHTML = `📝 <strong>Modo prática</strong> — você ganha <strong>+5 XP</strong> por acerto neste dia, sem multiplicador de horário.`;
        el.appendChild(aviso);
    }

    // Busca XP atual
    fetch("/api/meu-perfil").then(r => r.json()).then(u => {
        fluxoAtual.xpAntes = u.xp || 0;
    });

    iniciarFluxoAtividades(
        dados.desafio,
        dados.multiplicador || 1,
        dados.periodo || "manha",
        dados.dia
    );
}


// ============================================================
// FLUXO DE ATIVIDADES — UMA POR VEZ COM TRANSIÇÕES
// ============================================================
let fluxoAtual = {
    atividades: [],
    indice: 0,
    xpTotalGanho: 0,
    acertos: 0,
    multiplicador: 1,
    periodo: "manha",
    dia: "",
    xpAntes: 0,
};

function iniciarFluxoAtividades(desafio, multiplicador, periodo, dia) {
    fluxoAtual.atividades = desafio.atividades || [];
    fluxoAtual.indice = 0;
    fluxoAtual.xpTotalGanho = 0;
    fluxoAtual.acertos = 0;
    fluxoAtual.multiplicador = multiplicador;
    fluxoAtual.periodo = periodo;
    fluxoAtual.dia = dia;

    if (fluxoAtual.atividades.length === 0) {
        alert("Nenhuma atividade disponível.");
        return;
    }

    fetch("/api/meu-perfil").then(r => r.json()).then(u => {
        fluxoAtual.xpAntes = u.xp || 0;
    });

        mostrarTelaCarregando(() => {
        mostrarAtividadeAtual();
        iniciarMensagensMotivacionais();   // 👈 mova para cá
    });
}

    

function mostrarTelaCarregando(callback) {
    const tela = document.createElement("div");
    tela.className = "tela-carregando";
    tela.innerHTML = `
        <div class="coruja-carregando">🦉</div>
        <div class="texto-carregando">
            Preparando seu desafio<span class="pontinhos">
                <span>.</span><span>.</span><span>.</span>
            </span>
        </div>
        <div class="barra-carregando">
            <div class="barra-carregando-preenchida"></div>
        </div>
    `;
    document.body.appendChild(tela);

    setTimeout(() => {
        tela.classList.add("saindo");
        setTimeout(() => {
            tela.remove();
            if (callback) callback();
        }, 400);
    }, 1700);
}

function mostrarAtividadeAtual() {
    const el = document.getElementById("area-desafio");
    if (!el) return;

    const idx = fluxoAtual.indice;
    const atv = fluxoAtual.atividades[idx];
    if (!atv) return;

    const total = fluxoAtual.atividades.length;
    const percentual = Math.round((idx / total) * 100);

    const classeMateria =
        atv.materia === "Português"                ? "materia-portugues"
      : atv.materia === "Matemática"               ? "materia-matematica"
      : atv.materia === "Interpretação de Texto"   ? "materia-interpretacao"
      : "materia-conhecimentos";

    const blocoTexto = atv.texto
        ? `<div class="texto-apoio">
               <div class="texto-apoio-titulo">📖 Leia o texto:</div>
               <div class="texto-apoio-conteudo">${atv.texto}</div>
           </div>`
        : "";

    const perguntaEscapada = atv.pergunta.replace(/'/g, "\\'");
    const materiaEscapada  = atv.materia.replace(/'/g, "\\'");

    el.innerHTML = `
        <div class="atividade-container">
            <div class="progresso-atividades">
                <span class="contador">${idx + 1} / ${total}</span>
                <div class="barra-mini">
                    <div class="barra-mini-preenchida" style="width:${percentual}%"></div>
                </div>
                <span class="contador">⭐ ${atv.xp} XP</span>
            </div>

            <div class="desafio-card">
                <span class="materia-tag ${classeMateria}">${atv.materia}</span>
                ${blocoTexto}
                <h3 style="margin:14px 0 6px">${atv.pergunta}</h3>
                <div class="opcoes-resposta ${atv.tipo === "vf" ? "opcoes-vf" : ""}">
                    ${atv.opcoes.map(op => {
                        const opEscapada = op.replace(/'/g, "\\'");
                        const classeExtra = atv.tipo === "vf"
                            ? (op === "Verdadeiro" ? "opcao-vf opcao-vf-true" : "opcao-vf opcao-vf-false")
                            : "";
                        return `<button class="opcao-btn ${classeExtra}"
                            onclick="responder(this, '${materiaEscapada}', '${opEscapada}', '${perguntaEscapada}')">
                            ${atv.tipo === "vf"
                                ? (op === "Verdadeiro" ? "✔️ Verdadeiro" : "❌ Falso")
                                : op}
                        </button>`;
                    }).join("")}
                </div>
                <div style="margin-top:12px;color:var(--texto-sec);font-size:13px;font-weight:600">
                    Recompensa: <strong>+${atv.xp} XP</strong>
                </div>
            </div>
        </div>
    `;
}


// ============================================================
// RESPONDER
// ============================================================
async function responder(botao, materia, resposta, pergunta) {
    const container = botao.parentElement;
    container.querySelectorAll("button").forEach(b => b.disabled = true);

    const resp = await fetch("/api/responder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            materia,
            resposta,
            pergunta,
            dia: fluxoAtual.dia         // 🔥 envia o dia da atividade
        })
    });
    const json = await resp.json();

    if (json.erro) {
        botao.classList.add("errada");
        setTimeout(() => {
            alert(json.erro);
            container.querySelectorAll("button").forEach(b => b.disabled = false);
            botao.classList.remove("errada");
        }, 100);
        return;
    }

    // ---------- ERROU ----------
    if (!json.acertou) {
        botao.classList.add("errada");
        tocarSomErro();   // 🔊 ADICIONE ESTA LINHA
        container.querySelectorAll("button").forEach(b => {
            if (b.textContent.trim() === json.resposta_correta) {
                b.classList.add("correta");
            }
        });

        mostrarExplicacao(json.resposta_correta, json.explicacao, () => {
            avancarAtividade(false, 0);
        });
        return;
    }

        // ---------- ACERTOU ----------
    botao.classList.add("correta");
    tocarSomAcerto();   // 🔊 ADICIONE ESTA LINHA
    // ✨ Faíscas no botão clicado
    soltarFaiscas(botao);

      // 💥 Zoom de XP (para prática OU dia normal)
    if (json.xp_ganho > 0) {
        mostrarZoomXp(json.xp_ganho);
    }

    // Soma o XP ganho (prática ou normal)
    fluxoAtual.xpTotalGanho += json.xp_ganho || 0;
    fluxoAtual.acertos += 1;

    if (json.subiu_estagio) {
        setTimeout(() => {
            mostrarAnimacaoSubiuEstagio(json.estagio, () => {
                avancarAtividade(true, json.xp_ganho || 0);
            });
        }, 700);
    } else {
        setTimeout(() => {
            avancarAtividade(true, json.xp_ganho || 0);
        }, 900);
    }

 
}



// ============================================================
// 🔊 SONS (opcional)
// ============================================================
function tocarSomAcerto() {
    try {
        const audio = new Audio("/static/sons/acerto.mp3");
        audio.volume = 0.5;
        audio.play().catch(() => {});  // falha silenciosa se não existir
    } catch (e) {}
}

function tocarSomErro() {
    try {
        const audio = new Audio("/static/sons/erro.mp3");
        audio.volume = 0.4;
        audio.play().catch(() => {});
    } catch (e) {}
}

/** Modal de explicação quando erra */
function mostrarExplicacao(respostaCerta, explicacao, callback) {
    const modal = document.createElement("div");
    modal.className = "modal-explicacao";
    modal.innerHTML = `
        <div class="modal-conteudo">
            <div style="font-size:52px">📘</div>
            <h2 style="color:var(--erro)">Vamos entender!</h2>
            <p style="margin:14px 0">
                A resposta certa era: <strong style="color:var(--sucesso)">${respostaCerta}</strong>
            </p>
            <div class="explicacao-box">
                <strong>💡 Por quê?</strong>
                <p style="margin-top:8px">${explicacao}</p>
            </div>
            <button class="btn" style="margin-top:18px" id="btn-entendi">Entendi, próximo →</button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("btn-entendi").onclick = () => {
        modal.classList.add("saindo");
        setTimeout(() => {
            modal.remove();
            if (callback) callback();
        }, 300);
    };
}

/** Animação de subida de estágio */
function mostrarAnimacaoSubiuEstagio(novoEstagio, callback) {
    const tela = document.createElement("div");
    tela.className = "tela-subiu-estagio";
    tela.innerHTML = `
        <div class="subiu-conteudo">
            <div class="subiu-raio">⚡</div>
            <h1>SUBIU DE NÍVEL!</h1>
            <div class="subiu-badge">
                <span class="badge-estagio ${classeEstagio(novoEstagio)}"
                      style="font-size:20px;padding:12px 28px">
                    ${novoEstagio}
                </span>
            </div>
            <p style="color:#fff;opacity:0.9;margin-top:16px">Continue assim! 🚀</p>
        </div>
    `;
    document.body.appendChild(tela);

    setTimeout(() => {
        tela.classList.add("saindo");
        setTimeout(() => {
            tela.remove();
            if (callback) callback();
        }, 400);
    }, 2600);
}

/** Avança para a próxima atividade */
function avancarAtividade(acertou, xpGanho) {
    const elContainer = document.querySelector(".atividade-container");
    if (elContainer) elContainer.classList.add("saindo");

    setTimeout(() => {
        fluxoAtual.indice++;

        if (fluxoAtual.indice >= fluxoAtual.atividades.length) {
            finalizarDesafio();
        } else {
            mostrarAtividadeAtual();
        }
    }, 350);
}


// ============================================================
// TELA FINAL
// ============================================================
async function finalizarDesafio() {
    // 🔥 Só conclui o dia se for o dia atual (com XP)
    const foiDiaXp = sessionStorage.getItem("desafiei_dia_xp") === "1";

    if (foiDiaXp) {
        try {
            const r = await fetch("/api/concluir-dia", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dia: fluxoAtual.dia })
            });
            const j = await r.json();
            if (j.bonus) fluxoAtual.xpTotalGanho += j.bonus;
        } catch (e) {
            console.warn("Não foi possível marcar o dia como concluído:", e);
        }
    }

    // 💬 Para as mensagens motivacionais (elas não aparecem na tela final)
    if (typeof pararMensagensMotivacionais === "function") {
        pararMensagensMotivacionais();
    }

    const u = await fetch("/api/meu-perfil").then(r => r.json());
    const progresso = calcularProgresso(u.xp);

    const total = fluxoAtual.atividades.length;
    const acertos = fluxoAtual.acertos;
    const perfeito = acertos === total;

    // ============================================================
    // 🏆 BUSCA CONQUISTAS (PRECISA VIR ANTES DE MONTAR O HTML!)
    // ============================================================
    let conquistasHTML = "";
    try {
        const conquistas = await fetch("/api/conquistas").then(r => r.json());

        if (conquistas && conquistas.length > 0) {
            // ✅ Aluno TEM conquistas → mostra os badges
            conquistasHTML = `
                <div class="conquistas-final">
                    <div class="conquistas-titulo">🏆 Suas conquistas</div>
                    <div class="conquistas-lista">
                        ${conquistas.slice(0, 6).map(c => `
                            <div class="conquista-item" title="${c.desc || ''}">
                                <span class="conquista-icone">${c.icone}</span>
                                <span class="conquista-nome">${c.nome}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            `;
        } else {
            // ❌ Aluno NÃO tem conquistas ainda → mostra mensagem motivacional
            conquistasHTML = `
                <div class="conquistas-final">
                    <div class="conquistas-titulo">🏆 Suas conquistas</div>
                    <p style="text-align:center;color:var(--texto-sec);font-size:13px;margin-top:8px">
                        Complete desafios para desbloquear conquistas! 🎯
                    </p>
                </div>
            `;
        }
    } catch (e) {
        console.warn("Erro ao buscar conquistas:", e);

        // 🛟 Fallback se a API falhar
        conquistasHTML = `
            <div class="conquistas-final">
                <div class="conquistas-titulo">🏆 Suas conquistas</div>
                <p style="text-align:center;color:var(--texto-sec);font-size:13px;margin-top:8px">
                    Complete desafios para desbloquear conquistas! 🎯
                </p>
            </div>
        `;
    }

    // ============================================================
    // MONTA A TELA FINAL
    // ============================================================
    const tela = document.createElement("div");
    tela.className = "tela-final";
    tela.innerHTML = `
        <div class="conteudo-final">
            <div class="emoji-festa">${perfeito ? "🏆" : "🎉"}</div>
            <h1>${perfeito ? "PERFEITO!" : "Parabéns!"}</h1>
                        <p class="subtitulo">
                Você completou o desafio de <strong>${fluxoAtual.dia}</strong>!
                ${perfeito
                    ? "Acertou todas! 🌟"
                    : `Acertou ${acertos} de ${total}. Continue assim! 💪`}
                ${!foiDiaXp ? "<br><small>(Modo prática — 5 XP por acerto)</small>" : ""}
            </p>

            <div class="xp-ganho">+${fluxoAtual.xpTotalGanho} XP</div>

            <div class="estatisticas">
                <div class="stat-item">
                    <div class="valor">${u.xp}</div>
                    <div class="rotulo">XP Total</div>
                </div>
                <div class="stat-item">
                    <div class="valor">${acertos}/${total}</div>
                    <div class="rotulo">Acertos</div>
                </div>
                <div class="stat-item">
                    <div class="valor">🔥 ${u.ofensiva} ${u.ofensiva === 1 ? "dia" : "dias"}</div>
                    <div class="rotulo">Ofensiva</div>
                </div>
            </div>

            ${conquistasHTML}

            <div class="barra-progresso-final">
                <div class="barra-xp-info">
                    <span>${u.estagio} → ${progresso.proximo ? progresso.proximo.nome : "MAX"}</span>
                    <span class="xp-atual">${progresso.percentual}%</span>
                </div>
                <div class="barra-xp barra-xp-grande">
                    <div class="barra-xp-preenchida" style="width:${progresso.percentual}%"></div>
                    <div class="barra-xp-texto">${progresso.percentual}%</div>
                </div>
                ${progresso.proximo
                    ? `<p style="margin-top:8px;color:var(--texto-sec);font-size:13px">
                          Faltam <strong>${progresso.faltam} XP</strong> para ${progresso.proximo.nome}!
                       </p>`
                    : `<p style="margin-top:8px;color:var(--sucesso);font-weight:800">
                          🏅 Você chegou ao topo!
                       </p>`}
            </div>

            <div class="acoes">
                <a href="/dashboard" class="btn">🏠 Voltar ao início</a>
                <a href="/ranking.html" class="btn btn-secundario">🏆 Ver ranking</a>
            </div>
        </div>
    `;

    document.body.appendChild(tela);

    if (perfeito) soltarConfetes();
    atualizarCabecalho();

    // Limpa o dia escolhido (próxima navegação vai resetar)
    sessionStorage.removeItem("desafiei_dia_escolhido");
    sessionStorage.removeItem("desafiei_dia_xp");
}


/** Confetes */
function soltarConfetes() {
    const cores = ["#3b9eff", "#ffcc4d", "#00d68f", "#8b7cf6", "#ff5c7a"];
    for (let i = 0; i < 60; i++) {
        const confete = document.createElement("div");
        confete.className = "confete";
        confete.style.left = Math.random() * 100 + "vw";
        confete.style.background = cores[Math.floor(Math.random() * cores.length)];
        confete.style.animationDuration = (2 + Math.random() * 2) + "s";
        confete.style.animationDelay = (Math.random() * 0.5) + "s";
        confete.style.transform = `rotate(${Math.random() * 360}deg)`;
        document.body.appendChild(confete);

        setTimeout(() => confete.remove(), 5000);
    }
}


// ============================================================
// ✨ FAÍSCAS AO ACERTAR
// ============================================================
function soltarFaiscas(elemento) {
    if (!elemento) return;
    const rect = elemento.getBoundingClientRect();
    const cores = ["#3b9eff", "#ffcc4d", "#00d68f", "#8b7cf6", "#ff5c7a"];

    for (let i = 0; i < 12; i++) {
        const f = document.createElement("div");
        f.className = "faisca";
        f.style.left = (rect.left + rect.width / 2) + "px";
        f.style.top = (rect.top + rect.height / 2) + "px";
        f.style.background = cores[Math.floor(Math.random() * cores.length)];

        // Direção aleatória
        const angulo = (Math.PI * 2 * i) / 12 + Math.random() * 0.5;
        const dist = 60 + Math.random() * 60;
        f.style.setProperty("--fx", Math.cos(angulo) * dist + "px");
        f.style.setProperty("--fy", Math.sin(angulo) * dist + "px");

        document.body.appendChild(f);
        setTimeout(() => f.remove(), 950);
    }
}

// ============================================================
// 💥 ZOOM AO GANHAR XP
// ============================================================
function mostrarZoomXp(xp) {
    const el = document.createElement("div");
    el.className = "zoom-xp";
    el.textContent = `+${xp} XP`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1150);
}

// ============================================================
// 🫧 TRANSIÇÃO EM BOLHA ENTRE TELAS
// ============================================================
function transicaoBolha(url, cor = null) {
    // Se não passar cor, usa a cor primária
    const corFinal = cor || getComputedStyle(document.documentElement)
                             .getPropertyValue("--primaria").trim() || "#3b9eff";

    const bolha = document.createElement("div");
    bolha.className = "bolha-transicao";
    bolha.style.width = "40px";
    bolha.style.height = "40px";
    bolha.style.background = corFinal;
    bolha.style.left = "50%";
    bolha.style.top = "50%";
    document.body.appendChild(bolha);

    // Depois da animação, navega
    setTimeout(() => {
        window.location.href = url;
    }, 600);
}

// ============================================================
// XP DIÁRIO (1x ao entrar no dia)
// ============================================================
async function checarXpDiario() {
    const resp = await fetch("/api/xp-diario");
    const json = await resp.json();

    if (json.ganhou) {
        // 🎁 Se ganhou bônus de 100 XP por ofensiva de 7 dias
        if (json.bonus_ofensiva && json.bonus_ofensiva > 0) {
            setTimeout(() => {
                alert(
                    `🎉 Bem-vindo(a) de volta!\n\n` +
                    `+${json.xp_ganho - json.bonus_ofensiva} XP diário\n` +
                    `+${json.bonus_ofensiva} XP BÔNUS (${json.ofensiva} dias de ofensiva! 🔥)\n\n` +
                    `Ofensiva: ${json.ofensiva} dias\n` +
                    `XP Total: ${json.xp_total}`
                );
            }, 800);

            // 🎊 Solta confetes pelo bônus
            setTimeout(() => {
                if (typeof soltarConfetes === "function") soltarConfetes();
            }, 1200);
        } else {
            // Mensagem normal
            setTimeout(() => {
                alert(`🎉 Bem-vindo(a) de volta! +${json.xp_ganho} XP pela ofensiva!\nOfensiva: ${json.ofensiva} dias 🔥`);
            }, 800);
        }
    }
    atualizarCabecalho();
}

// ============================================================
// ANOTAÇÕES (madrugada)
// ============================================================
async function salvarAnotacao() {
    const texto = document.getElementById("anotacao").value;
    if (!texto.trim()) {
        alert("⚠️ Escreva algo antes de salvar!");
        return;
    }
    await fetch("/api/anotacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto })
    });
    alert("✅ Anotação salva!");
}


// ============================================================
// RANKING
// ============================================================
async function carregarRanking() {
    const resp = await fetch("/api/ranking");
    const lista = await resp.json();
    const el = document.getElementById("lista-ranking");
    if (!el) return;

    el.innerHTML = lista.map((u, i) => {
        let classe = "";
        if (i === 0) classe = "pos-ouro";
        else if (i === 1) classe = "pos-prata";
        else if (i === 2) classe = "pos-bronze";

        const medalha = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : (i + 1);

        return `
            <div class="linha-ranking ${classe}">
                <div class="posicao">${medalha}</div>
                <div class="avatar-usuario" style="width:48px;height:48px;font-size:24px">
                    ${u.foto ? `<img src="${u.foto}" alt="">` : u.avatar_emoji}
                </div>
                <div class="info">
                    <div class="nome">${u.nome}</div>
                    <div class="sub">${u.xp} XP • 🔥 ${u.ofensiva} dias</div>
                </div>
                <span class="badge-estagio ${classeEstagio(u.estagio)}">${u.estagio}</span>
            </div>`;
    }).join("");
}




// ============================================================
// DELETAR CONTA
// ============================================================
async function deletarConta() {
    // Primeira confirmação (sensível)
    const confirmacao1 = confirm(
        "💙 Sentiremos sua falta...\n\n" +
        "Sua jornada no Desafiei é única e cada XP conquistado conta.\n" +
        "Se estiver enfrentando dificuldades, lembre-se: você não está sozinho(a).\n\n" +
        "Tem certeza que deseja deletar sua conta? (Isso é permanente)"
    );
    if (!confirmacao1) return;

    // 🔥 Segunda confirmação (digitar CONFIRMAR)
    const confirmacao2 = prompt(
        "⚠️ ÚLTIMA CHANCE!\n\n" +
        "Digite 'CONFIRMAR' (em maiúsculas) para deletar sua conta definitivamente:"
    );
    if (confirmacao2 !== "CONFIRMAR") {
        alert("✅ Sua conta foi mantida. Bom estudo! 🦉");
        return;
    }

    // Chama a API
    const resp = await fetch("/api/deletar-conta", { method: "POST" });
    const json = await resp.json();

    if (json.ok) {
        // 🫧 Transição em bolha (se existir)
        if (typeof transicaoBolha === "function") {
            transicaoBolha(json.redirect, "#ff5c7a");
        } else {
            window.location.href = json.redirect;
        }
    }
}


// ============================================================
// 🤖 CORUJINHA IA — Recomendações personalizadas
// ============================================================
async function verificarRecomendacaoCorujinha() {
    try {
        const resp = await fetch("/api/recomendacao");
        const dados = await resp.json();

        // Se não houver recomendação, não faz nada
        if (!dados.mensagem) return;

        // Espera 3 segundos antes de mostrar (não atrapalha o carregamento)
        setTimeout(() => {
            mostrarBalaoRecomendacao(dados);
        }, 3000);
    } catch (e) {
        console.warn("Erro ao buscar recomendação:", e);
    }
}

function mostrarBalaoRecomendacao(dados) {
    const balao = document.getElementById("coruja-balao");
    if (!balao) return;

    balao.classList.add("ativo");
    balao.innerHTML = `
        <div style="display:flex;gap:12px;align-items:flex-start">
            <span style="font-size:38px;line-height:1">${dados.emoji}</span>
            <div style="flex:1">
                <div style="font-weight:800;color:var(--primaria);margin-bottom:6px">
                    Dica da Corujinha 🦉
                </div>
                <p style="font-size:14px;line-height:1.5">${dados.mensagem}</p>
                <div style="display:flex;gap:6px;margin-top:12px;justify-content:flex-end">
                    <button class="btn btn-secundario" style="padding:6px 12px;font-size:12px"
                            onclick="fecharBalaoRecomendacao()">Valeu!</button>
                    <a href="/dashboard" class="btn" style="padding:6px 12px;font-size:12px">
                        Vou revisar 📚
                    </a>
                </div>
            </div>
        </div>
    `;
}

function fecharBalaoRecomendacao() {
    const balao = document.getElementById("coruja-balao");
    if (balao) balao.classList.remove("ativo");
}

// Chama a recomendação automaticamente ao carregar
window.addEventListener("DOMContentLoaded", () => {
    setTimeout(verificarRecomendacaoCorujinha, 2000);
});


// ============================================================
// 💬 MENSAGENS MOTIVACIONAIS
// ============================================================
const MENSAGENS_MOTIVACIONAIS = [
    { emoji: "💪", texto: "Você consegue!" },
    { emoji: "🚀", texto: "Nunca desista!" },
    { emoji: "⭐", texto: "Você é capaz!" },
    { emoji: "🔥", texto: "Continue firme!" },
    { emoji: "🌟", texto: "Um passo de cada vez!" },
    { emoji: "🧠", texto: "Sua mente é poderosa!" },
    { emoji: "🏆", texto: "Cada erro te ensina!" },
    { emoji: "💙", texto: "Você não está sozinho!" },
    { emoji: "🌈", texto: "O esforço vale a pena!" },
    { emoji: "🎯", texto: "Foco no objetivo!" },
    { emoji: "🦉", texto: "A coruja acredita em você!" },
    { emoji: "✨", texto: "Você está evoluindo!" },
];

/** Mostra uma mensagem motivacional aleatória na tela (perto da coruja) */
function mostrarMensagemMotivacional() {
    // 🦉 Se o balão da coruja estiver aberto, não mostra (evita sobreposição)
    const balaoCoruja = document.getElementById("coruja-balao");
    if (balaoCoruja && balaoCoruja.classList.contains("ativo")) {
        return;
    }

    // Sorteia uma mensagem
    const msg = MENSAGENS_MOTIVACIONAIS[
        Math.floor(Math.random() * MENSAGENS_MOTIVACIONAIS.length)
    ];

    // Cria o elemento
    const el = document.createElement("div");
    el.className = "mensagem-motivacional";
    el.innerHTML = `
        <span class="msg-emoji">${msg.emoji}</span>
        <span class="msg-texto">${msg.texto}</span>
    `;

    document.body.appendChild(el);

    // Remove depois de 3.5s (com fade-out)
    setTimeout(() => {
        el.classList.add("saindo");
        setTimeout(() => el.remove(), 400);
    }, 3500);
}

/** Agenda mensagens motivacionais aleatórias enquanto o desafio está ativo */
let _timerMotivacional = null;

function iniciarMensagensMotivacionais() {
    pararMensagensMotivacionais();  // limpa se já estiver rodando

    // Primeira mensagem logo de cara
    setTimeout(mostrarMensagemMotivacional, 3000);

    // E depois a cada 15-25s
    _timerMotivacional = setInterval(() => {
        mostrarMensagemMotivacional();
    }, 18000);
}

function pararMensagensMotivacionais() {
    if (_timerMotivacional) {
        clearInterval(_timerMotivacional);
        _timerMotivacional = null;
    }

    
}

function atualizarBotaoSom() {
    const btn = document.getElementById("btn-som");
    if (btn) btn.textContent = _somAtivo ? "Ligado" : "Desligado";
}


fetch("/api/desafio-hoje").then(r => r.json()).then(d => {
    console.log("Nível:", d.nivel);
    console.log("Total de atividades:", d.desafio?.atividades?.length);
    console.log("Primeira atividade:", d.desafio?.atividades?.[0]);
});

// ============================================================
// INICIALIZAÇÃO (UM ÚNICO listener!)
// ============================================================
window.addEventListener("DOMContentLoaded", () => {
    // Página do dashboard (tem area-desafio E cards-dias)
    if (document.getElementById("cards-dias")) {
        iniciarRelogio();
        carregarDesafio();
        checarXpDiario();
        atualizarCabecalho();
    }

    // Página /desafio (tem area-desafio mas NÃO tem cards-dias)
    else if (document.getElementById("area-desafio")) {
        iniciarPaginaDesafio();
        atualizarCabecalho();
    }

    // Página de ranking
    if (document.getElementById("lista-ranking")) {
        carregarRanking();
    }
});