let tarefas = [];
let lembretes = [];
let dataAtual = new Date();
let notasMensais = {};

document.addEventListener("DOMContentLoaded", () => {
    carregarTarefas();

    if (document.querySelector(".kanban") && document.querySelector("#entrada")) {
        renderizarTarefas();
    }

    if (document.querySelector("#lista-concluidas")) {
        renderizarConcluidas();
    }

    if (document.querySelector("#calendarGrid")) {
        carregarLembretes();
        carregarNotasMes();
        renderizarCalendario();
        atualizarNotaMes();

        document.getElementById("prevMes")?.addEventListener("click", () => {
            dataAtual.setMonth(dataAtual.getMonth() - 1);
            renderizarCalendario();
            atualizarNotaMes();
        });

        document.getElementById("nextMes")?.addEventListener("click", () => {
            dataAtual.setMonth(dataAtual.getMonth() + 1);
            renderizarCalendario();
            atualizarNotaMes()
        });

        document.getElementById("btnAddLembrete").addEventListener("click", () => {
            const desc = document.getElementById("lembrete").value;
            const data = document.getElementById("data").value;
            const hora = document.getElementById("hora").value;

            if (!desc || !data) {
                alert("Preencha a descrição e a data!");
                return;
            }

            criarLembrete(desc, data, hora);

            document.getElementById("lembrete").value = "";
            document.getElementById("data").value = "";
            document.getElementById("hora").value = "";
        });

        document.getElementById("btnNotasMes")?.addEventListener("click", () => {
            const input = document.getElementById("notasMes");
            notasMensais[chaveMes()] = input.value;
            salvarNotaMes();
            atualizarNotaMes();
        });

    }
});

function salvarTarefas() {
    localStorage.setItem("tarefas", JSON.stringify(tarefas));
}


function carregarTarefas() {
    const dados = localStorage.getItem("tarefas");
    tarefas = dados ? JSON.parse(dados) : [];
}

function criarTarefa(descricao, prioridade, data) {
    const nova = {
        id: Date.now().toString(),
        descricao,
        prioridade,
        coluna: "entrada",
        data: data || null,
        concluida: false,
        criadaEm: Date.now()
    }

    tarefas.push(nova);
    salvarTarefas();
    renderizarTarefas();
}

document.querySelector("#btnAdicionar").addEventListener("click", () => {
    const desc = document.querySelector("input[type=text]").value;
    const prio = document.querySelector("#prioridade").value;
    const data = document.querySelector("input[type=date]").value;

    criarTarefa(desc, prio, data);
});

function renderizarTarefas() {
    document.querySelectorAll(".cards").forEach(col => col.innerHTML = "");

    tarefas
        .filter(t => !t.concluida)
        .forEach(tarefa => {
            const card = criarCard(tarefa);

            document
                .querySelector(`#${tarefa.coluna} .cards`)
                .appendChild(card);
        });

    renderizarAgenda();
}

function criarCard(tarefa) {
    const div = document.createElement("div");
    div.className = `card card-${tarefa.prioridade}`;
    div.draggable = true;
    div.dataset.id = tarefa.id;

    div.innerHTML = `
        <strong>${tarefa.descricao}</strong>
        ${tarefa.data ? `<div>📅 ${formatarData(tarefa.data)}</div>` : ""}

        <div class="card-actions">
            <button onclick="editar('${tarefa.id}')">✏️</button>
            <button onclick="concluir('${tarefa.id}')">✔️</button>
        </div>
    `;

    adicionarEventosDrag(div);
    return div;
}

function formatarData(data) {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

function editar(id) {
    const tarefa = tarefas.find(t => t.id === id);
    const novaDesc = prompt("Editar tarefa:", tarefa.descricao);

    if (novaDesc) {
        tarefa.descricao = novaDesc;
        salvarTarefas();
        renderizarTarefas();
    }
}

function concluir(id) {
    const tarefa = tarefas.find(t => t.id === id);
    tarefa.concluida = true;

    salvarTarefas();
    renderizarTarefas();
}

function deletar(id) {
    tarefas = tarefas.filter(t => t.id !== id);
    salvarTarefas();

    if (document.querySelector("#lista-concluidas")) {
        renderizarConcluidas();
    } else {
        renderizarTarefas();
    }
}

let tarefaArrastada = null;

function adicionarEventosDrag(card) {
    card.addEventListener("dragstart", () => {
        tarefaArrastada = card.dataset.id;
    });
}

document.querySelectorAll(".column").forEach(coluna => {

    coluna.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    coluna.addEventListener("drop", () => {
        moverTarefa(tarefaArrastada, coluna.id);
    });

});

function moverTarefa(id, novaColuna) {
    const tarefa = tarefas.find(t => t.id === id);
    tarefa.coluna = novaColuna;

    salvarTarefas();
    renderizarTarefas();
}

function formatoLocal(data) {
    const d = new Date(data);
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function filtroHoje(data) {
    const hoje = new Date();
    const hojeFormatado = formatoLocal(hoje);

    return data === hojeFormatado;
}

function filtroSemana(data) {
    const hoje = new Date();
    const futura = new Date();
    futura.setDate(hoje.getDate() + 7);

    const d = new Date(data);
    return d >= hoje && d <= futura;
}

function renderizarAgenda() {
    const hojeDiv = document.querySelector("#lista-hoje");
    const semanaDiv = document.querySelector("#lista-semana");

    hojeDiv.innerHTML = "";
    semanaDiv.innerHTML = "";

    tarefas
        .filter(t => !t.concluida)
        .forEach(t => {
            if (t.data) {

                if (filtroHoje(t.data)) {
                    hojeDiv.innerHTML += `
                        <div class="task-chip prioridade-${t.prioridade}">
                            <span class="task-icon">📌</span>
                            <span class="task-text">${t.descricao}</span>
                            <span class="task-date">📅 ${formatarData(t.data)}</span>
                        </div>
                `;
                } else if (filtroSemana(t.data)) {
                    semanaDiv.innerHTML += `
                    <div class="task-chip prioridade-${t.prioridade}">
                        <span class="task-icon">📌</span>
                        <span class="task-text">${t.descricao}</span>
                        <span class="task-date">📅 ${formatarData(t.data)}</span>
                    </div>
                `;
                }
            }
        });
}

function renderizarConcluidas() {
    const lista = document.querySelector("#lista-concluidas");

    lista.innerHTML = "";

    tarefas
        .filter(t => t.concluida)
        .sort((a, b) => b.criadaEm - a.criadaEm)
        .forEach(t => {
            lista.innerHTML += `
                <div class="card card-${t.prioridade}">
                    <strong>${t.descricao}</strong>

                    ${t.data ? `<div class="card-date">📅 ${formatarData(t.data)}</div>` : ""}

                    <button onclick="restaurar('${t.id}')">↩️</button>
                    <button onclick="deletar('${t.id}')">🗑️</button>
                </div>
            `;
        });
}

function restaurar(id) {
    const tarefa = tarefas.find(t => t.id === id);
    tarefa.concluida = false;
    tarefa.coluna = "entrada";

    salvarTarefas();
    renderizarConcluidas();
};

function salvarLembretes() {
    localStorage.setItem("lembretes", JSON.stringify(lembretes));
}

function carregarLembretes() {
    const dados = localStorage.getItem("lembretes");
    lembretes = dados ? JSON.parse(dados) : [];
}

function criarLembrete(descricao, data, hora) {
    const novo = {
        id: Date.now().toString(),
        descricao: descricao,
        data: data,
        hora: hora || null,
        criadaEm: Date.now()
    }

    lembretes.push(novo);
    salvarLembretes();
    renderizarCalendario();
}

function renderizarCalendario() {
    const grid = document.getElementById("calendarGrid");
    const mesTitulo = document.getElementById("mesAtual");

    grid.innerHTML = "";

    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();

    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const meses = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho",
        "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    mesTitulo.textContent = `${meses[mes]} ${ano}`;

    for (let i = 0; i < primeiroDia; i++) {
        grid.innerHTML += `<div></div>`;
    }

    for (let dia = 1; dia <= totalDias; dia++) {
        const dataFormatada = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

        const lembretesDoDia = lembretes.filter(l => l.data == dataFormatada);

        let conteudoLembretes = "";

        lembretesDoDia.forEach(l => {
            conteudoLembretes += `<div class="lembrete">
                ${l.hora ? l.hora + " - " : ""}${l.descricao}
                <button onclick="deletarLembrete('${l.id}')" class="btn-del">✖</button>
            </div>`;
        });

        grid.innerHTML += `
            <div class="day">
                <strong>${dia}</strong>
                ${conteudoLembretes}
            </div>
        `;
    }
}

function salvarNotaMes() {
    localStorage.setItem("notasMes", JSON.stringify(notasMensais));
}

function carregarNotasMes() {
    const dados = localStorage.getItem("notasMes");
    notasMensais = dados ? JSON.parse(dados) : {};

}

function chaveMes() {
    return `${dataAtual.getFullYear()}-${dataAtual.getMonth()}`;
}

function atualizarNotaMes() {
    const input = document.getElementById("notasMes");
    const exibicao = document.getElementById("notaMesExibicao");

    if (!input) return;

    const nota = notasMensais[chaveMes()] || "";

    input.value = "";

    if (exibicao) {
        exibicao.innerHTML = nota
            ? `📝 ${nota}`
            : "";
    }
}

function deletarLembrete(id) {
    lembretes = lembretes.filter(l => l.id !== id);
    salvarLembretes();
    renderizarCalendario();
}