"use strict";

const app = document.querySelector("#app");
const root = document.documentElement;

const games = [
  ["reflex", "⚡", "Reflejo relámpago", 7, "Pulsa el círculo cuando se ponga verde.", "Espera sin tocar y pulsa solo al cambiar.", "Si pulsas en rojo o se acaba el tiempo."],
  ["duck", "🦆", "Atrapa al pato", 13, "Atrapa al pato 6 veces.", "Tócalo cada vez que cambie de sitio.", "Si tocas fuera del pato o no llegas a 6."],
  ["math", "➕", "Cuenta flash", 16, "Resuelve la suma o resta.", "Escribe el resultado y compruébalo.", "Si el resultado es incorrecto."],
  ["multiply", "✖️", "Multiplicación exprés", 17, "Resuelve la multiplicación.", "Calcula, escribe el resultado y compruébalo.", "Si el resultado es incorrecto."],
  ["intruder", "🍎", "El intruso", 10, "Encuentra el emoji diferente entre 25.", "Toca el único que no coincide.", "Si tocas uno de los normales."],
  ["memory", "🧠", "Memoria 6", 14, "Recuerda 6 números.", "Míralos y, cuando desaparezcan, escríbelos seguidos.", "Si no repites la secuencia exacta."],
  ["pulse", "🎯", "Pulso perfecto", 9, "Detén el punto en la zona verde.", "Pulsa PARAR cuando el punto esté en verde.", "Si paras fuera de la zona."],
  ["order", "🔢", "Orden exacto", 10, "Pulsa los números del 1 al 7.", "Empieza por el 1 y continúa en orden ascendente.", "Si pulsas un número fuera de orden."],
  ["code", "🔐", "Código fugaz", 11, "Memoriza un código de 5 cifras.", "Míralo, espera que se oculte e introdúcelo.", "Si introduces otro código."],
  ["taps", "👆", "Doble exacto", 9, "Consigue exactamente 15 toques.", "Toca el botón hasta alcanzar el 15.", "Si no llegas a tiempo."],
  ["colorWords", "🎨", "Color tramposo", 10, "Lee el texto, no el color.", "Toca el botón cuyo texto sea el color solicitado.", "Si eliges una palabra distinta."],
  ["targetSum", "🎯", "Suma objetivo", 13, "Encuentra dos números que sumen el objetivo.", "Selecciona exactamente la pareja correcta.", "Si la pareja no suma el objetivo."],
  ["arrow", "🧭", "Flecha tramposa", 10, "Sigue la dirección de la flecha.", "Observa la flecha grande y elige su dirección.", "Si eliges otra dirección."],
  ["sequence", "🧩", "Secuencia rápida", 11, "Repite cinco destellos.", "Observa el orden de casillas y repítelo.", "Si tocas una casilla incorrecta."],
  ["ghost", "👻", "Número fantasma", 10, "Descubre el número que falta entre 12.", "Mira la cuadrícula y toca el número ausente.", "Si eliges un número que sí aparece."],
  ["precision", "🎯", "Toque preciso", 7, "Toca el objetivo móvil.", "Sigue el objetivo y tócalo antes de que escape.", "Si tocas fuera del objetivo."],
  ["pairs", "🐶", "Parejas locas", 13, "Encuentra el emoji diferente entre 9.", "De nueve, hay uno que no pertenece al grupo.", "Si tocas uno del grupo mayoritario."],
  ["compare", "📈", "Mayor o menor", 9, "Compara los dos números.", "Di si el primer número es MAYOR o MENOR.", "Si respondes al revés."],
  ["changeColor", "🔴", "Cambio de color", 9, "Pulsa el color pedido tras el cambio.", "Espera a ¡AHORA! y toca ese color.", "Si eliges un color incorrecto."],
  ["mirror", "🔄", "Palabra espejo", 11, "Descifra la palabra invertida.", "Lee al revés, escribe la palabra correcta y comprueba.", "Si escribes otra palabra."],
].map(([id, emoji, name, time, goal, how, lose]) => ({ id, emoji, name, time, goal, how, lose }));

const state = { token: 0, active: false, ended: false, streak: 0, timers: new Set(), frames: new Set(), controller: null, audio: null };
const failLines = ["Casi… pero el pato ha ganado.", "Ese cerebro necesita vacaciones.", "Demasiado lento, máquina.", "El cronómetro te ha hecho un 1-0.", "Una oportunidad. Un pequeño drama."];
const accents = { reflex:"#ff667a", duck:"#ffd24e", math:"#7d6cff", multiply:"#ff7a52", intruder:"#f05070", memory:"#7866ef", pulse:"#38d6a1", order:"#35bdf4", code:"#a87cf6", taps:"#ff8b5a", colorWords:"#ec5bc4", targetSum:"#46ca9d", arrow:"#42b7ee", sequence:"#6d72ff", ghost:"#9169e8", precision:"#f05d70", pairs:"#ff9a5f", compare:"#4ad39b", changeColor:"#ff5b69", mirror:"#62a7f8" };

const pick = (items) => items[Math.floor(Math.random() * items.length)];
const num = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (items) => { const result = [...items]; for (let i = result.length - 1; i; i--) { const j = num(0, i); [result[i], result[j]] = [result[j], result[i]]; } return result; };
const btn = (label, id = "", cls = "primary") => `<button ${id ? `id="${id}"` : ""} class="btn ${cls}">${label}</button>`;

function clearRound() {
  state.timers.forEach(clearTimeout); state.timers.clear();
  state.frames.forEach(cancelAnimationFrame); state.frames.clear();
  if (state.controller) state.controller.abort();
  state.controller = null; state.active = false;
}
function delay(fn, ms, token = state.token) {
  const timer = setTimeout(() => { state.timers.delete(timer); if (token === state.token && !state.ended) fn(); }, ms);
  state.timers.add(timer); return timer;
}
function frame(fn) {
  const id = requestAnimationFrame((t) => { state.frames.delete(id); if (!state.ended) fn(t); });
  state.frames.add(id); return id;
}
function bind(el, event, fn) { el.addEventListener(event, fn, { signal: state.controller.signal }); }

function audio(type) {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  if (!state.audio) state.audio = new Audio();
  const ctx = state.audio; if (ctx.state === "suspended") ctx.resume();
  const tones = { click:[360,.05,"sine"], tick:[620,.07,"square"], start:[880,.12,"sine"], good:[750,.16,"triangle"], bad:[160,.2,"sawtooth"], urgent:[980,.06,"square"], win:[680,.28,"triangle"], lose:[130,.26,"sawtooth"] };
  const [hz, duration, wave] = tones[type] || tones.click, now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = wave; osc.frequency.setValueAtTime(hz, now);
  if (type === "win") osc.frequency.exponentialRampToValueAtTime(1150, now + duration);
  if (type === "lose") osc.frequency.exponentialRampToValueAtTime(75, now + duration);
  gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(.1, now + .01); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now + duration + .03);
}

function home() {
  clearRound(); state.token++; state.ended = false; state.streak = 0; root.style.setProperty("--accent", "#ffce4a");
  app.innerHTML = `<section class="screen home-screen enter"><div class="floating-die">🧩</div><p class="eyebrow">MINIJUEGO DEL JUEGO DE MESA</p><h1>CONSIGUE<br><span>LA PIEZA</span></h1><p class="home-copy">Supera 3 retos seguidos<br>para ganar tu pieza.</p>${btn("EMPEZAR <b>🚀</b>", "play", "play-button")}<p class="small-note">Retos aleatorios · 5% cada uno</p></section>`;
  document.querySelector("#play").onclick = () => { audio("click"); selectGame(); };
}

// Uniform selection: one indexed slot in a 20-item array, so every challenge is 1/20 = 5%.
function selectGame() { instructions(games[Math.floor(Math.random() * games.length)]); }
function instructions(game) {
  clearRound(); state.token++; state.ended = false; root.style.setProperty("--accent", accents[game.id]);
  const remaining = 3 - state.streak;
  app.innerHTML = `<section class="screen instructions enter"><div class="game-icon">${game.emoji}</div><p class="eyebrow">RETO ALEATORIO</p><p class="remaining-callout">FALTAN <b>${remaining}</b> ${remaining === 1 ? "RETO" : "RETOS"} PARA LA PIEZA</p><h2>${game.name}</h2><div class="instruction-card"><div><span>🎯 OBJETIVO</span><p>${game.goal}</p></div><div><span>👆 CÓMO SE JUEGA</span><p>${game.how}</p></div><div><span>💥 PIERDES SI…</span><p>${game.lose}</p></div><div class="instruction-time"><span>⏱️ TIEMPO</span><strong>${game.time} segundos</strong></div></div><p class="one-chance">⚠️ Solo tienes una oportunidad</p>${btn("ESTOY LISTO <b>🚀</b>", "ready")}</section>`;
  document.querySelector("#ready").onclick = () => { audio("click"); countdown(game); };
}
function countdown(game) {
  clearRound(); const token = ++state.token; state.ended = false;
  app.innerHTML = `<section class="screen countdown-screen"><div id="count" class="countdown-number"></div><p>Prepárate…</p></section>`;
  const values = ["3", "2", "1", "¡YA!"]; let i = 0;
  const next = () => { if (i === values.length) return start(game); const el = document.querySelector("#count"); el.textContent = values[i]; el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); audio(i === 3 ? "start" : "tick"); i++; delay(next, 700, token); };
  next();
}
function start(game) {
  clearRound(); const token = ++state.token; state.active = true; state.ended = false; state.controller = new AbortController();
  const remaining = 3 - state.streak;
  app.innerHTML = `<section class="play-screen enter"><header class="play-header"><div class="challenge-label"><span>${game.emoji}</span><strong>${game.name}</strong><span class="streak">FALTAN ${remaining}</span></div><div class="timer-row"><span id="clock">⏱️ ${game.time.toFixed(1)} s</span><span class="chance">1 OPORTUNIDAD</span></div><div class="time-track"><i id="bar"></i></div></header><section class="game-area" id="area"></section></section>`;
  timer(game.time, token); mount(game.id, document.querySelector("#area"));
}
function timer(total, token) {
  const startAt = performance.now(); let beeped = false;
  const tick = (now) => { if (token !== state.token || state.ended) return; const remain = Math.max(0, total - (now - startAt) / 1000), ratio = remain / total, clock = document.querySelector("#clock"), bar = document.querySelector("#bar");
    clock.textContent = `⏱️ ${remain.toFixed(1)} s`; clock.classList.toggle("urgent", ratio < .25); bar.style.width = `${ratio * 100}%`; bar.dataset.level = ratio > .5 ? "safe" : ratio > .25 ? "warning" : "danger";
    if (ratio < .25 && !beeped) { beeped = true; audio("urgent"); } if (!remain) return result(false, "Se acabó el tiempo."); frame(tick); };
  frame(tick);
}
function result(win, text) {
  if (state.ended || !state.active) return; state.ended = true; clearRound(); audio(win ? "win" : "lose");
  if (win) state.streak += 1;
  const wonPiece = win && state.streak === 3;
  const heading = wonPiece ? "¡CONSEGUISTE LA PIEZA!" : win ? "¡RETO SUPERADO!" : "A LA PRÓXIMA";
  const remaining = 3 - state.streak;
  const eyebrow = wonPiece ? "¡RACHA COMPLETA!" : win ? `TE FALTAN ${remaining} ${remaining === 1 ? "RETO" : "RETOS"}` : "LA RACHA VUELVE A CERO";
  const detail = wonPiece ? "Has superado 3 retos seguidos. Esta pieza es tuya." : win ? (text || "¡Muy buena jugada!") : (text || pick(failLines));
  const label = wonPiece ? "SIGUIENTE <b>➡️</b>" : win ? "CONTINUAR <b>➡️</b>" : "EMPEZAR DE NUEVO <b>🚀</b>";
  app.innerHTML = `<section class="screen result-screen ${win ? "win" : "loss"} enter"><div class="result-burst">${wonPiece ? "🧩" : win ? "🎉" : "💥"}</div><p class="eyebrow">${eyebrow}</p><h2>${heading}</h2><p class="result-copy">${detail}</p><div class="confetti" aria-hidden="true">✦ ✦ ✦</div>${btn(label, "again")}</section>`;
  document.querySelector("#again").onclick = () => { audio("click"); if (wonPiece) return home(); if (!win) state.streak = 0; selectGame(); };
}

function pos(field, size = 78) { return { left: `${num(12, Math.max(12, field.clientWidth - size - 12))}px`, top: `${num(58, Math.max(58, field.clientHeight - size - 12))}px` }; }
function numericForm(area, question, answer, success) {
  area.innerHTML = `<div class="question-card"><p class="game-kicker">CALCULA Y DECIDE</p><div class="math-question">${question}</div><form><label class="sr-only" for="answer">Respuesta</label><input id="answer" inputmode="numeric" autocomplete="off" placeholder="Tu respuesta" required>${btn("COMPROBAR", "", "primary")}</form></div>`;
  const input = area.querySelector("input"); bind(area.querySelector("form"), "submit", e => { e.preventDefault(); audio("click"); Number(input.value.trim()) === answer ? result(true, success) : result(false, "Ese resultado no era."); }); delay(() => input.focus(), 80);
}

function mount(id, area) {
  const play = {
    reflex() {
      area.innerHTML = `<div class="reflex-wrap"><p id="rtext">No lo pulses todavía…</p><button id="dot" class="reflex-dot waiting" aria-label="Círculo de reflejo"></button></div>`; let green = false;
      bind(area.querySelector("#dot"), "click", () => green ? result(true, "¡Reflejos de campeonato!") : result(false, "¡Demasiado pronto!"));
      delay(() => { green = true; area.querySelector("#dot").classList.replace("waiting", "go"); area.querySelector("#rtext").textContent = "¡AHORA!"; audio("start"); }, num(1800, 4100));
    },
    duck() {
      area.innerHTML = `<div class="catch-field" id="field"><p class="catch-count">PATOS: <b id="score">0</b> / 6</p><button class="moving-duck" id="duck" aria-label="Pato">🦆</button></div>`; const field = area.querySelector("#field"), duck = area.querySelector("#duck"); let count = 0, move = () => Object.assign(duck.style, pos(field)); move();
      bind(field, "click", e => { if (e.target !== duck) result(false, "El pato se ha reído de ese toque."); }); bind(duck, "click", e => { e.stopPropagation(); audio("click"); count++; area.querySelector("#score").textContent = count; count === 6 ? result(true, "¡Seis patos atrapados!") : move(); });
    },
    math() { const a = num(8, 31), add = Math.random() > .4, b = num(add ? 7 : 3, add ? 28 : a - 1); numericForm(area, `${a} ${add ? "+" : "−"} ${b} = ?`, add ? a + b : a - b, "Cálculo perfecto."); },
    multiply() { const a = num(5, 11), b = num(5, 11); numericForm(area, `${a} × ${b} = ?`, a * b, "Multiplicación perfecta."); },
    intruder() {
      const [normal, odd] = pick([["🍎", "🍐"], ["🌻", "🌼"], ["🐸", "🦎"], ["🍪", "🥨"], ["⚽", "🏀"]]), special = num(0, 24);
      area.innerHTML = `<p class="game-kicker">TOCA EL DISTINTO</p><div class="emoji-grid hard-grid">${Array.from({length:25}, (_, i) => `<button class="emoji-tile" data-special="${i === special}">${i === special ? odd : normal}</button>`).join("")}</div>`;
      bind(area, "click", e => { const tile = e.target.closest(".emoji-tile"); if (tile) tile.dataset.special === "true" ? result(true, "¡Ojo de águila!") : result(false, "Ese no era el intruso."); });
    },
    memory() {
      const sequence = Array.from({length:6}, () => num(1,9)).join(""); area.innerHTML = `<div class="memory-card"><p class="game-kicker">MEMORIZA</p><div id="code" class="memory-code">${sequence.split("").join(" ")}</div><p id="tip">Tienes 2,7 segundos para mirar.</p><form class="hidden-form"><input inputmode="numeric" maxlength="6" placeholder="Escribe los 6 números" autocomplete="off" required>${btn("COMPROBAR")}</form></div>`;
      const form = area.querySelector("form"), input = form.querySelector("input"); delay(() => { area.querySelector("#code").textContent = "? ? ? ? ? ?"; area.querySelector("#tip").textContent = "Ahora escríbela exactamente."; form.classList.remove("hidden-form"); input.focus(); }, 2700); bind(form, "submit", e => { e.preventDefault(); input.value.trim() === sequence ? result(true, "Memoria impecable.") : result(false, "La secuencia era otra."); });
    },
    pulse() {
      const left = num(32,52), width = num(12,16); let p = 0, last = performance.now(); area.innerHTML = `<div class="pulse-card"><p class="game-kicker">DETÉNLO EN VERDE</p><div class="pulse-track"><i class="pulse-zone" style="left:${left}%;width:${width}%"></i><i id="marker" class="pulse-marker"></i></div>${btn("PARAR", "stop")}</div>`;
      const loop = now => { p = (p + (now-last)*.00125) % 2; last = now; const x = p <= 1 ? p : 2-p; area.querySelector("#marker").style.left = `${x*100}%`; frame(loop); }; frame(loop); bind(area.querySelector("#stop"), "click", () => { const x = (p <= 1 ? p : 2-p)*100; x >= left && x <= left+width ? result(true, "¡Pulso milimétrico!") : result(false, "Se escapó de la zona verde."); });
    },
    order() {
      let needed = 1; area.innerHTML = `<p class="game-kicker">SIGUIENTE: <b id="needed">1</b></p><div class="number-grid">${shuffle([1,2,3,4,5,6,7]).map(n => `<button class="number-tile" data-n="${n}">${n}</button>`).join("")}</div>`;
      bind(area, "click", e => { const tile = e.target.closest(".number-tile"); if (!tile || tile.disabled) return; if (+tile.dataset.n !== needed) return result(false, "Ese número no tocaba todavía."); audio("click"); tile.disabled = true; needed++; if (needed === 8) result(true, "Orden perfecto."); else area.querySelector("#needed").textContent = needed; });
    },
    code() {
      const code = String(num(10000,99999)); area.innerHTML = `<div class="memory-card"><p class="game-kicker">MEMORIZA EL CÓDIGO</p><div id="code" class="memory-code">${code}</div><p id="tip">Desaparece en 2,2 segundos.</p><form class="hidden-form"><input inputmode="numeric" maxlength="5" placeholder="Código de 5 cifras" autocomplete="off" required>${btn("ABRIR")}</form></div>`;
      const form = area.querySelector("form"), input = form.querySelector("input"); delay(() => { area.querySelector("#code").textContent = "•••••"; area.querySelector("#tip").textContent = "¿Lo recuerdas?"; form.classList.remove("hidden-form"); input.focus(); }, 2200); bind(form,"submit",e=>{e.preventDefault(); input.value.trim() === code ? result(true,"Código desbloqueado.") : result(false,"Código denegado.");});
    },
    taps() {
      let count=0; area.innerHTML = `<div class="taps-card"><p>TOQUES: <b id="count">0</b> / 15</p><button id="tap" class="tap-button">¡TOCA!</button><small>Llega a 15 antes de que termine el tiempo.</small></div>`; bind(area.querySelector("#tap"),"click",()=>{audio("click"); count++; area.querySelector("#count").textContent=count; if(count===15)result(true,"¡Quince exactos!"); else if(count>15)result(false,"Te has pasado.");});
    },
    colorWords() {
      const names=["ROJO","AZUL","VERDE","AMARILLO","MORADO"], target=pick(names), colors=shuffle(["#f25264","#438ce9","#45b883","#f0bf41","#8c62cf"]); area.innerHTML = `<div class="word-game"><p class="game-kicker">PULSA EL TEXTO QUE DIGA</p><div class="word-target">${target}</div><div class="color-word-grid">${shuffle(names).map((n,i)=>`<button class="color-word" data-name="${n}" style="background:${colors[i]}">${n}</button>`).join("")}</div></div>`;
      bind(area,"click",e=>{const choice=e.target.closest(".color-word");if(choice)choice.dataset.name===target?result(true,"Leíste, no caíste en la trampa."):result(false,"El color te ha engañado.");});
    },
    targetSum() {
      const a=num(4,15), b=num(5,16), target=a+b, extras=[]; while(extras.length<5){const n=num(1,19);if(n!==a&&n!==b&&n+a!==target&&n+b!==target&&extras.every(x=>x+n!==target))extras.push(n);} let chosen=[];
      area.innerHTML = `<div class="sum-game"><p class="game-kicker">ENCUENTRA DOS NÚMEROS QUE SUMEN</p><div class="sum-target">${target}</div><div class="sum-options">${shuffle([a,b,...extras]).map(n=>`<button class="sum-option" data-n="${n}">${n}</button>`).join("")}</div><p class="selection-tip">Elige 2 números</p></div>`;
      bind(area,"click",e=>{const choice=e.target.closest(".sum-option");if(!choice||choice.disabled)return;choice.disabled=true;choice.classList.add("selected");chosen.push(+choice.dataset.n);audio("click");if(chosen.length===2)chosen[0]+chosen[1]===target?result(true,"¡Suma objetivo conseguida!"):result(false,"Esa pareja no llegaba al objetivo.");});
    },
    arrow() {
      const all=[{id:"up",i:"↑",n:"ARRIBA"},{id:"right",i:"→",n:"DERECHA"},{id:"down",i:"↓",n:"ABAJO"},{id:"left",i:"←",n:"IZQUIERDA"}], target=pick(all); area.innerHTML=`<div class="arrow-game"><p class="game-kicker">¿HACIA DÓNDE APUNTA?</p><div class="giant-arrow">${target.i}</div><div class="direction-grid">${shuffle(all).map(d=>`<button class="direction-button" data-d="${d.id}"><span>${d.i}</span>${d.n}</button>`).join("")}</div></div>`;
      bind(area,"click",e=>{const choice=e.target.closest(".direction-button");if(choice)choice.dataset.d===target.id?result(true,"Dirección correcta."):result(false,"La brújula apunta a otro lado.");});
    },
    sequence() {
      const seq=Array.from({length:5},()=>num(0,8));let index=0,ready=false;area.innerHTML=`<div class="sequence-game"><p id="seq-tip" class="game-kicker">OBSERVA LOS DESTELLOS</p><div class="sequence-grid">${Array.from({length:9},(_,i)=>`<button class="sequence-tile" data-i="${i}" disabled aria-label="Casilla ${i+1}"></button>`).join("")}</div></div>`;const tiles=[...area.querySelectorAll(".sequence-tile")];
      const flash=i=>{if(i===seq.length){ready=true;area.querySelector("#seq-tip").textContent="AHORA REPÍTELA";tiles.forEach(t=>t.disabled=false);return;}const tile=tiles[seq[i]];tile.classList.add("lit");audio("tick");delay(()=>{tile.classList.remove("lit");delay(()=>flash(i+1),140);},520);};delay(()=>flash(0),450);
      bind(area,"click",e=>{const tile=e.target.closest(".sequence-tile");if(!tile||!ready)return;if(+tile.dataset.i!==seq[index])return result(false,"Ese no era el siguiente destello.");audio("click");tile.classList.add("chosen");delay(()=>tile.classList.remove("chosen"),150);if(++index===seq.length)result(true,"Secuencia clonada.");});
    },
    ghost() {
      const missing=num(1,12), shown=shuffle(Array.from({length:12},(_,i)=>i+1).filter(n=>n!==missing));area.innerHTML=`<div class="ghost-game"><p class="game-kicker">¿QUÉ NÚMERO FALTA?</p><div class="ghost-grid ghost-grid-hard">${shown.map(n=>`<span>${n}</span>`).join("")}</div><div class="ghost-options">${shuffle(Array.from({length:12},(_,i)=>i+1)).map(n=>`<button class="ghost-choice" data-n="${n}">${n}</button>`).join("")}</div></div>`;
      bind(area,"click",e=>{const choice=e.target.closest(".ghost-choice");if(choice)+choice.dataset.n===missing?result(true,"El fantasma no pudo esconderse."):result(false,"Ese número sí estaba en la cuadrícula.");});
    },
    precision() {
      area.innerHTML=`<div id="field" class="catch-field precision-field"><p>TOCA EL OBJETIVO</p><button id="target" class="precision-target" aria-label="Objetivo"></button></div>`;const field=area.querySelector("#field"),target=area.querySelector("#target"),move=()=>Object.assign(target.style,pos(field,64));move();const relocate=()=>{move();delay(relocate,800);};delay(relocate,800);
      bind(field,"click",e=>{if(e.target!==target)result(false,"Ese toque no dio en el blanco.");});bind(target,"click",e=>{e.stopPropagation();result(true,"¡Objetivo acertado!");});
    },
    pairs() {
      const [normal,odd]=pick([["🐶","🐱"],["🍓","🍋"],["🚗","🛵"],["🌙","⭐"]]),special=num(0,8);area.innerHTML=`<p class="game-kicker">ENCUENTRA LA PAREJA LOCA</p><div class="pairs-grid">${Array.from({length:9},(_,i)=>`<button class="pair-tile" data-special="${i===special}">${i===special?odd:normal}</button>`).join("")}</div>`;
      bind(area,"click",e=>{const choice=e.target.closest(".pair-tile");if(choice)choice.dataset.special==="true"?result(true,"¡Encontraste al rebelde!"):result(false,"Ese sí pertenecía al grupo.");});
    },
    compare() {
      const first=num(24,88),difference=num(1,9)*(Math.random()>.5?1:-1),second=Math.max(5,Math.min(99,first+difference)),answer=first>second?"MAYOR":"MENOR";area.innerHTML=`<div class="compare-game"><p class="game-kicker">¿EL PRIMERO ES MAYOR O MENOR?</p><div class="compare-numbers"><b>${first}</b><span>vs</span><b>${second}</b></div><div class="compare-buttons"><button class="compare-button" data-a="MAYOR">MAYOR</button><button class="compare-button" data-a="MENOR">MENOR</button></div></div>`;
      bind(area,"click",e=>{const choice=e.target.closest(".compare-button");if(choice)choice.dataset.a===answer?result(true,"Comparación resuelta."):result(false,"Los números no estaban de acuerdo.");});
    },
    changeColor() {
      const colors=[{n:"ROJO",h:"#ef5261"},{n:"AZUL",h:"#3d8ded"},{n:"VERDE",h:"#38bf80"},{n:"AMARILLO",h:"#f5bd42"},{n:"MORADO",h:"#8c62cf"}],target=pick(colors);let ready=false;const render=items=>items.map(c=>`<button class="change-color" data-n="${c.n}" style="--button-color:${c.h}" ${ready?"":"disabled"}>${c.n}</button>`).join("");area.innerHTML=`<div class="change-game"><p class="game-kicker">PREPÁRATE PARA PULSAR</p><div class="color-command">${target.n}</div><p id="change-msg">Mira bien las posiciones…</p><div id="change-grid" class="change-grid">${render(colors)}</div></div>`;
      delay(()=>{ready=true;area.querySelector("#change-grid").innerHTML=render(shuffle(colors));const msg=area.querySelector("#change-msg");msg.textContent="¡AHORA!";msg.classList.add("now");audio("start");},1200);bind(area,"click",e=>{const choice=e.target.closest(".change-color");if(choice&&ready)choice.dataset.n===target.n?result(true,"Cambio de color dominado."):result(false,"Ese no era el color pedido.");});
    },
    mirror() {
      const word=pick(["CASA","LUNA","NUBE","RANA","FUEGO","LIBRO","QUESO","PAPEL","VIENTO","MONEDA"]),reversed=[...word].reverse().join("");area.innerHTML=`<div class="mirror-game"><p class="game-kicker">LEE LA PALABRA AL REVÉS</p><div class="mirror-word">${reversed}</div><form><input autocapitalize="characters" autocomplete="off" placeholder="Palabra correcta" required>${btn("COMPROBAR")}</form></div>`;const form=area.querySelector("form"),input=form.querySelector("input");bind(form,"submit",e=>{e.preventDefault();input.value.trim().toUpperCase()===word?result(true,"Espejo descifrado."):result(false,"La palabra no era esa.");});delay(()=>input.focus(),80);
    },
  };
  play[id]();
}

home();
