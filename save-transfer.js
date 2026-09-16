/* Local save-file tools.  Uses the same payload as SAVE.save(), so imports
   are portable without changing game progression semantics. */
(function () {
  const key = 'isotope_save';
  const out = document.getElementById('btn-save-export'), inn = document.getElementById('btn-save-import'), file = document.getElementById('inp-save-import');
  if (!out || !inn || !file) return;
  out.addEventListener('click', function () {
    const blob = new Blob([JSON.stringify(SAVE.raw, null, 2)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'isotope-save-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  });
  inn.addEventListener('click', function () { file.click(); });
  file.addEventListener('change', function () {
    const picked = file.files && file.files[0]; if (!picked) return;
    const reader = new FileReader(); reader.onload = function () {
      try { const parsed = JSON.parse(reader.result); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw Error('invalid'); localStorage.setItem(key, JSON.stringify(parsed)); location.reload(); }
      catch (e) { alert('That is not a valid ISOTOPE save file.'); }
    }; reader.readAsText(picked);
  });
})();
