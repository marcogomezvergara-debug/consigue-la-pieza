"use strict";

// Modo más difícil: menos tiempo y retos visuales más densos.
const hardTimes = {
  reflex: 5.5,
  duck: 8,
  math: 11,
  multiply: 12,
  intruder: 7,
  memory: 10,
  pulse: 6.5,
  order: 7,
  code: 8,
  taps: 6.5,
  colorWords: 7,
  targetSum: 9,
  arrow: 6.5,
  sequence: 8.5,
  ghost: 7,
  precision: 5.5,
  pairs: 8,
  compare: 6,
  changeColor: 6.5,
  mirror: 8
};

games.forEach(game => {
  if (hardTimes[game.id] != null) game.time = hardTimes[game.id];
});

const updateGameText = (id, goal, how, lose) => {
  const game = games.find(g => g.id === id);
  if (!game) return;
  if (goal) game.goal = goal;
  if (how) game.how = how;
  if (lose) game.lose = lose;
};

updateGameText("duck", "Atrapa al pato 12 veces.", "Es más pequeño y cambia de sitio en cada toque.", "Si tocas fuera del pato o no llegas a 12.");
updateGameText("intruder", "Encuentra el emoji diferente entre 49.", "Hay muchos más emojis y son más pequeños.", "Si tocas uno de los normales.");
updateGameText("pairs", "Encuentra el emoji diferente entre 25.", "Busca al único distinto entre una cuadrícula mucho más llena.", "Si tocas uno del grupo mayoritario.");

const normalMount = mount;
mount = function hardMount(id, area) {
  if (id === "duck") {
    const target = 12;
    area.innerHTML = `<div class="catch-field" id="field"><p class="catch-count">PATOS: <b id="score">0</b> / ${target}</p><button class="moving-duck" id="duck" aria-label="Pato" style="width:48px;height:48px;font-size:24px;padding:0">🦆</button></div>`;
    const field = area.querySelector("#field"), duck = area.querySelector("#duck");
    let count = 0;
    const move = () => Object.assign(duck.style, pos(field, 48));
    move();
    bind(field, "click", e => { if (e.target !== duck) result(false, "El pato se ha reído de ese toque."); });
    bind(duck, "click", e => {
      e.stopPropagation(); audio("click"); count++;
      area.querySelector("#score").textContent = count;
      count === target ? result(true, "¡Doce patos atrapados!") : move();
    });
    return;
  }

  if (id === "intruder") {
    const total = 49;
    const [normal, odd] = pick([
      ["🍎", "🍐"], ["🌻", "🌼"], ["🐸", "🦎"], ["🍪", "🥨"], ["⚽", "🏀"],
      ["🐱", "🐯"], ["🍋", "🍊"], ["⭐", "🌟"], ["🚗", "🚕"], ["🐟", "🐠"]
    ]);
    const special = num(0, total - 1);
    area.innerHTML = `<p class="game-kicker">TOCA EL DISTINTO</p><div class="emoji-grid hard-grid" style="grid-template-columns:repeat(7,minmax(0,1fr));gap:4px">${Array.from({length:total}, (_, i) => `<button class="emoji-tile" data-special="${i === special}" style="font-size:20px;min-width:0;min-height:36px;padding:2px">${i === special ? odd : normal}</button>`).join("")}</div>`;
    bind(area, "click", e => {
      const tile = e.target.closest(".emoji-tile");
      if (tile) tile.dataset.special === "true" ? result(true, "¡Ojo de águila!") : result(false, "Ese no era el intruso.");
    });
    return;
  }

  if (id === "pairs") {
    const total = 25;
    const [normal, odd] = pick([
      ["🐶","🐱"], ["🍓","🍋"], ["🚗","🛵"], ["🌙","⭐"], ["🐙","🦑"], ["🍕","🍔"], ["🐸","🐢"]
    ]);
    const special = num(0, total - 1);
    area.innerHTML = `<p class="game-kicker">ENCUENTRA AL REBELDE</p><div class="pairs-grid" style="grid-template-columns:repeat(5,minmax(0,1fr));gap:5px">${Array.from({length:total}, (_, i) => `<button class="pair-tile" data-special="${i === special}" style="font-size:22px;min-width:0;min-height:42px;padding:3px">${i === special ? odd : normal}</button>`).join("")}</div>`;
    bind(area, "click", e => {
      const choice = e.target.closest(".pair-tile");
      if (choice) choice.dataset.special === "true" ? result(true, "¡Encontraste al rebelde!") : result(false, "Ese sí pertenecía al grupo.");
    });
    return;
  }

  normalMount(id, area);
};
