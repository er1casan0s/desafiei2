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
async function carregarGraficoMaterias() {
    try {
        const resp = await fetch("/api/admin/usuarios");
        const usuarios = await resp.json();

        // Agrega acertos de todos os usuários por matéria
        const porMateria = {};
        for (const u of usuarios) {
            const det = await fetch(`/api/admin/usuario/${encodeURIComponent(u.email)}`).then(r => r.json());
            for (const [m, qtd] of Object.entries(det.acertos_por_materia || {})) {
                porMateria[m] = (porMateria[m] || 0) + qtd;
            }
        }

        const labels = Object.keys(porMateria);
        const valores = Object.values(porMateria);

        if (labels.length === 0) {
            document.getElementById("grafico-materias").parentElement.innerHTML +=
                '<p style="text-align:center;color:var(--texto-sec)">Sem dados ainda.</p>';
            return;
        }

        new Chart(document.getElementById("grafico-materias"), {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Total de acertos",
                    data: valores,
                    backgroundColor: [
                        "rgba(59, 158, 255, 0.7)",
                        "rgba(255, 204, 77, 0.7)",
                        "rgba(0, 214, 143, 0.7)",
                        "rgba(139, 124, 246, 0.7)",
                        "rgba(255, 92, 122, 0.7)",
                    ],
                    borderRadius: 10,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    } catch (e) {
        console.warn("Erro no gráfico:", e);
    }
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