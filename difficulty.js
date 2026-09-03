"use strict";

// Carga la versión base desde el commit anterior y la convierte en la versión difícil.
fetch("https://raw.githubusercontent.com/marcogomezvergara-debug/consigue-la-pieza/fb8fafd5174a323b9cb0dc7cd753db1ea24e0213/game.js")
  .then(r => r.text())
  .then(base => {
    const hardPatch = `
      // ===== MODO DIFÍCIL =====
      const hardTimes = { reflex:5.5, duck:8, math:11, multiply:12, intruder:7, memory:10, pulse:6.5, order:7, code:8, taps:6.5, colorWords:7, targetSum:9, arrow:6.5, sequence:8.5, ghost:7, precision:5.5, pairs:8, compare:6, changeColor:6.5, mirror:8 };
      games.forEach(g => { if (hardTimes[g.id] != null) g.time = hardTimes[g.id]; });
      const setText = (id, goal, how, lose) => { const g = games.find(x => x.id === id); if (!g) return; g.goal=goal; g.how=how; g.lose=lose; };
      setText("duck", "Atrapa al pato 12 veces.", "Es más pequeño y cambia de sitio en cada toque.", "Si tocas fuera del pato o no llegas a 12.");
      setText("intruder", "Encuentra el emoji diferente entre 49.", "Hay muchos más emojis y son más pequeños.", "Si tocas uno de los normales.");
      setText("pairs", "Encuentra el emoji diferente entre 25.", "Busca al único distinto entre una cuadrícula mucho más llena.", "Si tocas uno del grupo mayoritario.");

      // Más volumen para todos los sonidos.
      const originalAudio = audio;
      audio = function(type) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) return;
        if (!state.audio) state.audio = new Audio();
        const ctx = state.audio; if (ctx.state === "suspended") ctx.resume();
        const tones = { click:[360,.06,"sine"], tick:[620,.08,"square"], start:[880,.14,"sine"], good:[750,.18,"triangle"], bad:[160,.22,"sawtooth"], urgent:[980,.08,"square"], win:[680,.32,"triangle"], lose:[130,.30,"sawtooth"] };
        const [hz,duration,wave] = tones[type] || tones.click, now=ctx.currentTime, osc=ctx.createOscillator(), gain=ctx.createGain();
        osc.type=wave; osc.frequency.setValueAtTime(hz,now);
        if(type==="win") osc.frequency.exponentialRampToValueAtTime(1150,now+duration);
        if(type==="lose") osc.frequency.exponentialRampToValueAtTime(75,now+duration);
        gain.gain.setValueAtTime(.0001,now); gain.gain.exponentialRampToValueAtTime(.22,now+.01); gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
        osc.connect(gain).connect(ctx.destination); osc.start(now); osc.stop(now+duration+.03);
      };

      // Cada posición del juego de memoria/secuencia tiene su propia nota musical.
      const originalMount = mount;
      mount = function hardMount(id, area) {
        if (id === "sequence") {
          const seq=Array.from({length:6},()=>num(0,8)); let index=0,ready=false;
          const notes=[261.63,293.66,329.63,349.23,392,440,493.88,523.25,587.33];
          area.innerHTML='<div class="sequence-game"><p id="seq-tip" class="game-kicker">OBSERVA LOS DESTELLOS</p><div class="sequence-grid">'+Array.from({length:9},(_,i)=>'<button class="sequence-tile" data-i="'+i+'" disabled aria-label="Casilla '+(i+1)+'"></button>').join('')+'</div></div>';
          const tiles=[...area.querySelectorAll('.sequence-tile')];
          const playNote=i=>{ const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;if(!state.audio)state.audio=new Audio();const ctx=state.audio;if(ctx.state==='suspended')ctx.resume();const now=ctx.currentTime,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(notes[i],now);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.22,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+.28);osc.connect(gain).connect(ctx.destination);osc.start(now);osc.stop(now+.31); };
          const flash=i=>{if(i===seq.length){ready=true;area.querySelector('#seq-tip').textContent='AHORA REPÍTELA';tiles.forEach(t=>t.disabled=false);return;}const tile=tiles[seq[i]];tile.classList.add('lit');playNote(seq[i]);delay(()=>{tile.classList.remove('lit');delay(()=>flash(i+1),120);},430);};
          delay(()=>flash(0),350);
          bind(area,'click',e=>{const tile=e.target.closest('.sequence-tile');if(!tile||!ready)return;if(+tile.dataset.i!==seq[index])return result(false,'Ese no era el siguiente destello.');audio('click');tile.classList.add('chosen');delay(()=>tile.classList.remove('chosen'),150);if(++index===seq.length)result(true,'¡Secuencia musical perfecta!');});
          return;
        }
        if(id==="duck"){
          const target=12; area.innerHTML='<div class="catch-field" id="field"><p class="catch-count">PATOS: <b id="score">0</b> / '+target+'</p><button class="moving-duck" id="duck" aria-label="Pato" style="width:48px;height:48px;font-size:24px;padding:0">🦆</button></div>';
          const field=area.querySelector('#field'),duck=area.querySelector('#duck');let count=0;const move=()=>Object.assign(duck.style,pos(field,48));move();bind(field,'click',e=>{if(e.target!==duck)result(false,'El pato se ha reído de ese toque.');});bind(duck,'click',e=>{e.stopPropagation();audio('click');count++;area.querySelector('#score').textContent=count;count===target?result(true,'¡Doce patos atrapados!'):move();});return;
        }
        if(id==="intruder"){
          const total=49,[normal,odd]=pick([["🍎","🍐"],["🌻","🌼"],["🐸","🦎"],["🍪","🥨"],["⚽","🏀"],["🐱","🐯"],["🍋","🍊"],["⭐","🌟"],["🚗","🚕"],["🐟","🐠"]]),special=num(0,total-1);
          area.innerHTML='<p class="game-kicker">TOCA EL DISTINTO</p><div class="emoji-grid hard-grid" style="grid-template-columns:repeat(7,minmax(0,1fr));gap:4px">'+Array.from({length:total},(_,i)=>'<button class="emoji-tile" data-special="'+(i===special)+'" style="font-size:20px;min-width:0;min-height:36px;padding:2px">'+(i===special?odd:normal)+'</button>').join('')+'</div>';bind(area,'click',e=>{const tile=e.target.closest('.emoji-tile');if(tile)tile.dataset.special==='true'?result(true,'¡Ojo de águila!'):result(false,'Ese no era el intruso.');});return;
        }
        if(id==="pairs"){
          const total=25,[normal,odd]=pick([["🐶","🐱"],["🍓","🍋"],["🚗","🛵"],["🌙","⭐"],["🐙","🦑"],["🍕","🍔"],["🐸","🐢"]]),special=num(0,total-1);
          area.innerHTML='<p class="game-kicker">ENCUENTRA AL REBELDE</p><div class="pairs-grid" style="grid-template-columns:repeat(5,minmax(0,1fr));gap:5px">'+Array.from({length:total},(_,i)=>'<button class="pair-tile" data-special="'+(i===special)+'" style="font-size:22px;min-width:0;min-height:42px;padding:3px">'+(i===special?odd:normal)+'</button>').join('')+'</div>';bind(area,'click',e=>{const choice=e.target.closest('.pair-tile');if(choice)choice.dataset.special==='true'?result(true,'¡Encontraste al rebelde!'):result(false,'Ese sí pertenecía al grupo.');});return;
        }
        originalMount(id,area);
      };
      // La versión base llama a home() al final; la volvemos a pintar para asegurar que usa la dificultad ya aplicada.
      home();
    `;
    // Quitamos la llamada final a home() de la base para evitar que se ejecute dos veces.
    const source = base.replace(/\n?home\(\);\s*$/, "") + "\n" + hardPatch;
    eval(source);
  })
  .catch(err => { console.error("No se pudo cargar la versión base", err); document.querySelector('#app').innerHTML='<section class="screen"><h2>Error al cargar el juego</h2><p>Recarga la página.</p></section>'; });
