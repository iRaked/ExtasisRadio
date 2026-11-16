document.addEventListener('DOMContentLoaded', () => {
  console.log('Multimedia Hub cargado correctamente.');

  // Bloquear menú contextual (clic derecho)
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  // Prevenir atajos de teclado de inspector (F12, Ctrl+Shift+I, etc.)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))) {
      e.preventDefault();
    }
  });
});