// ========== MULTIPLICADORES & RECÁLCULO ==========
if (!window.multiplicadores) window.multiplicadores = { saladas: 1, postres: 1 };

function actualizarMultiplicador(tipo, valor) {
  const v = parseFloat(valor);
  window.multiplicadores[tipo] = isNaN(v) || v <= 0 ? 1 : v;

  const pax = window.pax || 0;
  if (tipo === 'saladas') {
    if (window.setText) setText('multSaladasValue', window.multiplicadores.saladas);
    if (window.setText) setText('totalSaladasValue', Math.ceil(pax * window.multiplicadores.saladas));
  } else if (tipo === 'postres') {
    if (window.setText) setText('multPostresValue', window.multiplicadores.postres);
    if (window.setText) setText('totalPostresValue', Math.ceil(pax * window.multiplicadores.postres));
  }
  // Re-renderizar referencias visibles
  if (typeof actualizarCantidadesReferencias === 'function') {
    actualizarCantidadesReferencias();
  }
}

function actualizarCantidades() {
  const categoriaId = parseInt(document.getElementById('categoria')?.value);
  window.pax = parseInt(document.getElementById('pax')?.value) || 0;

  if (categoriaId === 1 && typeof actualizarCantidadesDesayuno === 'function') {
    actualizarCantidadesDesayuno();
    return;
  }
  if (typeof actualizarCantidadesReferencias === 'function') {
    actualizarCantidadesReferencias();
  }
}
