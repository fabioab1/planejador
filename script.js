let tarefas = [];

document.addEventListener("DOMContentLoaded", () => {
    carregarTarefas();

    if (document.querySelector(".kanban") && document.querySelector("#entrada")) {
        renderizarTarefas();
    }

    if (document.querySelector("#lista-concluidas")) {
        renderizarConcluidas();
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
                    hojeDiv.innerHTML += `<div>${t.descricao}</div>`;
                } else if (filtroSemana(t.data)) {
                    semanaDiv.innerHTML += `<div>${t.descricao}</div>`;
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