# ============================================================
# DESAFIEI - Servidor Flask
# Sistema de desafios diários para EJA com gamificação
# ============================================================

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
import json
import os
import hashlib
import re
import secrets
import random
from datetime import datetime, date, timedelta
from collections import defaultdict

app = Flask(__name__)
app.secret_key = secrets.token_hex(32)


# ============================================================
# CAMINHOS DOS ARQUIVOS JSON (banco de dados)
# ============================================================
ARQ_USUARIOS            = "usuarios.json"
ARQ_DESAFIOS            = "desafios.json"
ARQ_GRUPOS              = "grupos.json"
ARQ_HISTORICO_DELETADOS = "historico_deletados.json"


# ============================================================
# LISTA DE DIAS DA SEMANA
# ============================================================
DIAS = ["segunda", "terca", "quarta", "quinta", "sexta", "sabado", "domingo"]


# ============================================================
# 🛡️ ADMINISTRADORES
# ============================================================
ADMIN_EMAILS = [
    "erica.santos.lima15@gmail.com",
]


def eh_admin(email):
    """Verifica se o email é de um administrador."""
    return email in ADMIN_EMAILS


def admin_required():
    """Verifica se o usuário logado é admin."""
    email = session.get("usuario_email")
    return email and eh_admin(email)


# ============================================================
# FUNÇÕES AUXILIARES
# ============================================================
def ler_json(caminho):
    """Lê um arquivo JSON e retorna os dados. Se não existir, retorna vazio."""
    if not os.path.exists(caminho):
        return {}
    with open(caminho, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except Exception:
            return {}


def gravar_json(caminho, dados):
    """Grava dados em um arquivo JSON de forma legível."""
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=4)


def hash_senha(senha):
    """Criptografa a senha com SHA-256."""
    return hashlib.sha256(senha.encode()).hexdigest()


# ============================================================
# VALIDAÇÕES
# ============================================================
def validar_email(email):
    """Verifica se o email tem formato válido."""
    padrao = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    return re.match(padrao, email) is not None


def validar_whatsapp(numero):
    """WhatsApp deve ter 11 dígitos (DDD + 9 números)."""
    apenas_numeros = re.sub(r"\D", "", numero)
    return len(apenas_numeros) == 11


def validar_idade(idade):
    """Idade deve ter 2 dígitos (10 a 99 anos)."""
    return idade.isdigit() and len(idade) == 2


# ============================================================
# SISTEMA DE XP POR HORÁRIO
# ============================================================
def calcular_multiplicador_xp():
    """
    Retorna o multiplicador de XP por horário:
      - Manhã  (05h-11h59): x1
      - Tarde  (12h-16h59): x1
      - Noite  (17h-23h59): x2 (dobro!)
      - Madrugada (00h-04h59): x0 (só revisão)
    """
    hora = datetime.now().hour
    if 5 <= hora < 12:
        return 1.0, "manha"
    elif 12 <= hora < 17:
        return 1.0, "tarde"
    elif 17 <= hora < 24:
        return 2.0, "noite"
    else:
        return 0.0, "madrugada"


# ============================================================
# ESTÁGIOS DE RANQUE
# ============================================================
ESTAGIOS = [
    {"nome": "Latão I",   "min_xp": 0},
    {"nome": "Latão II",  "min_xp": 100},
    {"nome": "Bronze",    "min_xp": 300},
    {"nome": "Prata",     "min_xp": 600},
    {"nome": "Ouro",      "min_xp": 1000},
    {"nome": "Platina",   "min_xp": 1600},
    {"nome": "Esmeralda", "min_xp": 2400},
    {"nome": "Rubi",      "min_xp": 3400},
    {"nome": "Mestre",    "min_xp": 4800},
    {"nome": "Diamante",  "min_xp": 7000},
]


def calcular_estagio(xp):
    """Descobre o estágio atual do aluno baseado no XP."""
    atual = ESTAGIOS[0]
    for est in ESTAGIOS:
        if xp >= est["min_xp"]:
            atual = est
    return atual["nome"]


# ============================================================
# 🔀 ATIVIDADES ALEATÓRIAS SEM REPETIÇÃO
# ============================================================
def gerar_semente_aluno(email, dia):
    """
    Gera uma semente única por aluno + dia.
    Garante ordem diferente por aluno, mas estável no mesmo dia.
    """
    texto = f"{email}-{dia}-{date.today().isoformat()}"
    return int(hashlib.md5(texto.encode()).hexdigest(), 16) % (2**32)


def coletar_atividades_semana(desafios_nivel, dia_atual_idx):
    """Junta TODAS as atividades dos 7 dias e remove duplicatas."""
    vistas = set()
    atividades_unicas = []

    for d in DIAS:
        dia_info = desafios_nivel.get(d, {})
        for atv in dia_info.get("atividades", []):
            chave = (atv["materia"], atv["pergunta"])
            if chave not in vistas:
                vistas.add(chave)
                atividades_unicas.append(atv)

    return atividades_unicas


def embaralhar_com_semente(lista, semente):
    """Embaralha usando a semente (mesma semente = mesma ordem)."""
    rnd = random.Random(semente)
    copia = lista[:]
    rnd.shuffle(copia)
    return copia


# ============================================================
# 🤖 CORUJINHA IA — Análise de erros e recomendações
# ============================================================
def analisar_erros_aluno(historico):
    """Conta erros por matéria nos últimos 30 registros."""
    erros_por_materia = {}
    for h in historico[-30:]:
        if not h.get("acertou"):
            materia = h.get("materia", "Outros")
            erros_por_materia[materia] = erros_por_materia.get(materia, 0) + 1
    return erros_por_materia


def gerar_recomendacao_corujinha(historico, nome_aluno):
    """Gera mensagem personalizada da Corujinha."""
    erros = analisar_erros_aluno(historico)
    if not erros:
        return None

    pior_materia = max(erros, key=erros.get)
    qtd_erros = erros[pior_materia]

    if qtd_erros < 3:
        return None

    dicas = {
        "Português": "leia mais textos e reveja as classes de palavras. Uma boa dica é ler em voz alta!",
        "Matemática": "pratique bastante as 4 operações. Tente fazer 5 continhas antes de dormir!",
        "Conhecimentos Gerais": "que tal assistir a um documentário curto hoje? Aprendizado leve é mais fácil!",
        "Interpretação de Texto": "leia devagar, sublinhe as partes importantes e volte ao texto antes de responder.",
    }
    dica = dicas.get(pior_materia, "revise o conteúdo com calma e sem pressa!")

    return {
        "materia": pior_materia,
        "erros": qtd_erros,
        "mensagem": f"Ei, {nome_aluno}! Percebi que você errou {qtd_erros} vezes em {pior_materia}. "
                    f"Que tal {dica}",
        "emoji": "🦉"
    }


# ============================================================
# CRIAR DESAFIOS PADRÃO (fallback)
# ============================================================
def criar_desafios_padrao():
    """Se o desafios.json não existir, cria um arquivo mínimo."""
    if os.path.exists(ARQ_DESAFIOS):
        return

    minimo = {
        "iniciante": {"segunda": {"titulo": "Segunda", "dificuldade": 1, "atividades": []}},
        "medio":     {"segunda": {"titulo": "Segunda", "dificuldade": 2, "atividades": []}},
        "dificil":   {"segunda": {"titulo": "Segunda", "dificuldade": 3, "atividades": []}},
    }
    gravar_json(ARQ_DESAFIOS, minimo)


# ============================================================
# 🏆 CONQUISTAS
# ============================================================
CONQUISTAS = [
    {"id": "primeiro",   "nome": "Primeira vez",    "icone": "🎯",
     "desc": "Complete seu primeiro desafio",
     "condicao": lambda u: len([h for h in u.get("historico", []) if h.get("concluido")]) >= 1},

    {"id": "5_desafios", "nome": "Começando bem",   "icone": "🌱",
     "desc": "Complete 5 desafios",
     "condicao": lambda u: len([h for h in u.get("historico", []) if h.get("concluido")]) >= 5},

    {"id": "ofensiva3",  "nome": "Trinca Perfeita", "icone": "✨",
     "desc": "Ofensiva de 3 dias",
     "condicao": lambda u: u.get("ofensiva", 0) >= 3},

    {"id": "ofensiva7",  "nome": "Chama Acesa",     "icone": "🔥",
     "desc": "Ofensiva de 7 dias seguidos",
     "condicao": lambda u: u.get("ofensiva", 0) >= 7},

    {"id": "ofensiva30", "nome": "Lenda Viva",      "icone": "👑",
     "desc": "Ofensiva de 30 dias!",
     "condicao": lambda u: u.get("ofensiva", 0) >= 30},

    {"id": "xp500",      "nome": "Meio Caminho",    "icone": "⚡",
     "desc": "Alcance 500 XP",
     "condicao": lambda u: u.get("xp", 0) >= 500},

    {"id": "xp1000",     "nome": "Milhar",          "icone": "💫",
     "desc": "Alcance 1000 XP",
     "condicao": lambda u: u.get("xp", 0) >= 1000},

    {"id": "prata",      "nome": "Prata Brilhante", "icone": "🥈",
     "desc": "Chegue ao estágio Prata",
     "condicao": lambda u: u.get("estagio", "") in ["Prata", "Ouro", "Platina", "Esmeralda", "Rubi", "Mestre", "Diamante"]},

    {"id": "diamante",   "nome": "Diamante",        "icone": "💎",
     "desc": "Chegue ao estágio Diamante",
     "condicao": lambda u: u.get("estagio", "") == "Diamante"},
]


# ============================================================
# ROTAS DE PÁGINAS (HTML)
# ============================================================
@app.route("/")
def index():
    """Página inicial - se logado vai pro destino correto, senão mostra login."""
    if "usuario_email" in session:
        # 🛡️ Admin vai pro painel, aluno vai pro dashboard
        if eh_admin(session["usuario_email"]):
            return redirect(url_for("admin_page"))
        return redirect(url_for("dashboard"))
    return render_template("index.html")

@app.route("/manifest.json")
def manifest():
    """Serve o manifest do PWA na raiz."""
    return app.send_static_file("manifest.json")


@app.route("/cadastro", methods=["GET", "POST"])
def cadastro():
    """Tela de cadastro - valida todos os campos obrigatórios."""
    if request.method == "POST":
        nome          = request.form.get("nome", "").strip()
        idade         = request.form.get("idade", "").strip()
        email         = request.form.get("email", "").strip().lower()
        whatsapp      = request.form.get("whatsapp", "").strip()
        dificuldade   = request.form.get("dificuldade", "").strip()
        nivel         = request.form.get("nivel", "iniciante").strip().lower()
        senha         = request.form.get("senha", "")
        foto          = request.form.get("foto", "")
        avatar_emoji  = request.form.get("avatar_emoji", "🦉")

        if not nome:
            return jsonify({"erro": "Nome é obrigatório"}), 400
        if not validar_idade(idade):
            return jsonify({"erro": "Idade deve ter 2 dígitos"}), 400
        if not validar_email(email):
            return jsonify({"erro": "Email inválido"}), 400
        if not validar_whatsapp(whatsapp):
            return jsonify({"erro": "WhatsApp deve ter 11 dígitos (DDD + número)"}), 400
        if len(senha) < 4:
            return jsonify({"erro": "Senha muito curta (mínimo 4 caracteres)"}), 400
        if nivel not in ("iniciante", "medio", "dificil"):
            nivel = "iniciante"

        usuarios = ler_json(ARQ_USUARIOS)
        if email in usuarios:
            return jsonify({"erro": "Email já cadastrado"}), 400

        usuarios[email] = {
            "nome":               nome,
            "idade":              idade,
            "email":              email,
            "whatsapp":           re.sub(r"\D", "", whatsapp),
            "dificuldade":        dificuldade,
            "nivel":              nivel,
            "senha_hash":         hash_senha(senha),
            "foto":               foto,
            "avatar_emoji":       avatar_emoji,
            "xp":                 0,
            "estagio":            "Latão I",
            "ofensiva":           0,
            "ultimo_dia_logado":  "",
            "ultimo_xp_diario":   "",
            "anotacoes":          [],
            "historico":          [],
            "amigos":             [],
            "grupos":             [],
            "criado_em":          datetime.now().isoformat(),
            "primeiro_acesso":    True,
        }
        gravar_json(ARQ_USUARIOS, usuarios)

        session["usuario_email"] = email
        return jsonify({"ok": True, "redirect": "/dashboard"})

    return render_template("cadastro.html")


@app.route("/login", methods=["POST"])
def login():
    """Login simples com email e senha."""
    email = request.form.get("email", "").strip().lower()
    senha = request.form.get("senha", "")

    usuarios = ler_json(ARQ_USUARIOS)
    if email not in usuarios or usuarios[email]["senha_hash"] != hash_senha(senha):
        return jsonify({"erro": "Email ou senha incorretos"}), 401

    # 🚫 Bloqueia usuários banidos
    if usuarios[email].get("banido"):
        return jsonify({"erro": "Sua conta foi suspensa. Entre em contato com o suporte."}), 403

    session["usuario_email"] = email
    return jsonify({"ok": True, "redirect": "/dashboard"})

@app.route("/logout")
def logout():
    """Sai da conta."""
    session.clear()
    return redirect(url_for("index"))


@app.route("/dashboard")
def dashboard():
    """Painel principal - mostra desafio do dia."""
    if "usuario_email" not in session:
        return redirect(url_for("index"))
    return render_template("dashboard.html")


@app.route("/ranking.html")
def ranking_page():
    """Página de ranking."""
    if "usuario_email" not in session:
        return redirect(url_for("index"))
    return render_template("ranking.html")


@app.route("/perfil.html")
def perfil_page():
    """Página de perfil do aluno."""
    if "usuario_email" not in session:
        return redirect(url_for("index"))
    return render_template("perfil.html")


@app.route("/desafio")
def pagina_desafio():
    """Página dedicada a jogar o desafio do dia."""
    if "usuario_email" not in session:
        return redirect(url_for("index"))
    return render_template("desafio.html")


@app.route("/conta-deletada")
def conta_deletada():
    """Página de despedida após deletar a conta."""
    nome = session.pop("nome_deletado", None)
    return render_template("conta_deletada.html", nome=nome)


# ============================================================
# APIs
# ============================================================

@app.route("/api/meu-perfil")
def api_meu_perfil():
    """Retorna os dados do usuário logado (sem a senha)."""
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios.get(email, {})
    u.pop("senha_hash", None)

    # 🛡️ Adiciona flag "admin" para o frontend
    u["admin"] = eh_admin(email)

    return jsonify(u)


@app.route("/api/recomendacao")
def api_recomendacao():
    """Retorna uma recomendação personalizada da Corujinha IA."""
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios.get(email, {})
    historico = u.get("historico", [])
    nome = u.get("nome", "aluno").split(" ")[0]

    recomendacao = gerar_recomendacao_corujinha(historico, nome)
    return jsonify(recomendacao or {"mensagem": None})


# ============================================================
# API: DESAFIO DO DIA
# ============================================================
@app.route("/api/desafio-hoje")
def api_desafio_hoje():
    """
    Retorna os 7 dias + o desafio de HOJE (com atividades embaralhadas).
    """
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    multiplicador, periodo = calcular_multiplicador_xp()
    criar_desafios_padrao()
    desafios = ler_json(ARQ_DESAFIOS)

    usuarios = ler_json(ARQ_USUARIOS)
    usuario = usuarios.get(email, {})
    nivel = usuario.get("nivel", "iniciante")
    if nivel not in desafios:
        nivel = "iniciante"

    desafios_nivel = desafios[nivel]

    hoje = datetime.now().weekday()
    dia_hoje = DIAS[hoje]

    # Descobre o que já foi concluído
    historico = usuario.get("historico", [])
    concluidos = {}
    for d in DIAS:
        concluidos[d] = any(h.get("dia") == d and h.get("concluido") for h in historico)

    # Monta os 7 cards
    lista_dias = []
    for i, d in enumerate(DIAS):
        info = desafios_nivel.get(d, {})
        concluido = concluidos[d]
        is_hoje = (i == hoje)
        is_futuro = (i > hoje)
        is_passado = (i < hoje)

        if is_hoje:
            status, liberado, ganha_xp = "hoje", True, True
        elif is_passado:
            status, liberado, ganha_xp = "pratica_passada", True, False
        else:
            status, liberado, ganha_xp = "futuro", False, False

        if concluido and not is_futuro:
            status = "concluido"

        lista_dias.append({
            "dia": d,
            "titulo": info.get("titulo", "Sem desafio"),
            "dificuldade": info.get("dificuldade", 1),
            "liberado": liberado,
            "concluido": concluido,
            "is_hoje": is_hoje,
            "status": status,
            "ganha_xp": ganha_xp,
        })

    # 🔥 Desafio do dia atual (com atividades embaralhadas)
    desafio_hoje = None
    if lista_dias[hoje]["is_hoje"] and not lista_dias[hoje]["concluido"]:

        # 1) Coleta TODAS as atividades da semana (sem repetir)
        atividades_unicas = coletar_atividades_semana(desafios_nivel, hoje)

        # 2) Embaralha de forma estável por aluno + dia
        semente = gerar_semente_aluno(email, dia_hoje)
        atividades_embaralhadas = embaralhar_com_semente(atividades_unicas, semente)

        # 3) Pega apenas as 10 primeiras (ou 12 no difícil)
        qtd = 12 if nivel == "dificil" else 10
        atividades_do_dia = atividades_embaralhadas[:qtd]

        desafio_hoje = {
            "titulo": desafios_nivel.get(dia_hoje, {}).get("titulo", "Desafio do dia"),
            "dificuldade": desafios_nivel.get(dia_hoje, {}).get("dificuldade", 1),
            "atividades": atividades_do_dia,
        }

    bloqueado_madrugada = (periodo == "madrugada")

    return jsonify({
        "dia": dia_hoje,
        "hoje_index": hoje,
        "nivel": nivel,
        "dias": lista_dias,
        "desafio": desafio_hoje,
        "multiplicador": multiplicador,
        "periodo": periodo,
        "bloqueado_madrugada": bloqueado_madrugada,
        "mensagem_bloqueio": "🌙 É madrugada! Hora de descansar." if bloqueado_madrugada else "",
        "estagio_atual": calcular_estagio(usuario.get("xp", 0)),
        "xp_atual": usuario.get("xp", 0),
    })


# ============================================================
# API: DESAFIO DE PRÁTICA (dias passados apenas)
# ============================================================
@app.route("/api/desafio-pratica/<dia>")
def api_desafio_pratica(dia):
    """Retorna o desafio de um dia ANTERIOR para prática (sem XP)."""
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    criar_desafios_padrao()
    desafios = ler_json(ARQ_DESAFIOS)

    usuarios = ler_json(ARQ_USUARIOS)
    usuario = usuarios.get(email, {})
    nivel = usuario.get("nivel", "iniciante")
    if nivel not in desafios:
        nivel = "iniciante"

    if dia not in DIAS:
        return jsonify({"erro": "Dia inválido"}), 400

    hoje_idx = datetime.now().weekday()
    dia_idx = DIAS.index(dia)

    if dia_idx >= hoje_idx:
        return jsonify({"erro": "Este dia não está disponível para prática."}), 403

    desafio = desafios[nivel].get(dia, {}).copy()
    atividades = desafio.get("atividades", [])[:]

    random.shuffle(atividades)
    desafio["atividades"] = atividades

    return jsonify({
        "dia": dia,
        "nivel": nivel,
        "desafio": desafio,
        "is_hoje": False,
        "ganha_xp": False,
    })


# ============================================================
# API: RESPONDER
# ============================================================
@app.route("/api/responder", methods=["POST"])
def api_responder():
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    dados    = request.json or {}
    materia  = dados.get("materia")
    pergunta = dados.get("pergunta")
    resposta = dados.get("resposta")
    dia      = dados.get("dia")

    criar_desafios_padrao()
    desafios = ler_json(ARQ_DESAFIOS)

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios.get(email, {})
    nivel = u.get("nivel", "iniciante")
    if nivel not in desafios:
        nivel = "iniciante"

    dia_semana = DIAS[datetime.now().weekday()]

    dia_alvo = dia if dia in DIAS else dia_semana
    desafio_alvo = desafios[nivel].get(dia_alvo, {})

    # Busca a atividade
    atividade = None
    for a in desafio_alvo.get("atividades", []):
        if a["materia"] == materia and a["pergunta"] == pergunta:
            atividade = a
            break

    if not atividade:
        return jsonify({"erro": "Atividade não encontrada"}), 404

    explicacao = atividade.get("explicacao", "Revise o conteúdo e tente novamente!")

    # Errou
    if resposta != atividade["resposta"]:
        return jsonify({
            "acertou": False,
            "resposta_correta": atividade["resposta"],
            "explicacao": explicacao,
            "mensagem": "❌ Resposta errada."
        })

       # Acertou — mas é dia de hoje?
    eh_dia_de_hoje = (dia_alvo == dia_semana)

    if not eh_dia_de_hoje:
        # 🔥 MODO PRÁTICA: ganha 5 XP fixos por acerto
        XP_PRATICA = 5

        estagio_antes = calcular_estagio(u["xp"])
        u["xp"] += XP_PRATICA
        u["estagio"] = calcular_estagio(u["xp"])
        subiu_estagio = (u["estagio"] != estagio_antes)

        # Registra no histórico (para o gráfico e estatísticas)
        u.setdefault("historico", []).append({
            "data": datetime.now().isoformat(),
            "materia": materia,
            "pergunta": pergunta,
            "acertou": True,
            "xp": XP_PRATICA,
            "pratica": True,      # marca como prática
        })

        gravar_json(ARQ_USUARIOS, usuarios)

        return jsonify({
            "acertou": True,
            "xp_ganho": XP_PRATICA,
            "pratica": True,
            "xp_total": u["xp"],
            "estagio": u["estagio"],
            "subiu_estagio": subiu_estagio,
            "estagio_anterior": estagio_antes,
            "mensagem": f"✅ Acertou! +{XP_PRATICA} XP (prática)"
        })
    
    # É dia de hoje — dá XP normalmente
    multiplicador, periodo = calcular_multiplicador_xp()
    if periodo == "madrugada":
        return jsonify({"erro": "🌙 Não é possível ganhar XP na madrugada."}), 403

    estagio_antes = calcular_estagio(u["xp"])
    xp_ganho = int(atividade["xp"] * multiplicador)
    u["xp"] += xp_ganho
    u["estagio"] = calcular_estagio(u["xp"])
    subiu_estagio = (u["estagio"] != estagio_antes)

    u.setdefault("historico", []).append({
        "data": datetime.now().isoformat(),
        "materia": materia,
        "pergunta": pergunta,
        "acertou": True,
        "xp": xp_ganho
    })

    gravar_json(ARQ_USUARIOS, usuarios)
    return jsonify({
        "acertou": True,
        "xp_ganho": xp_ganho,
        "multiplicador": multiplicador,
        "xp_total": u["xp"],
        "estagio": u["estagio"],
        "subiu_estagio": subiu_estagio,
        "estagio_anterior": estagio_antes
    })


# ============================================================
# API: XP DIÁRIO (1x por dia)
# ============================================================
@app.route("/api/xp-diario")
def api_xp_diario():
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios[email]
    hoje = date.today().isoformat()

    if u.get("ultimo_xp_diario") == hoje:
        return jsonify({"ganhou": False, "xp_total": u["xp"]})

    ontem = (date.today() - timedelta(days=1)).isoformat()
    if u.get("ultimo_dia_logado") == ontem:
        u["ofensiva"] = u.get("ofensiva", 0) + 1
    else:
        u["ofensiva"] = 1

    u["ultimo_dia_logado"] = hoje
    u["ultimo_xp_diario"]  = hoje
    u["xp"] += 10
    u["estagio"] = calcular_estagio(u["xp"])
    u["primeiro_acesso"] = False

    gravar_json(ARQ_USUARIOS, usuarios)
    return jsonify({
        "ganhou": True,
        "xp_ganho": 10,
        "xp_total": u["xp"],
        "ofensiva": u["ofensiva"],
        "estagio": u["estagio"]
    })


# ============================================================
# API: DESAFIO DE UM DIA ESPECÍFICO (rota antiga, mantida)
# ============================================================
@app.route("/api/desafio-dia/<dia>")
def api_desafio_dia(dia):
    """Retorna as atividades de um dia (embaralhadas)."""
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    criar_desafios_padrao()
    desafios = ler_json(ARQ_DESAFIOS)

    usuarios = ler_json(ARQ_USUARIOS)
    usuario = usuarios.get(email, {})
    nivel = usuario.get("nivel", "iniciante")
    if nivel not in desafios:
        nivel = "iniciante"

    if dia not in DIAS:
        return jsonify({"erro": "Dia inválido"}), 400

    desafio = desafios[nivel].get(dia, {}).copy()
    atividades = desafio.get("atividades", [])[:]
    random.shuffle(atividades)
    desafio["atividades"] = atividades

    multiplicador, periodo = calcular_multiplicador_xp()

    return jsonify({
        "dia": dia,
        "nivel": nivel,
        "desafio": desafio,
        "multiplicador": multiplicador,
        "periodo": periodo,
    })


# ============================================================
# API: CONCLUIR DIA (+20 XP de bônus)
# ============================================================
@app.route("/api/concluir-dia", methods=["POST"])
def api_concluir_dia():
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    dados = request.json or {}
    dia = dados.get("dia")

    if dia not in DIAS:
        return jsonify({"erro": "Dia inválido"}), 400

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios[email]

    # Já concluiu?
    for h in u.get("historico", []):
        if h.get("dia") == dia and h.get("concluido"):
            return jsonify({"ok": True, "ja_concluido": True})

    u.setdefault("historico", []).append({
        "dia": dia,
        "concluido": True,
        "data": datetime.now().isoformat(),
    })

    u["xp"] = u.get("xp", 0) + 20
    u["estagio"] = calcular_estagio(u["xp"])

    gravar_json(ARQ_USUARIOS, usuarios)
    return jsonify({"ok": True, "xp_total": u["xp"], "bonus": 20})


# ============================================================
# API: RANKING
# ============================================================
@app.route("/api/ranking")
def api_ranking():
    usuarios = ler_json(ARQ_USUARIOS)
    lista = []
    for email, u in usuarios.items():
        lista.append({
            "nome":         u.get("nome", "Aluno"),
            "xp":           u.get("xp", 0),
            "estagio":      u.get("estagio", "Latão I"),
            "ofensiva":     u.get("ofensiva", 0),
            "avatar_emoji": u.get("avatar_emoji", "🦉"),
            "foto":         u.get("foto", ""),
        })
    lista.sort(key=lambda x: x["xp"], reverse=True)
    return jsonify(lista[:50])


# ============================================================
# API: ANOTAÇÕES
# ============================================================
@app.route("/api/anotacoes", methods=["GET", "POST"])
def api_anotacoes():
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios[email]

    if request.method == "POST":
        texto = (request.json or {}).get("texto", "").strip()
        if texto:
            u.setdefault("anotacoes", []).append({
                "data": datetime.now().isoformat(),
                "texto": texto
            })
            gravar_json(ARQ_USUARIOS, usuarios)
        return jsonify({"ok": True})

    return jsonify(u.get("anotacoes", []))


# ============================================================
# API: DELETAR CONTA
# ============================================================
@app.route("/api/deletar-conta", methods=["POST"])
def api_deletar_conta():
    """Remove a conta e guarda no histórico de deletados."""
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios.get(email, {})
    nome = u.get("nome", "aluno").split(" ")[0]

    # 🔥 Salva no histórico ANTES de apagar
    if u:
        deletados = ler_json(ARQ_HISTORICO_DELETADOS)
        deletados[email] = {
            "nome":        u.get("nome", ""),
            "idade":       u.get("idade", ""),
            "xp":          u.get("xp", 0),
            "estagio":     u.get("estagio", "Latão I"),
            "nivel":       u.get("nivel", "iniciante"),
            "ofensiva":    u.get("ofensiva", 0),
            "criado_em":   u.get("criado_em", ""),
            "deletado_em": datetime.now().isoformat(),
            "historico":   u.get("historico", []),
        }
        gravar_json(ARQ_HISTORICO_DELETADOS, deletados)

    usuarios.pop(email, None)
    gravar_json(ARQ_USUARIOS, usuarios)

    session.clear()
    session["nome_deletado"] = nome

    return jsonify({"ok": True, "redirect": "/conta-deletada"})


# ============================================================
# API: ATUALIZAR FOTO / AVATAR
# ============================================================
@app.route("/api/atualizar-foto", methods=["POST"])
def api_atualizar_foto():
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    dados = request.json or {}
    usuarios = ler_json(ARQ_USUARIOS)

    if "foto" in dados:
        usuarios[email]["foto"] = dados["foto"]
    if "avatar_emoji" in dados:
        usuarios[email]["avatar_emoji"] = dados["avatar_emoji"]

    gravar_json(ARQ_USUARIOS, usuarios)
    return jsonify({"ok": True})


# ============================================================
# API: HISTÓRICO DE XP
# ============================================================
@app.route("/api/historico-xp")
def api_historico_xp():
    """Retorna o XP ganho por dia nos últimos 30 dias."""
    email = session.get("usuario_email")
    if not email:
        return jsonify({"erro": "Não logado"}), 401

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios.get(email, {})

    por_dia = defaultdict(int)
    for h in u.get("historico", []):
        data = h.get("data", "")[:10]
        if data:
            por_dia[data] += h.get("xp", 0)

    dias = sorted(por_dia.keys())[-30:]
    return jsonify({
        "dias": dias,
        "xp": [por_dia[d] for d in dias]
    })


# ============================================================
# API: CONQUISTAS
# ============================================================
@app.route("/api/conquistas")
def api_conquistas():
    email = session.get("usuario_email")
    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios[email]

    conquistadas = []
    for c in CONQUISTAS:
        if c["condicao"](u):
            conquistadas.append({
                "id": c["id"],
                "nome": c["nome"],
                "icone": c["icone"],
                "desc": c["desc"]
            })

    return jsonify(conquistadas)


# ============================================================
# API: CONTEÚDOS DE ESTUDO
# ============================================================
@app.route("/api/conteudos")
def api_conteudos():
    """Retorna conteúdos por disciplina (usado quando não há desafio)."""
    conteudos = {
        "Portugues": [
            {"titulo": "Classes de palavras",     "descricao": "Substantivo, adjetivo, verbo, advérbio...", "link": "https://www.todamateria.com.br/classes-de-palavras/", "icone": "📖"},
            {"titulo": "Concordância verbal",     "descricao": "Regras essenciais de concordância.",          "link": "https://www.todamateria.com.br/concordancia-verbal/", "icone": "✍️"},
            {"titulo": "Regência",                "descricao": "Regência verbal e nominal.",                  "link": "https://www.todamateria.com.br/regencia-verbal/", "icone": "🔤"},
            {"titulo": "Crase",                   "descricao": "Quando usar ou não a crase.",                  "link": "https://www.todamateria.com.br/crase/", "icone": "❓"},
        ],
        "Matematica": [
            {"titulo": "Frações",                 "descricao": "Soma, subtração, multiplicação e divisão.",   "link": "https://www.todamateria.com.br/fracoes/", "icone": "➗"},
            {"titulo": "Porcentagem",             "descricao": "Cálculos com descontos e aumentos.",          "link": "https://www.todamateria.com.br/porcentagem/", "icone": "💯"},
            {"titulo": "Regra de três",           "descricao": "Simples e composta.",                         "link": "https://www.todamateria.com.br/regra-de-tres/", "icone": "📐"},
            {"titulo": "Equações 1º grau",        "descricao": "Isolar a incógnita e resolver.",              "link": "https://www.todamateria.com.br/equacao-do-primeiro-grau/", "icone": "🟰"},
        ],
        "Historia": [
            {"titulo": "Brasil Colônia",          "descricao": "Do descobrimento à independência.",           "link": "https://www.todamateria.com.br/brasil-colonia/", "icone": "⛵"},
            {"titulo": "Era Vargas",              "descricao": "1930–1945, industrialização e leis trabalhistas.", "link": "https://www.todamateria.com.br/era-vargas/", "icone": "🏛️"},
            {"titulo": "Ditadura Militar",        "descricao": "1964–1985, contexto e consequências.",        "link": "https://www.todamateria.com.br/ditadura-militar/", "icone": "🎖️"},
            {"titulo": "Revolução Industrial",    "descricao": "Séc. XVIII, Inglaterra.",                     "link": "https://www.todamateria.com.br/revolucao-industrial/", "icone": "🏭"},
        ],
        "Geografia": [
            {"titulo": "Regiões do Brasil",       "descricao": "5 regiões e suas características.",           "link": "https://www.todamateria.com.br/regioes-do-brasil/", "icone": "🗺️"},
            {"titulo": "Climas",                  "descricao": "Tipos de clima e fatores climáticos.",        "link": "https://www.todamateria.com.br/climas-do-brasil/", "icone": "🌤️"},
            {"titulo": "Relevo brasileiro",       "descricao": "Planaltos, planícies e depressões.",           "link": "https://www.todamateria.com.br/relevo-brasileiro/", "icone": "⛰️"},
            {"titulo": "Globalização",            "descricao": "Economia mundial e blocos econômicos.",       "link": "https://www.todamateria.com.br/globalizacao/", "icone": "🌍"},
        ],
        "Economia": [
            {"titulo": "Educação financeira",     "descricao": "Orçamento pessoal e poupança.",              "link": "https://www.todamateria.com.br/educacao-financeira/", "icone": "💰"},
            {"titulo": "Inflação",                "descricao": "O que é e como afeta o dia a dia.",          "link": "https://www.todamateria.com.br/inflacao/", "icone": "📈"},
            {"titulo": "Juros simples e compostos", "descricao": "Diferenças e cálculos.",                    "link": "https://www.todamateria.com.br/juros-simples-e-compostos/", "icone": "🏦"},
            {"titulo": "Mercado de trabalho",     "descricao": "Formal, informal e empreendedorismo.",      "link": "https://www.todamateria.com.br/mercado-de-trabalho/", "icone": "💼"},
        ],
        "Domestico": [
            {"titulo": "Orçamento familiar",      "descricao": "Como organizar as contas da casa.",           "link": "https://www.todamateria.com.br/orcamento-familiar/", "icone": "🏠"},
            {"titulo": "Primeiros socorros",      "descricao": "O que fazer em emergências.",                  "link": "https://www.todamateria.com.br/primeiros-socorros/", "icone": "🚑"},
            {"titulo": "Alimentação saudável",    "descricao": "Nutrição básica para o dia a dia.",           "link": "https://www.todamateria.com.br/alimentacao-saudavel/", "icone": "🥗"},
            {"titulo": "Consumo consciente",      "descricao": "Reduzir, reutilizar e reciclar.",             "link": "https://www.todamateria.com.br/consumo-consciente/", "icone": "♻️"},
        ],
    }
    return jsonify(conteudos)


# ============================================================
# 🛡️ PAINEL DE ADMINISTRADOR — ROTAS
# ============================================================

@app.route("/admin")
def admin_page():
    """Página principal do painel de administrador."""
    if not admin_required():
        return redirect(url_for("index"))
    return render_template("admin.html")


@app.route("/api/admin/stats")
def api_admin_stats():
    """Retorna estatísticas gerais do site."""
    if not admin_required():
        return jsonify({"erro": "Acesso negado"}), 403

    usuarios = ler_json(ARQ_USUARIOS)
    deletados = ler_json(ARQ_HISTORICO_DELETADOS)

    total = len(usuarios)
    xp_total = sum(u.get("xp", 0) for u in usuarios.values())
    ativos_semana = 0

    hoje = date.today()
    for u in usuarios.values():
        ultimo = u.get("ultimo_dia_logado", "")
        if ultimo:
            try:
                data = datetime.fromisoformat(ultimo).date()
                if (hoje - data).days <= 7:
                    ativos_semana += 1
            except:
                pass

    estagios_count = {}
    for u in usuarios.values():
        est = u.get("estagio", "Latão I")
        estagios_count[est] = estagios_count.get(est, 0) + 1

    niveis_count = {}
    for u in usuarios.values():
        n = u.get("nivel", "iniciante")
        niveis_count[n] = niveis_count.get(n, 0) + 1

    return jsonify({
        "total_usuarios":  total,
        "total_deletados": len(deletados),
        "xp_total_site":   xp_total,
        "media_xp":        round(xp_total / total, 1) if total else 0,
        "ativos_semana":   ativos_semana,
        "estagios":        estagios_count,
        "niveis":          niveis_count,
    })


@app.route("/api/admin/usuarios")
def api_admin_usuarios():
    """Retorna todos os usuários cadastrados."""
    if not admin_required():
        return jsonify({"erro": "Acesso negado"}), 403

    usuarios = ler_json(ARQ_USUARIOS)
    lista = []

    for email, u in usuarios.items():
        lista.append({
            "email":          email,
            "nome":           u.get("nome", ""),
            "idade":          u.get("idade", ""),
            "whatsapp":       u.get("whatsapp", ""),
            "nivel":          u.get("nivel", "iniciante"),
            "xp":             u.get("xp", 0),
            "estagio":        u.get("estagio", "Latão I"),
            "ofensiva":       u.get("ofensiva", 0),
            "avatar_emoji":   u.get("avatar_emoji", "🦉"),
            "ultimo_login":   u.get("ultimo_dia_logado", ""),
            "criado_em":      u.get("criado_em", ""),
            "total_acertos":  sum(1 for h in u.get("historico", []) if h.get("acertou")),
            "total_desafios": sum(1 for h in u.get("historico", []) if h.get("concluido")),
            "banido":         u.get("banido", False),
            "dificuldade":    u.get("dificuldade", ""),
            "admin":          eh_admin(email),
        })

    lista.sort(key=lambda x: x["xp"], reverse=True)
    return jsonify(lista)


@app.route("/api/admin/usuario/<email>")
def api_admin_usuario(email):
    """Retorna detalhes completos de um usuário específico."""
    if not admin_required():
        return jsonify({"erro": "Acesso negado"}), 403

    usuarios = ler_json(ARQ_USUARIOS)
    u = usuarios.get(email)
    if not u:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    erros_por_materia = {}
    acertos_por_materia = {}
    for h in u.get("historico", []):
        materia = h.get("materia")
        if not materia:
            continue
        if h.get("acertou"):
            acertos_por_materia[materia] = acertos_por_materia.get(materia, 0) + 1
        else:
            erros_por_materia[materia] = erros_por_materia.get(materia, 0) + 1

    xp_por_dia = defaultdict(int)
    for h in u.get("historico", []):
        data = h.get("data", "")[:10]
        if data:
            xp_por_dia[data] += h.get("xp", 0)

    dias = sorted(xp_por_dia.keys())[-30:]

    dados = {k: v for k, v in u.items() if k != "senha_hash"}

    return jsonify({
        "usuario":             dados,
        "acertos_por_materia": acertos_por_materia,
        "erros_por_materia":   erros_por_materia,
        "xp_por_dia": {
            "dias": dias,
            "xp":   [xp_por_dia[d] for d in dias]
        }
    })


@app.route("/api/admin/deletados")
def api_admin_deletados():
    """Retorna o histórico de contas deletadas."""
    if not admin_required():
        return jsonify({"erro": "Acesso negado"}), 403

    deletados = ler_json(ARQ_HISTORICO_DELETADOS)
    lista = []

    for email, info in deletados.items():
        lista.append({
            "email":       email,
            "nome":        info.get("nome", ""),
            "idade":       info.get("idade", ""),
            "xp":          info.get("xp", 0),
            "estagio":     info.get("estagio", "Latão I"),
            "criado_em":   info.get("criado_em", ""),
            "deletado_em": info.get("deletado_em", ""),
        })

    lista.sort(key=lambda x: x["deletado_em"], reverse=True)
    return jsonify(lista)


@app.route("/api/admin/banir", methods=["POST"])
def api_admin_banir():
    """Bane ou desbane um usuário."""
    if not admin_required():
        return jsonify({"erro": "Acesso negado"}), 403

    dados = request.json or {}
    email = dados.get("email")
    banir = dados.get("banir", True)

    usuarios = ler_json(ARQ_USUARIOS)
    if email not in usuarios:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    usuarios[email]["banido"] = banir
    gravar_json(ARQ_USUARIOS, usuarios)
    return jsonify({"ok": True, "banido": banir})


@app.route("/api/admin/backup")
def api_admin_backup():
    """Retorna todos os dados para download (backup)."""
    if not admin_required():
        return jsonify({"erro": "Acesso negado"}), 403

    usuarios = ler_json(ARQ_USUARIOS)

    # Remove senhas do backup público
    for u in usuarios.values():
        u.pop("senha_hash", None)

    return jsonify({
        "usuarios": usuarios,
        "exportado_em": datetime.now().isoformat(),
        "total": len(usuarios)
    })


# ============================================================
# API: POLÍTICA DE PRIVACIDADE
# ============================================================
@app.route("/api/politica-privacidade")
def api_politica():
    return jsonify({
        "titulo": "Política de Privacidade - Desafiei",
        "texto": (
            "O Desafiei respeita sua privacidade. Coletamos apenas: nome, idade, email, "
            "WhatsApp, dificuldades relatadas e foto/avatar. Esses dados são usados para "
            "personalizar sua experiência, enviar lembretes e exibir no ranking. "
            "Você pode deletar sua conta a qualquer momento. Não compartilhamos seus dados "
            "com terceiros sem consentimento."
        )
    })


# ============================================================
# INICIALIZAÇÃO
# ============================================================
if __name__ == "__main__":
    criar_desafios_padrao()
    app.run(debug=True, host="0.0.0.0", port=5000)