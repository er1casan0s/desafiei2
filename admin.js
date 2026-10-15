// ============================================================
// 🛡️ PAINEL DE ADMINISTRADOR
// ============================================================

let _usuariosCache = [];

// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
    carregarStats();
    carregarUsuarios();
    carregarDeletados();
    carregarGraficoMaterias();
});

// ------------------------------------------------------------
// MUDAR DE ABA
// ------------------------------------------------------------
function mudarAba(nome, botao) {
    // Esconde todas as abas
    document.querySelectorAll(".aba-conteudo").forEach(el => el.style.display = "none");
    // Remove classe ativa de todos os botões
    document.querySelectorAll(".admin-tab").forEach(b => b.classList.remove("ativo"));

    // Mostra a aba correta
    document.getElementById(`aba-${nome}`).style.display = "block";
    botao.classList.add("ativo");
}

// ------------------------------------------------------------
// ESTATÍSTICAS GERAIS
// ------------------------------------------------------------
async function carregarStats() {
    try {
        const resp = await fetch("/api/admin/stats");
        const s = await resp.json();

        const el = document.getElementById("admin-stats");
        el.innerHTML = `
            <div class="admin-stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                    <div class="stat-numero">${s.total_usuarios}</div>
                    <div class="stat-label">Usuários ativos</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🗑️</div>
                <div class="stat-info">
                    <div class="stat-numero">${s.total_deletados}</div>
                    <div class="stat-label">Contas deletadas</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">⚡</div>
                <div class="stat-info">
                    <div class="stat-numero">${s.xp_total_site}</div>
                    <div class="stat-label">XP total do site</div>
                </div>
            </div>
            <div class="admin-stat-card">
                <div class="stat-icon">🔥</div>
                <div class="stat-info">
                    <div class="stat-numero">${s.ativos_semana}</div>
                    <div class="stat-label">Ativos na semana</div>
                </div>
            </div>
        `;
    } catch (e) {
        console.warn("Erro ao carregar stats:", e);
    }
}

// ------------------------------------------------------------
// LISTA DE USUÁRIOS
// ------------------------------------------------------------
async function carregarUsuarios() {
    try {
        const resp = await fetch("/api/admin/usuarios");
        _usuariosCache = await resp.json();
        renderizarUsuarios(_usuariosCache);
    } catch (e) {
        console.warn("Erro ao carregar usuários:", e);
    }
}

function renderizarUsuarios(lista) {
    const el = document.getElementById("lista-usuarios");

    if (lista.length === 0) {
        el.innerHTML = `<p style="text-align:center;color:var(--texto-sec);padding:20px">Nenhum usuário encontrado.</p>`;
        return;
    }

    el.innerHTML = lista.map(u => `
        <div class="admin-user-row ${u.banido ? 'banido' : ''}">
            <div class="admin-user-info">
                <div class="admin-user-avatar">${u.avatar_emoji || "🦉"}</div>
                <div>
                 <div class="admin-user-nome">
                ${u.nome}
                ${u.admin ? '<span class="badge-admin">👑 Admin</span>' : ''}
                ${u.banido ? '<span class="badge-banido">🚫 Banido</span>' : ''}
            </div>
                    <div class="admin-user-email">${u.email}</div>
                    <div class="admin-user-meta">
                        ${u.idade} anos • 
                        Nível: <strong>${u.nivel}</strong> • 
                        📱 ${u.whatsapp}
                    </div>
                </div>
            </div>

            <div class="admin-user-stats">
                <div class="mini-stat">
                    <div class="mini-valor">${u.xp}</div>
                    <div class="mini-label">XP</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-valor">🔥${u.ofensiva}</div>
                    <div class="mini-label">Ofensiva</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-valor">${u.total_desafios}</div>
                    <div class="mini-label">Desafios</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-valor">${u.total_acertos}</div>
                    <div class="mini-label">Acertos</div>
                </div>
            </div>

            <div class="admin-user-acoes">
                <button class="btn btn-secundario btn-sm" onclick="verDetalhes('${u.email}')">👁️ Ver</button>
                <button class="btn ${u.banido ? 'btn-sucesso' : 'btn-perigo'} btn-sm"
                        onclick="alternarBanido('${u.email}', ${!u.banido})">
                    ${u.banido ? '✓ Desbanir' : '🚫 Banir'}
                </button>
            </div>
        </div>
    `).join("");
}

function filtrarUsuarios() {
    const termo = document.getElementById("busca-usuario").value.toLowerCase();
    const filtrados = _usuariosCache.filter(u =>
        u.nome.toLowerCase().includes(termo) ||
        u.email.toLowerCase().includes(termo)
    );
    renderizarUsuarios(filtrados);
}

// ------------------------------------------------------------
// DETALHES DO USUÁRIO (MODAL)
// ------------------------------------------------------------
async function verDetalhes(email) {
    try {
        const resp = await fetch(`/api/admin/usuario/${encodeURIComponent(email)}`);
        const dados = await resp.json();
        const u = dados.usuario;

        const modal = document.getElementById("modal-usuario");
        const conteudo = document.getElementById("detalhes-usuario");

        conteudo.innerHTML = `
            <h2 style="margin-bottom:16px">👤 ${u.nome}</h2>

            <div class="detalhes-grid">
                <div class="detalhe-item">
                    <div class="detalhe-label">Email</div>
                    <div class="detalhe-valor">${u.email}</div>
                </div>
                <div class="detalhe-item">
                    <div class="detalhe-label">Idade</div>
                    <div class="detalhe-valor">${u.idade} anos</div>
                </div>
                <div class="detalhe-item">
                    <div class="detalhe-label">WhatsApp</div>
                    <div class="detalhe-valor">${u.whatsapp}</div>
                </div>
                <div class="detalhe-item">
                    <div class="detalhe-label">Nível</div>
                    <div class="detalhe-valor">${u.nivel}</div>
                </div>
                <div class="detalhe-item">
                    <div class="detalhe-label">Estágio</div>
                    <div class="detalhe-valor">${u.estagio}</div>
                </div>
                <div class="detalhe-item">
                    <div class="detalhe-label">XP Total</div>
                    <div class="detalhe-valor">${u.xp}</div>
                </div>
                <div class="detalhe-item">
                    <div class="detalhe-label">Ofensiva</div>
                    <div class="detalhe-valor">🔥 ${u.ofensiva} dias</div>
                </div>
                <div class="detalhe-item">
                    <div class="detalhe-label">Criado em</div>
                    <div class="detalhe-valor">${formatarData(u.criado_em)}</div>
                </div>
            </div>

            <div style="margin-top:20px">
                <h3 style="margin-bottom:10px">📊 Desempenho por matéria</h3>
                <div class="materias-stats">
                    ${Object.entries(dados.acertos_por_materia).map(([m, a]) => {
                        const e = dados.erros_por_materia[m] || 0;
                        const total = a + e;
                        const perc = total ? Math.round((a / total) * 100) : 0;
                        return `
                            <div class="materia-stat">
                                <div class="materia-nome">${m}</div>
                                <div class="materia-numeros">✅ ${a} • ❌ ${e}</div>
                                <div class="barra-mini-stat">
                                    <div class="barra-mini-preenchida-stat" style="width:${perc}%"></div>
                                </div>
                                <div class="materia-perc">${perc}% acerto</div>
                            </div>
                        `;
                    }).join("") || '<p style="color:var(--texto-sec)">Sem dados ainda.</p>'}
                </div>
            </div>

            <div style="margin-top:20px">
                <h3 style="margin-bottom:10px">💬 Dificuldade relatada</h3>
                <div class="alerta">${u.dificuldade || "Não informado"}</div>
            </div>
        `;

        modal.classList.add("aberto");
    } catch (e) {
        console.warn("Erro ao carregar detalhes:", e);
    }
}

function fecharModal() {
    document.getElementById("modal-usuario").classList.remove("aberto");
}

// ------------------------------------------------------------
// BANIR / DESBANIR
// ------------------------------------------------------------
async function alternarBanido(email, banir) {
    const acao = banir ? "banir" : "desbanir";
    if (!confirm(`Tem certeza que deseja ${acao} este usuário?`)) return;

    try {
        const resp = await fetch("/api/admin/banir", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, banir })
        });
        const json = await resp.json();
        if (json.ok) {
            alert(`✅ Usuário ${acao}do com sucesso!`);
            carregarUsuarios();  // recarrega a lista
        }
    } catch (e) {
        alert("Erro ao " + acao + " usuário.");
    }
}

// ------------------------------------------------------------
// LISTA DE DELETADOS
// ------------------------------------------------------------
async function carregarDeletados() {
    try {
        const resp = await fetch("/api/admin/deletados");
        const lista = await resp.json();
        const el = document.getElementById("lista-deletados");

        if (lista.length === 0) {
            el.innerHTML = `<p style="text-align:center;color:var(--texto-sec);padding:20px">
                Nenhuma conta foi deletada ainda. 🎉
            </p>`;
            return;
        }

        el.innerHTML = lista.map(d => `
            <div class="admin-user-row deletado">
                <div class="admin-user-info">
                    <div class="admin-user-avatar">🗑️</div>
                    <div>
                        <div class="admin-user-nome">${d.nome}</div>
                        <div class="admin-user-email">${d.email}</div>
                        <div class="admin-user-meta">
                            ${d.idade} anos • 
                            XP: <strong>${d.xp}</strong> • 
                            Estágio: <strong>${d.estagio}</strong>
                        </div>
                        <div class="admin-user-meta">
                            Deletado em: <strong>${formatarData(d.deletado_em)}</strong>
                        </div>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (e) {
        console.warn("Erro ao carregar deletados:", e);
    }
}

// ------------------------------------------------------------
// GRÁFICO DE MATÉRIAS (geral do site)
// ------------------------------------------------------------
// ------------------------------------------------------------
// GRÁFICO DE MATÉRIAS (geral do site) — VERSÃO COM LEGENDA
// ------------------------------------------------------------
async function carregarGraficoMaterias() {
    try {
        const resp = await fetch("/api/admin/usuarios");
        const usuarios = await resp.json();

        if (!usuarios || usuarios.length === 0) {
            mostrarSemDadosMaterias();
            return;
        }

        // Agrega acertos de todos os usuários por matéria
        const porMateria = {};
        for (const u of usuarios) {
            try {
                const det = await fetch(`/api/admin/usuario/${encodeURIComponent(u.email)}`).then(r => r.json());
                for (const [m, qtd] of Object.entries(det.acertos_por_materia || {})) {
                    porMateria[m] = (porMateria[m] || 0) + qtd;
                }
            } catch (e) {
                console.warn("Erro ao buscar detalhes de", u.email, e);
            }
        }

        const labels = Object.keys(porMateria);
        const valores = Object.values(porMateria);

        if (labels.length === 0) {
            mostrarSemDadosMaterias();
            return;
        }

        // Ordena do maior para o menor
        const ordenado = labels.map((l, i) => ({ m: l, v: valores[i] }))
                              .sort((a, b) => b.v - a.v);
        const labelsOrd = ordenado.map(o => o.m);
        const valoresOrd = ordenado.map(o => o.v);

        const canvas = document.getElementById("grafico-materias");
        if (!canvas) return;

        new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: labelsOrd,
                datasets: [{
                    label: "Total de acertos",
                    data: valoresOrd,
                    backgroundColor: [
                        "rgba(59, 158, 255, 0.85)",    // Azul
                        "rgba(255, 204, 77, 0.85)",    // Amarelo
                        "rgba(0, 214, 143, 0.85)",     // Verde
                        "rgba(139, 124, 246, 0.85)",   // Roxo
                        "rgba(255, 92, 122, 0.85)",    // Vermelho
                        "rgba(90, 200, 250, 0.85)",    // Azul claro
                    ],
                    borderColor: "var(--card-solid)",
                    borderWidth: 3,
                    hoverOffset: 10,                   // Destaque ao passar o mouse
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "60%",                         // Grossura da rosca
                layout: {
                    padding: { top: 10, bottom: 10, left: 10, right: 10 }
                },
                plugins: {
                    // 🏷️ LEGENDA ABAIXO DO GRÁFICO
                    legend: {
                        display: true,
                        position: "bottom",
                        align: "center",
                        labels: {
                            color: "#0f1c2e",
                            font: {
                                family: "Plus Jakarta Sans",
                                size: 13,
                                weight: "700"
                            },
                            padding: 14,
                            usePointStyle: true,
                            pointStyle: "circle",
                            boxWidth: 12,
                            boxHeight: 12,
                        }
                    },

                    // 💡 TOOLTIP MELHORADO (com %)
                    tooltip: {
                        backgroundColor: "#0f1c2e",
                        padding: 14,
                        cornerRadius: 10,
                        titleFont: { family: "Outfit", size: 14, weight: "700" },
                        bodyFont:  { family: "Plus Jakarta Sans", size: 13 },
                        callbacks: {
                            label: (ctx) => {
                                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                const valor = ctx.parsed;
                                const perc = total ? Math.round((valor / total) * 100) : 0;
                                return `  ${valor} acerto${valor !== 1 ? "s" : ""} (${perc}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (e) {
        console.warn("Erro no gráfico:", e);
        mostrarSemDadosMaterias();
    }
}

/** Mostra a mensagem "sem dados" e esconde o gráfico */
function mostrarSemDadosMaterias() {
    const wrapper = document.querySelector(".grafico-wrapper");
    const msg = document.getElementById("sem-dados-materias");
    if (wrapper) wrapper.style.display = "none";
    if (msg) msg.style.display = "block";
}

// ------------------------------------------------------------
// EXPORTAR BACKUP
// ------------------------------------------------------------
async function exportarBackup() {
    try {
        const resp = await fetch("/api/admin/backup");
        const dados = await resp.json();
        const blob = new Blob([JSON.stringify(dados, null, 4)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `backup-desafiei-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } catch (e) {
        alert("Erro ao exportar backup.");
    }
}

// ------------------------------------------------------------
// UTILITÁRIOS
// ------------------------------------------------------------
function formatarData(iso) {
    if (!iso) return "—";
    try {
        const d = new Date(iso);
        return d.toLocaleString("pt-BR", {
            day:   "2-digit",
            month: "2-digit",
            year:  "numeric",
            hour:  "2-digit",
            minute:"2-digit"
        });
    } catch {
        return iso;
    }
}