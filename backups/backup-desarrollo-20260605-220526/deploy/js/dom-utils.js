// ===== DOM Utils (helpers seguros) =====
window.$id = window.$id || function (id) {
  return document.getElementById(id);
};

window.show = window.show || function (id) {
  const el = window.$id(id);
  if (el) el.style.display = 'block';
};

window.hide = window.hide || function (id) {
  const el = window.$id(id);
  if (el) el.style.display = 'none';
};

window.setText = window.setText || function (id, value) {
  const el = window.$id(id);
  if (el) el.textContent = value;
};

window.setValue = window.setValue || function (id, value) {
  const el = window.$id(id);
  if (el) el.value = value;
};

window.clearHTML = window.clearHTML || function (id) {
  const el = window.$id(id);
  if (el) el.innerHTML = '';
};
