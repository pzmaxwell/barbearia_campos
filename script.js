
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      toggle.setAttribute("aria-label", open ? "Abrir menu" : "Fechar menu");
    });
    nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
    }));
  }

  // Coloque aqui o endereço real do Instagram. Enquanto estiver vazio, o link não navega.
  const instagramUrl = "";
  document.querySelectorAll("[data-instagram-link]").forEach(link => {
    if (instagramUrl) link.href = instagramUrl;
    else link.addEventListener("click", event => {
      event.preventDefault();
      alert("Adicione o link oficial do Instagram no arquivo script.js.");
    });
  });

  const profileForm = document.querySelector("#profile-form");
  if (profileForm) {
    const name = document.querySelector("#profile-name");
    const phone = document.querySelector("#profile-phone");
    const email = document.querySelector("#profile-email");
    const message = document.querySelector("#profile-message");
    try {
      const saved = JSON.parse(localStorage.getItem("camposProfile") || "null");
      if (saved) { name.value = saved.name || ""; phone.value = saved.phone || ""; email.value = saved.email || ""; }
    } catch (_) {}
    profileForm.addEventListener("submit", event => {
      event.preventDefault();
      const data = { name: name.value.trim(), phone: phone.value.trim(), email: email.value.trim() };
      try {
        localStorage.setItem("camposProfile", JSON.stringify(data));
        message.textContent = "Dados salvos neste navegador.";
        message.classList.add("success");
      } catch (_) {
        message.textContent = "Não foi possível salvar neste navegador.";
      }
    });
  }
});
