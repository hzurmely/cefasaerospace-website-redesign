import { createSatellite, CHAPTERS } from './satellite.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Fundo estrelado desenhado uma vez por tamanho de tela */
function stars() {
  const c = document.getElementById('stars'); if (!c) return;
  const ctx = c.getContext('2d');
  const draw = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth, h = window.innerHeight;
    c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#050d1a'; ctx.fillRect(0, 0, w, h);
    let s = 1729;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const n = Math.round((w * h) / 2600);
    for (let i = 0; i < n; i++) {
      const x = rnd() * w, y = rnd() * h, r = rnd() ** 3 * 1.3 + 0.25, a = 0.25 + rnd() * 0.65;
      ctx.fillStyle = rnd() > 0.86 ? `rgba(165,200,245,${a})` : `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
  };
  draw();
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 150); });
}

/* A história presa: posição de rolagem vira capítulo do satélite */
async function story() {
  const sec = document.querySelector('.story'); if (!sec) return;
  const canvas = sec.querySelector('.story__canvas');
  const title = sec.querySelector('.story__title');
  const chapters = [...sec.querySelectorAll('.chapter')];
  const buttons = [...sec.querySelectorAll('[data-go]')];
  const last = CHAPTERS.length - 1;
  let sat = null, shown = 0;

  const progress = () => {
    const r = sec.getBoundingClientRect();
    const run = sec.offsetHeight - window.innerHeight;
    return Math.min(1, Math.max(0, -r.top / run));
  };
  const update = () => {
    // 85% da rolagem percorre os capítulos, o resto segura o último antes de soltar
    const c = Math.min(last, (progress() / 0.86) * last);
    sat?.setChapter(c);
    // O nome ocupa a primeira tela e sobe quando o satélite começa a abrir
    const t = Math.min(1, c / 0.75);
    title.style.setProperty('--title-o', String(1 - t));
    title.style.setProperty('--title-y', `${-t * 80}px`);
    title.style.visibility = t >= 1 ? 'hidden' : 'visible';
    const idx = Math.min(last, Math.round(c));
    if (idx !== shown) {
      chapters[shown].classList.remove('is-on'); chapters[idx].classList.add('is-on');
      buttons[shown].removeAttribute('aria-current'); buttons[idx].setAttribute('aria-current', 'true');
      shown = idx;
    }
  };
  buttons.forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.go;
    const run = sec.offsetHeight - window.innerHeight;
    const top = sec.offsetTop + (i / last) * 0.86 * run + 2;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
  }));
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();

  try {
    sat = await createSatellite(canvas, { url: 'assets/fcp01.glb' });
    document.documentElement.classList.add('is-live');
    update();
  } catch (e) {
    // Sem WebGL a imagem estática continua no lugar
    console.warn('Modelo 3D indisponível', e);
  }
}

/* Entradas: cada seção chega em ordem de leitura */
function reveals() {
  const els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('is-in')); return; }
  const groups = new Map();
  els.forEach((el) => {
    const sec = el.closest('section') || document.body;
    const list = groups.get(sec) || []; list.push(el); groups.set(sec, list);
    el.style.setProperty('--d', `${(list.length - 1) * 80}ms`);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  els.forEach((el) => io.observe(el));
}

/* Contagem até o CubeDesign 2026 */
function countdown() {
  const el = document.querySelector('[data-countdown]'); if (!el) return;
  const start = new Date(el.dataset.countdown), end = new Date(el.dataset.end), now = new Date();
  const days = el.querySelector('.record__days'), unit = el.querySelector('.record__unit');
  if (now < start) {
    const d = Math.ceil((start - now) / 86400000);
    days.textContent = String(d);
    unit.textContent = d === 1 ? 'dia até o CubeDesign 2026, na UNSAM, em Buenos Aires.' : 'dias até o CubeDesign 2026, na UNSAM, em Buenos Aires.';
  } else if (now <= end) {
    days.textContent = 'Agora';
    unit.textContent = 'a equipe está no CubeDesign 2026, em Buenos Aires. Acompanhe pelos stories de @cefastaerospace.';
  } else {
    days.textContent = '2026';
    unit.textContent = 'O FCP-01 competiu no CubeDesign, em Buenos Aires. O resultado sai no Instagram @cefastaerospace.';
  }
}

function bar() {
  const b = document.querySelector('.bar'); if (!b) return;
  const s = document.querySelector('.story');
  const on = () => b.classList.toggle('is-solid', window.scrollY > (s ? s.offsetTop + s.offsetHeight - window.innerHeight - 20 : 40));
  on(); window.addEventListener('scroll', on, { passive: true });
}

stars();
bar();
countdown();
reveals();
story();
