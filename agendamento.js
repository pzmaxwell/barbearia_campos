
"use strict";

// Número do WhatsApp já utilizado no site.
// Formato: código do país + DDD + número, sem espaços.
const WHATSAPP_BARBEARIA = "5517991601154";

// SERVIÇOS E VALORES
const servicos = [
    { id: "corte", nome: "Corte", categoria: "Barbearia", preco: 35, minutos: 30 },
    { id: "barba", nome: "Barba", categoria: "Barbearia", preco: 25, minutos: 30 },

    { id: "sobrancelha", nome: "Sobrancelha navalhada", categoria: "Estética", preco: 10, minutos: 10 },
    { id: "pele", nome: "Limpeza de pele", categoria: "Estética", preco: 30, minutos: 20 },
    { id: "hidratacao", nome: "Hidratação capilar", categoria: "Estética", preco: 20, minutos: 20 },

    { id: "alisamento", nome: "Alisamento", categoria: "Química", preco: 60, minutos: 60 },
    { id: "luzes", nome: "Luzes", categoria: "Química", preco: 100, minutos: 120 },
    { id: "platinado", nome: "Platinado", categoria: "Química", preco: 100, minutos: 60 }
];

// ELEMENTOS DA PÁGINA
const listaServicos = document.getElementById("service-list");
const totalPreco = document.getElementById("total-price");
const totalDuracao = document.getElementById("total-duration");
const dataInput = document.getElementById("booking-date");
const horarioSelect = document.getElementById("booking-time");
const formulario = document.getElementById("booking-form");
const mensagem = document.getElementById("booking-message");
const yearElement = document.getElementById("year");

// FORMATAÇÃO
function formatarPreco(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatarHorario(minutos) {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

function obterSelecionados() {
    const marcados = document.querySelectorAll(
        'input[name="servicos"]:checked'
    );

    return servicos.filter(servico =>
        Array.from(marcados).some(campo => campo.value === servico.id)
    );
}

// CRIA A LISTA DE SERVIÇOS
function mostrarServicos() {
    const categorias = ["Barbearia", "Estética", "Química"];

    categorias.forEach(categoria => {
        const titulo = document.createElement("h3");
        titulo.textContent = categoria;
        listaServicos.appendChild(titulo);

        servicos
            .filter(servico => servico.categoria === categoria)
            .forEach(servico => {
                const label = document.createElement("label");
                label.className = "service-option";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.name = "servicos";
                checkbox.value = servico.id;

                const texto = document.createElement("span");
                texto.textContent =
                    `${servico.nome} — ${servico.minutos} min — ${formatarPreco(servico.preco)}`;

                label.append(checkbox, texto);
                listaServicos.appendChild(label);

                checkbox.addEventListener("change", atualizarResumo);
            });
    });
}

// ATUALIZA PREÇO, DURAÇÃO E HORÁRIOS
function atualizarResumo() {
    const selecionados = obterSelecionados();

    const preco = selecionados.reduce(
        (soma, servico) => soma + servico.preco,
        0
    );

    const minutos = selecionados.reduce(
        (soma, servico) => soma + servico.minutos,
        0
    );

    totalPreco.textContent = formatarPreco(preco);
    totalDuracao.textContent = `${minutos} min`;

    atualizarHorarios();
}

// EXPEDIENTE DA BARBEARIA
// Domingo = 0; segunda = 1; terça = 2 ... sábado = 6.
function obterExpediente(data) {
    const dia = data.getDay();

    if (dia === 1) {
        return [];
    }

    if (dia >= 2 && dia <= 5) {
        return [
            { inicio: 8 * 60, fim: 12 * 60 },
            { inicio: 13 * 60 + 30, fim: 18 * 60 }
        ];
    }

    if (dia === 6) {
        return [
            { inicio: 8 * 60, fim: 12 * 60 },
            { inicio: 13 * 60 + 30, fim: 19 * 60 }
        ];
    }

    return [
        { inicio: 8 * 60, fim: 12 * 60 },
        { inicio: 13 * 60 + 30, fim: 16 * 60 }
    ];
}

// GERA OS HORÁRIOS POSSÍVEIS.
// Ainda não verifica reservas existentes.
function atualizarHorarios() {
    horarioSelect.replaceChildren();

    const opcaoInicial = document.createElement("option");
    opcaoInicial.value = "";
    opcaoInicial.textContent = "Selecione um horário";
    horarioSelect.appendChild(opcaoInicial);

    if (!dataInput.value) {
        opcaoInicial.textContent = "Selecione a data";
        return;
    }

    const selecionados = obterSelecionados();

    if (selecionados.length === 0) {
        opcaoInicial.textContent = "Selecione primeiro os serviços";
        return;
    }

    const [ano, mes, dia] = dataInput.value.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia);
    const expediente = obterExpediente(data);

    if (expediente.length === 0) {
        opcaoInicial.textContent = "Fechado neste dia";
        return;
    }

    const duracao = selecionados.reduce(
        (soma, servico) => soma + servico.minutos,
        0
    );

    const agora = new Date();
    const hoje =
        ano === agora.getFullYear() &&
        mes === agora.getMonth() + 1 &&
        dia === agora.getDate();

    expediente.forEach(periodo => {
        for (
            let inicio = periodo.inicio;
            inicio + duracao <= periodo.fim;
            inicio += 10
        ) {
            if (hoje && inicio <= agora.getHours() * 60 + agora.getMinutes()) {
                continue;
            }

            const opcao = document.createElement("option");
            opcao.value = formatarHorario(inicio);
            opcao.textContent =
                `${formatarHorario(inicio)} — término ${formatarHorario(inicio + duracao)}`;

            horarioSelect.appendChild(opcao);
        }
    });

    if (horarioSelect.options.length === 1) {
        opcaoInicial.textContent = "Não há horários para esta seleção";
    }
}

// IMPEDE A ESCOLHA DE DATAS PASSADAS
function configurarData() {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const dia = String(agora.getDate()).padStart(2, "0");

    dataInput.min = `${ano}-${mes}-${dia}`;
}

// PREPARA A SOLICITAÇÃO PARA O WHATSAPP.
// Não grava nem confirma a reserva.
formulario.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!formulario.reportValidity()) {
        return;
    }

    const selecionados = obterSelecionados();

    if (selecionados.length === 0) {
        mensagem.textContent = "Selecione pelo menos um serviço.";
        return;
    }

    if (!dataInput.value || !horarioSelect.value) {
        mensagem.textContent = "Selecione uma data e um horário.";
        return;
    }

    const nome = document.getElementById("customer-name").value.trim();
    const telefone = document.getElementById("customer-phone").value.trim();

    if (!nome || !telefone) {
        mensagem.textContent = "Preencha seu nome e WhatsApp.";
        return;
    }

    const [ano, mes, dia] = dataInput.value.split("-");
    const dataFormatada = `${dia}/${mes}/${ano}`;

    const preco = selecionados.reduce(
        (soma, servico) => soma + servico.preco,
        0
    );

    const duracao = selecionados.reduce(
        (soma, servico) => soma + servico.minutos,
        0
    );

    const lista = selecionados
        .map(servico => `- ${servico.nome} (${servico.minutos} min)`)
        .join("\n");

    const texto = [
        "Olá! Gostaria de solicitar um horário na Barbearia Campos.",
        "",
        `Nome: ${nome}`,
        `Meu WhatsApp: ${telefone}`,
        `Data pretendida: ${dataFormatada}`,
        `Horário pretendido: ${horarioSelect.value}`,
        "",
        "Serviços:",
        lista,
        "",
        `Duração estimada: ${duracao} minutos`,
        `Valor estimado: ${formatarPreco(preco)}`,
        "",
        "Aguardo a confirmação da disponibilidade."
    ].join("\n");

    const url = `https://wa.me/${WHATSAPP_BARBEARIA}?text=${encodeURIComponent(texto)}`;

    mensagem.replaceChildren();

    const aviso = document.createElement("span");
    aviso.textContent =
        "O WhatsApp será aberto com sua solicitação. Envie a mensagem e aguarde a confirmação da barbearia. Seu horário ainda não está reservado.";

    mensagem.appendChild(aviso);
    mensagem.appendChild(document.createElement("br"));

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Abrir WhatsApp e enviar solicitação";

    mensagem.appendChild(link);

    window.open(url, "_blank", "noopener,noreferrer");
});

// INICIALIZAÇÃO
dataInput.addEventListener("change", atualizarResumo);

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

mostrarServicos();
configurarData();
atualizarResumo();
