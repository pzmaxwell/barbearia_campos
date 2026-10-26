document.addEventListener("DOMContentLoaded", () => {
  const WHATSAPP_NUMBER = "5517991601154";
  const services = [
    { id: "corte", group: "Barbearia", name: "Corte", description: "Corte personalizado", duration: 30, price: 35 },
    { id: "barba", group: "Barbearia", name: "Barba", description: "Desenho e acabamento", duration: 30, price: 25 },
    { id: "sobrancelha", group: "Estética", name: "Sobrancelha navalhada", description: "Acabamento preciso", duration: 10, price: 10 },
    { id: "limpeza", group: "Estética", name: "Limpeza de pele", description: "Cuidado e renovação", duration: 20, price: 30 },
    { id: "hidratacao", group: "Estética", name: "Hidratação capilar", description: "Tratamento para os fios", duration: 20, price: 20 },
    { id: "alisamento", group: "Química", name: "Alisamento", description: "Consulte o profissional sobre o procedimento", duration: 60, price: 60 },
    { id: "luzes", group: "Química", name: "Luzes", description: "Transformação de cor", duration: 120, price: 100 },
    { id: "platinado", group: "Química", name: "Platinado", description: "Visual platinado", duration: 60, price: 100 }
  ];

  const selectedServices = new Set();
  let selectedDate = null;
  let selectedTime = null;
  let weekOffset = 0;
  let pendingMessage = "";

  const $ = selector => document.querySelector(selector);
  const money = value => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const totalDuration = () => services.filter(s => selectedServices.has(s.id)).reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = () => services.filter(s => selectedServices.has(s.id)).reduce((sum, s) => sum + s.price, 0);
  const chosen = () => services.filter(s => selectedServices.has(s.id));
  const pad = n => String(n).padStart(2, "0");
  const dateKey = date => `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`;
  const formatDate = date => date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

  const serviceList = $("#service-list");
  let currentGroup = "";
  services.forEach(service => {
    if (service.group !== currentGroup) {
      currentGroup = service.group;
      const heading = document.createElement("h2");
      heading.className = "service-group-title";
      heading.textContent = currentGroup;
      serviceList.appendChild(heading);
      const group = document.createElement("div");
      group.className = "service-choice-grid";
      group.dataset.group = currentGroup;
      serviceList.appendChild(group);
    }
    const group = serviceList.querySelector(`[data-group="${service.group}"]`);
    const label = document.createElement("label");
    label.className = "booking-service-card";
    label.innerHTML = `<input type="checkbox" value="${service.id}" aria-label="Selecionar ${service.name}"><span class="service-check" aria-hidden="true">✓</span><span class="booking-service-copy"><strong>${service.name}</strong><small>${service.description}</small><span class="service-card-duration">${service.duration} min</span></span><strong class="booking-service-price">${money(service.price)}</strong>`;
    const input = label.querySelector("input");
    input.addEventListener("change", () => {
      if (input.checked) selectedServices.add(service.id); else selectedServices.delete(service.id);
      label.classList.toggle("is-selected", input.checked);
      updateTotals();
      renderTimes();
    });
    group.appendChild(label);
  });

  function updateTotals() {
    const count = selectedServices.size;
    $("#selected-count").textContent = count === 0 ? "Nenhum serviço selecionado" : `${count} serviço${count > 1 ? "s" : ""} selecionado${count > 1 ? "s" : ""}`;
    $("#total-duration").textContent = `${totalDuration()} min`;
    $("#total-price").textContent = money(totalPrice());
    $("#to-step-2").disabled = count === 0;
  }

  function showStep(step) {
    document.querySelectorAll(".booking-step").forEach(section => {
      const active = Number(section.dataset.step) === step;
      section.hidden = !active;
      section.classList.toggle("active", active);
    });
    document.querySelectorAll(".progress-segment").forEach((bar, i) => bar.classList.toggle("active", i < Math.min(step, 3)));
    $("#step-counter").textContent = step === 4 ? "CONCLUÍDO" : `ETAPA ${step} DE 3`;
    $(".current-step-label").textContent = step === 1 ? "01 / SERVIÇOS" : step === 2 ? "02 / DATA E HORÁRIO" : step === 3 ? "03 / CONFIRMAÇÃO" : "SOLICITAÇÃO ENVIADA";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $("#to-step-2").addEventListener("click", () => { weekOffset = 0; renderWeek(); showStep(2); });
  $("#back-to-step-1").addEventListener("click", () => showStep(1));
  $("#to-step-3").addEventListener("click", () => { renderReview(); fillCustomerFromProfile(); showStep(3); });
  $("#back-to-step-2").addEventListener("click", () => showStep(2));

  function hoursFor(date) {
    const day = date.getDay(); // 0 domingo, 1 segunda...
    if (day === 1) return [];
    if (day >= 2 && day <= 5) return [[8, 12], [13, 18]];
    if (day === 6) return [[8, 12], [13, 19]];
    return [[8, 12], [13, 16]];
  }

  function isSlotWithinHours(date, time, duration) {
    const [hour, minute] = time.split(":").map(Number);
    const start = hour * 60 + minute;
    const end = start + duration;
    return hoursFor(date).some(([open, close]) => start >= open * 60 && end <= close * 60);
  }

  function renderWeek() {
    const container = $("#week-days");
    container.innerHTML = "";
    const today = todayStart();
    const monday = new Date(today);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day) + weekOffset * 7);
    const end = new Date(monday); end.setDate(end.getDate() + 6);
    $("#calendar-range").textContent = `${monday.toLocaleDateString("pt-BR", {day:"2-digit",month:"short"})} — ${end.toLocaleDateString("pt-BR", {day:"2-digit",month:"short"})}`;
    $("#previous-week").disabled = weekOffset <= 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday); date.setDate(monday.getDate() + i);
      const isPast = date < today;
      const closed = date.getDay() === 1;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "week-day";
      button.disabled = isPast || closed;
      button.setAttribute("aria-label", formatDate(date));
      if (selectedDate && dateKey(date) === dateKey(selectedDate)) button.classList.add("is-selected");
      button.innerHTML = `<span class="week-day-name">${date.toLocaleDateString("pt-BR", {weekday:"short"}).replace(".","")}</span><strong>${pad(date.getDate())}</strong><small>${closed ? "Fechado" : isPast ? "Passou" : date.toLocaleDateString("pt-BR",{month:"short"}).replace(".","")}</small>`;
      if (!isPast && !closed) button.addEventListener("click", () => {
        selectedDate = date; selectedTime = null; renderWeek(); renderTimes();
      });
      container.appendChild(button);
    }
    renderTimes();
  }

  function renderTimes() {
    const container = $("#time-slots");
    container.innerHTML = "";
    $("#to-step-3").disabled = !(selectedDate && selectedTime);
    if (!selectedDate) {
      $("#selected-date-label").textContent = "Nenhum dia selecionado";
      container.innerHTML = '<p class="empty-slots">Escolha um dia para ver os horários.</p>';
      return;
    }
    $("#selected-date-label").textContent = formatDate(selectedDate);
    if (selectedDate.getDay() === 1) {
      container.innerHTML = '<p class="empty-slots">A barbearia não abre às segundas-feiras.</p>'; return;
    }
    const duration = totalDuration();
    const candidates = [];
    for (const [open, close] of hoursFor(selectedDate)) {
      for (let minutes = open * 60; minutes + duration <= close * 60; minutes += 30) {
        const hour = Math.floor(minutes / 60), minute = minutes % 60;
        const time = `${pad(hour)}:${pad(minute)}`;
        if (isSlotWithinHours(selectedDate, time, duration)) candidates.push(time);
      }
    }
    const now = new Date();
    const available = candidates.filter(time => {
      if (dateKey(selectedDate) !== dateKey(now)) return true;
      const [h,m] = time.split(":").map(Number);
      return h * 60 + m > now.getHours() * 60 + now.getMinutes();
    });
    if (!available.length) {
      container.innerHTML = '<p class="empty-slots">Não encontramos horários para essa data e duração. Tente outro dia.</p>'; return;
    }
    available.forEach(time => {
      const button = document.createElement("button");
      button.type = "button"; button.className = "time-slot"; button.textContent = time;
      button.setAttribute("aria-pressed", String(selectedTime === time));
      if (selectedTime === time) button.classList.add("is-selected");
      button.addEventListener("click", () => { selectedTime = time; renderTimes(); });
      container.appendChild(button);
    });
    $("#date-hint").textContent = "Os horários seguem o expediente da barbearia. A disponibilidade real será conectada ao banco de dados.";
  }

  $("#previous-week").addEventListener("click", () => { if (weekOffset > 0) { weekOffset--; renderWeek(); } });
  $("#next-week").addEventListener("click", () => { weekOffset++; renderWeek(); });

  function renderReview() {
    const list = chosen().map(s => `<div class="review-line"><span>${s.name}<small>${s.duration} min</small></span><strong>${money(s.price)}</strong></div>`).join("");
    $("#booking-review").innerHTML = `<div class="review-card"><h2>Seu atendimento</h2>${list}<div class="review-total"><span>${formatDate(selectedDate)} às ${selectedTime}</span><strong>${money(totalPrice())}</strong></div><p>Duração estimada: ${totalDuration()} minutos</p></div>`;
  }

  function fillCustomerFromProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem("camposProfile") || "null");
      if (saved) {
        if (!$("#customer-name").value) $("#customer-name").value = saved.name || "";
        if (!$("#customer-phone").value) $("#customer-phone").value = saved.phone || "";
      }
    } catch (_) {}
  }

  $("#booking-form").addEventListener("submit", event => {
    event.preventDefault();
    if (!selectedDate || !selectedTime || !selectedServices.size) return;
    const name = $("#customer-name").value.trim();
    const phone = $("#customer-phone").value.trim();
    if (!name || !phone || !$("#consent").checked) return;
    const lines = chosen().map(s => `• ${s.name} — ${money(s.price)} (${s.duration} min)`).join("\n");
    pendingMessage = `Olá! Gostaria de solicitar um agendamento na Barbearia Campos.\n\nNome: ${name}\nWhatsApp: ${phone}\nData: ${formatDate(selectedDate)}\nHorário desejado: ${selectedTime}\n\nServiços:\n${lines}\n\nDuração estimada: ${totalDuration()} min\nValor total: ${money(totalPrice())}\n\nPor favor, confirmem se este horário está disponível.`;
    $("#confirmation-summary").innerHTML = `<div class="review-card"><h2>Resumo da solicitação</h2><p><strong>${name}</strong></p><p>${formatDate(selectedDate)} às ${selectedTime}</p><p>${chosen().map(s => s.name).join(", ")}</p><div class="review-total"><span>Total estimado</span><strong>${money(totalPrice())}</strong></div></div>`;
    $("#confirmation-whatsapp").href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(pendingMessage)}`;
    try { localStorage.setItem("camposLastRequest", JSON.stringify({name, phone, date: dateKey(selectedDate), time: selectedTime, services: [...selectedServices], price: totalPrice(), duration: totalDuration()})); } catch (_) {}
    showStep(4);
  });

  updateTotals();
  renderWeek();
});
