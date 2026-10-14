"use strict";

// 1. Cadastro dos serviços da Barbearia Campos
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

// 2. Localiza os elementos da página
const listaServicos = document.getElementById("service-list");
const totalPreco = document.getElementById("total-price");
const totalDuracao = document.getElementById("total-duration");
const dataInput = document.getElementById("booking-date");
const horarioSelect = document.getElementById("booking-time");
const formulario = document.getElementById("booking-form");
const mensagem = document.getElementById("booking-message");

// 3. Formata valores em reais
function formatarPreco(valor) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

// 4. Cria a lista de serviços na tela
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
        checkbox.value = servico.id;
        checkbox.name = "servicos";

        const texto = document.createElement("span");
        texto.textContent =
          `${servico.nome} — ${servico.minutos} min — ${formatarPreco(servico.preco)}`;

        label.append(checkbox, texto);
        listaServicos.appendChild(label);

        checkbox.addEventListener("change", atualizarResumo);
      });
  });
}

// 5. Descobre quais serviços foram selecionados
function obterSelecionados() {
  const marcados = document.querySelectorAll(
    'input[name="servicos"]:checked'
  );

  return servicos.filter(servico =>
    Array.from(marcados).some(campo => campo.value === servico.id)
  );
}

// 6. Soma os preços e as durações
function atualizarResumo() {
  const selecionados = obterSelecionados();

  const preco = selecionados.reduce(
    (soma, servico) => soma + servico.preco, 0
  );

  const minutos = selecionados.reduce(
    (soma, servico) => soma + servico.minutos, 0
  );

  totalPreco.textContent = formatarPreco(preco);
  totalDuracao.textContent = `${minutos} min`;

  atualizarHorarios();
}

// 7. Define o expediente da barbearia
// 0 = domingo; 1 = segunda; 2 = terça ... 6 = sábado
function obterExpediente(data) {
  const dia = data.getDay();

  if (dia === 1) return [];

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

// 8. Converte minutos em horário HH:MM
function formatarHorario(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

// 9. Calcula horários possíveis (ainda sem reservas reais)
function atualizarHorarios() {
  horarioSelect.replaceChildren();

  const opcaoInicial = document.createElement("option");
  opcaoInicial.value = "";
  opcaoInicial.textContent = "Selecione um horário";
  horarioSelect.appendChild(opcaoInicial);

  if (!dataInput.value) return;

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
    (soma, servico) => soma + servico.minutos, 0
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

// 10. Impede datas passadas
function configurarData() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  dataInput.min = `${ano}-${mes}-${dia}`;
}

dataInput.addEventListener("change", atualizarHorarios);

// 11. Inicializa a página
mostrarServicos();
configurarData();
atualizarResumo();

// Nesta etapa, não gravamos reservas reais.
// Isso será implementado após a conexão segura ao banco de dados.
formulario.addEventListener("submit", event => {
  event.preventDefault();

  mensagem.textContent =
    "A tela está pronta, mas a confirmação real será ativada após conectar a agenda ao banco de dados.";
});
