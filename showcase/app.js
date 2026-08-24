const themes = {
  'clean-minimal': {
    name: 'Clean / Minimal',
    description: 'Precisa, luminosa y silenciosa; prioriza escaneabilidad y sensación de producto fácil de usar.',
    primary: '#165DFF', secondary: '#E8EEF8', success: '#16803C', error: '#D92D20'
  },
  'calido-sostenible': {
    name: 'Cálido / Sostenible',
    description: 'Cercana, humana y responsable; conecta el intercambio local con reutilización y confianza.',
    primary: '#176B5B', secondary: '#E7B75C', success: '#16794C', error: '#B42318'
  },
  'profesional-seguro': {
    name: 'Profesional / Seguro',
    description: 'Sobria, robusta y transparente; hace visible la confianza, la verificación y el estado de cada transacción.',
    primary: '#173B6C', secondary: '#0F766E', success: '#067647', error: '#B42318'
  },
  'vibrante-comunitario': {
    name: 'Vibrante / Comunitario',
    description: 'Enérgica, optimista y memorable; favorece descubrimiento y participación sin sacrificar legibilidad.',
    primary: '#E85D3F', secondary: '#146C94', success: '#087443', error: '#B42318'
  }
};

const state = {
  previewedOption: 'clean-minimal',
  status: 'pending_approval',
  selectedOption: null,
  approvedBy: null,
  approvedAt: null,
  decisionNotes: null
};

const root = document.documentElement;
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panel = document.querySelector('#theme-panel');
const elements = {
  activeName: document.querySelector('#active-theme-name'),
  title: document.querySelector('#theme-title'),
  description: document.querySelector('#theme-description'),
  panel: panel,
  primary: document.querySelector('#token-primary'),
  secondary: document.querySelector('#token-secondary'),
  success: document.querySelector('#token-success'),
  error: document.querySelector('#token-error'),
  primaryValue: document.querySelector('#token-primary-value'),
  secondaryValue: document.querySelector('#token-secondary-value'),
  successValue: document.querySelector('#token-success-value'),
  errorValue: document.querySelector('#token-error-value')
};

function renderTheme(themeId, moveFocus = false) {
  const theme = themes[themeId];
  if (!theme) return;
  state.previewedOption = themeId;
  root.dataset.theme = themeId;
  elements.activeName.textContent = theme.name;
  elements.title.textContent = theme.name;
  elements.description.textContent = theme.description;
  elements.primary.style.setProperty('--token-color', theme.primary);
  elements.secondary.style.setProperty('--token-color', theme.secondary);
  elements.success.style.setProperty('--token-color', theme.success);
  elements.error.style.setProperty('--token-color', theme.error);
  elements.primaryValue.textContent = theme.primary;
  elements.secondaryValue.textContent = theme.secondary;
  elements.successValue.textContent = theme.success;
  elements.errorValue.textContent = theme.error;
  elements.panel.setAttribute('aria-labelledby', `tab-${themeId}`);
  tabs.forEach((tab) => {
    const active = tab.dataset.themeId === themeId;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  if (moveFocus) document.querySelector(`#tab-${themeId}`).focus();
}

function selectRelativeTab(offset) {
  const current = tabs.findIndex((tab) => tab.dataset.themeId === state.previewedOption);
  const nextIndex = (current + offset + tabs.length) % tabs.length;
  renderTheme(tabs[nextIndex].dataset.themeId, true);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => renderTheme(tab.dataset.themeId));
  tab.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); selectRelativeTab(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectRelativeTab(-1); }
    if (event.key === 'Home') { event.preventDefault(); renderTheme(tabs[0].dataset.themeId, true); }
    if (event.key === 'End') { event.preventDefault(); renderTheme(tabs[tabs.length - 1].dataset.themeId, true); }
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); renderTheme(tab.dataset.themeId); }
  });
});

document.querySelectorAll('[data-favorite]').forEach((button) => {
  button.addEventListener('click', () => {
    const isFavorite = button.classList.toggle('is-favorite');
    button.setAttribute('aria-pressed', String(isFavorite));
    button.setAttribute('aria-label', isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos');
    const icon = button.querySelector('span');
    if (icon) icon.textContent = isFavorite ? '♥' : '♡';
  });
});

const modal = document.createElement('dialog');
modal.className = 'demo-dialog';
modal.innerHTML = '<form method="dialog"><button class="dialog-close" aria-label="Cerrar modal">×</button><p class="kicker">confirm action</p><h2>¿Publicar este anuncio?</h2><p>El anuncio será visible para personas que busquen herramientas cerca de ti.</p><div class="dialog-actions"><button value="cancel" class="ui-button tertiary">Revisar</button><button value="confirm" class="ui-button primary">Publicar</button></div></form>';
document.body.append(modal);
document.querySelector('.primary').addEventListener('click', (event) => {
  if (event.currentTarget.textContent.includes('Publicar')) { event.preventDefault(); modal.showModal(); }
});

document.querySelector('.failed button').addEventListener('click', (event) => {
  event.currentTarget.closest('.failed').innerHTML = '<span>Listo para reintentar</span><button>Reintentar</button>';
});

renderTheme(state.previewedOption);
