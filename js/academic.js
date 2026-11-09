/* Aviso de entrada do projeto acadêmico: apenas uma vez por aba/sessão. */
(() => {
  'use strict';
  const key = 'jjstyle:academic-intro-shown';
  try {
    if (window.sessionStorage.getItem(key) === 'yes') return;
    window.sessionStorage.setItem(key, 'yes');
  } catch (_error) {
    // Se o sessionStorage estiver indisponível, a demonstração continua acessível.
  }

  const intro = document.createElement('div');
  intro.id = 'academic-preloader';
  intro.className = 'academic-preloader';
  intro.setAttribute('role', 'dialog');
  intro.setAttribute('aria-modal', 'true');
  intro.setAttribute('aria-labelledby', 'academic-intro-title');
  intro.setAttribute('aria-describedby', 'academic-intro-description');
  intro.innerHTML = [
    '<div class="academic-preloader-card">',
      '<img class="academic-preloader-logo" src="images/branding/logo-jj-style.webp" alt="JJ Style" width="700" height="663">',
      '<span class="academic-preloader-eyebrow">DEMONSTRAÇÃO EDUCACIONAL</span>',
      '<h2 id="academic-intro-title">Este é um projeto acadêmico.</h2>',
      '<p id="academic-intro-description">',
        'Site desenvolvido para a disciplina de Programação Front-End. ',
        'Os produtos, o carrinho e os pedidos são exemplos demonstrativos. ',
        '<strong>Não realizamos vendas, pagamentos ou entregas reais.</strong>',
      '</p>',
      '<div class="academic-preloader-progress" aria-hidden="true"><span></span></div>',
      '<button class="academic-preloader-skip" type="button">ENTRAR NO PROJETO <span aria-hidden="true">→</span></button>',
    '</div>'
  ].join('');
  document.body.append(intro);

  let finished = false;
  const timer = window.setTimeout(finish, 1800);
  function onKeydown(event) {
    if (event.key === 'Escape') finish();
  }
  function finish() {
    if (finished) return;
    finished = true;
    window.clearTimeout(timer);
    window.removeEventListener('keydown', onKeydown);
    intro.classList.add('is-leaving');
    window.setTimeout(() => intro.remove(), 270);
  }
  intro.querySelector('.academic-preloader-skip').addEventListener('click', finish);
  window.addEventListener('keydown', onKeydown);
  window.addEventListener('pagehide', () => {
    window.clearTimeout(timer);
    intro.remove();
  }, { once: true });
})();