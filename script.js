
"use strict";

// MENU PARA CELULAR

const menuToggle = document.getElementById("menu-toggle");
const menu = document.getElementById("menu");

if (menuToggle && menu) {
    menuToggle.addEventListener("click", function () {
        const aberto = menu.classList.toggle("open");

        menuToggle.setAttribute("aria-expanded", String(aberto));

        menuToggle.setAttribute(
            "aria-label",
            aberto ? "Fechar menu" : "Abrir menu"
        );

        menuToggle.textContent = aberto ? "×" : "☰";
    });

    // Fecha o menu após clicar em uma opção
    menu.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            menu.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Abrir menu");
            menuToggle.textContent = "☰";
        });
    });

    // Fecha o menu se a tela mudar para o tamanho de computador
    window.addEventListener("resize", function () {
        if (window.innerWidth > 760) {
            menu.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
            menuToggle.setAttribute("aria-label", "Abrir menu");
            menuToggle.textContent = "☰";
        }
    });
}

// ATUALIZA O ANO AUTOMATICAMENTE

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
