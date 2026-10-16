// Tela de escolha de versão: aparece a cada carregamento da página.
// Para publicar uma versão nova: copie a pasta da última (ex.: v2/ para v3/),
// troque data-atual e o título dela, e acrescente uma linha nesta lista.
const VERSOES = [
  { id: '1.0', nome: 'O satélite', texto: 'O FCP-01 abre peça por peça enquanto você rola.', caminho: 'v1/' },
  { id: '2.0', nome: 'A equipe', texto: 'A CEFAST Aerospace, as quatro frentes e o FCP-01 no meio delas.', caminho: 'v2/' },
];

const tag = document.currentScript || document.querySelector('script[data-atual]');
const atual = tag?.dataset.atual || '';
const pagina = tag?.dataset.pagina !== undefined; // na raiz a tela é a própria página e não fecha
const raiz = tag?.dataset.raiz ?? './';

function montar() {
  const tela = document.createElement('div');
  tela.className = 'versao';
  tela.setAttribute('role', 'dialog');
  tela.setAttribute('aria-modal', 'true');
  tela.setAttribute('aria-labelledby', 'versao-titulo');
  tela.innerHTML = `
    <div class="versao__caixa">
      <img class="versao__logo" src="${raiz}assets/logo-cefast-aerospace.png" alt="CEFAST Aerospace" width="676" height="306">
      <h2 class="versao__titulo" id="versao-titulo">Escolha a versão</h2>
      <p class="versao__nota">${VERSOES.length} propostas de redesign para o site da equipe.</p>
      <div class="versao__opcoes">
        ${VERSOES.map((v) => `
          <a class="versao__opcao${v.id === atual ? ' is-atual' : ''}" href="${raiz}${v.caminho}" data-versao="${v.id}">
            <span class="versao__num">${v.id}</span>
            <span class="versao__nome">${v.nome}</span>
            <span class="versao__texto">${v.texto}</span>
            <span class="versao__ir">${v.id === atual ? 'Continuar nesta' : 'Abrir a versão ' + v.id} →</span>
          </a>`).join('')}
      </div>
    </div>`;
  document.body.appendChild(tela);
  if (!pagina) document.documentElement.classList.add('versao-aberta');

  const fechar = () => {
    tela.classList.add('is-saindo');
    document.documentElement.classList.remove('versao-aberta');
    setTimeout(() => tela.remove(), 320);
    document.removeEventListener('keydown', tecla);
  };
  const tecla = (e) => { if (e.key === 'Escape' && !pagina) fechar(); };
  document.addEventListener('keydown', tecla);
  if (pagina) { tela.classList.add('versao--pagina'); const ns = document.querySelector('noscript.versao-fallback'); ns?.remove(); }

  tela.querySelectorAll('.versao__opcao').forEach((a) => a.addEventListener('click', (e) => {
    if (a.dataset.versao === atual) { e.preventDefault(); fechar(); }
  }));
  requestAnimationFrame(() => tela.classList.add('is-on'));
  (tela.querySelector('.is-atual') || tela.querySelector('.versao__opcao'))?.focus({ preventScroll: true });

  // Botões "Trocar versão" espalhados pela página reabrem a tela
  window.__abrirVersao = montar;
}

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-abrir-versao]');
  if (b) { e.preventDefault(); if (!document.querySelector('.versao')) montar(); }
});

// ?direto pula a tela (útil para compartilhar uma versão específica)
if (!new URLSearchParams(location.search).has('direto')) {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar);
  else montar();
}
