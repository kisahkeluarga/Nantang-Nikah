  const halaman = Array.from(document.querySelectorAll('.halaman'));
  const bintangBtn = Array.from(document.querySelectorAll('.bintang-btn'));
  const KUNCI_NILAI = 'nantang-nikah-v8';
  const SKOR_MAKS = 5;
  let indeks = 0;
  let nilai = {};

  // Muat nilai bintang yang tersimpan
  try {
    nilai = JSON.parse(localStorage.getItem(KUNCI_NILAI) || '{}');
  } catch (e) { nilai = {}; }

  function simpanNilai() {
    try { localStorage.setItem(KUNCI_NILAI, JSON.stringify(nilai)); } catch (e) {}
  }

  // Skor satu kelompok: sudah = total poin, maks = jumlah butir x 5
  function skorDari(pred) {
    const ids = new Set(bintangBtn.filter(pred).map(b => b.dataset.id));
    let sudah = 0;
    ids.forEach(id => { sudah += Number(nilai[id]) || 0; });
    return { sudah, maks: ids.size * SKOR_MAKS };
  }

  function persenDari(skor) {
    return skor.maks ? Math.round(skor.sudah / skor.maks * 100) : 0;
  }

  function perbaruiProgres() {
    // Bintang sampai nilai butir menjadi kuning
    bintangBtn.forEach(b => {
      b.classList.toggle('on', Number(b.dataset.nilai) <= (Number(nilai[b.dataset.id]) || 0));
    });
    // Sub item: x/y (x = total poin halaman, y = jumlah butir x 5)
    document.querySelectorAll('[data-persen-page]').forEach(el => {
      const pid = el.dataset.persenPage;
      const skor = skorDari(b => b.dataset.id.startsWith(pid + '-'));
      el.textContent = skor.sudah + '/' + skor.maks;
    });
    // Kriteria utama: loading bar dengan persentase di tengah
    document.querySelectorAll('[data-persen-bagian]').forEach(el => {
      const bkey = el.dataset.persenBagian;
      const skor = skorDari(b => {
        const page = b.closest('.halaman');
        return page && page.dataset.bagian === bkey;
      });
      const p = persenDari(skor);
      el.querySelector('.isi').style.width = p + '%';
      el.querySelector('.bar-angka').textContent = p + '%';
    });
    // Total: jarum dan angka kecil di ujung jarum
    const totalP = persenDari(skorDari(() => true));
    document.getElementById('total-persen').textContent = totalP + '%';
    document.getElementById('busur').setAttribute('stroke-dashoffset', 100 - totalP);
    document.getElementById('jarum').setAttribute('transform', 'rotate(' + (-90 + totalP * 1.8) + ' 100 100)');
  }

  function tampilkan(i) {
    indeks = Math.max(0, Math.min(halaman.length - 1, i));
    halaman.forEach((h, n) => h.classList.toggle('aktif', n === indeks));
    document.getElementById('arah-kiri').classList.toggle('habis', indeks === 0);
    document.getElementById('arah-kanan').classList.toggle('habis', indeks === halaman.length - 1);
    perbaruiProgres();
  }

  function dariHash() {
    const id = location.hash.replace('#', '');
    const i = halaman.findIndex(h => h.id === id);
    if (i !== -1) tampilkan(i);
  }

  function geser(arah) {
    const t = indeks + arah;
    if (t >= 0 && t < halaman.length) location.hash = halaman[t].id;
  }

  window.addEventListener('hashchange', dariHash);

  bintangBtn.forEach(b => b.addEventListener('click', () => {
    const n = Number(b.dataset.nilai);
    // Klik bintang yang sama dua kali berurutan mereset nilai butir ke 0
    nilai[b.dataset.id] = Number(nilai[b.dataset.id]) === n ? 0 : n;
    simpanNilai();
    perbaruiProgres();
  }));

  // Buka dan tutup bagian di halaman progres
  document.querySelectorAll('.bagian-judul').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.bagian').classList.toggle('terbuka'));
  });

  // Buka dan tutup isi tiap halaman (judul + sub judul selalu tampil)
  document.querySelectorAll('.kepala').forEach(k => {
    const bukaTutup = () => k.closest('.halaman').classList.toggle('terbuka');
    k.addEventListener('click', bukaTutup);
    k.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); bukaTutup(); }
    });
  });

  // Paginasi butir ceklis: tampil satu butir per nomor
  document.querySelectorAll('.paginasi').forEach(pg => {
    const halamanIni = pg.closest('.halaman');
    const butir = Array.from(halamanIni.querySelectorAll('.tab-butir'));
    const tombol = Array.from(pg.querySelectorAll('.pg'));
    tombol.forEach((b, i) => b.addEventListener('click', () => {
      butir.forEach((x, j) => x.classList.toggle('aktif', j === i));
      tombol.forEach((y, j) => y.classList.toggle('aktif', j === i));
    }));
  });

  // Panah transparan
  document.getElementById('arah-kiri').addEventListener('click', e => { e.currentTarget.blur(); geser(-1); });
  document.getElementById('arah-kanan').addEventListener('click', e => { e.currentTarget.blur(); geser(1); });

  // Geser dengan jari
  let mulaiX = 0, mulaiY = 0;
  const viewer = document.getElementById('viewer');
  viewer.addEventListener('touchstart', e => {
    mulaiX = e.touches[0].clientX;
    mulaiY = e.touches[0].clientY;
  }, { passive: true });
  viewer.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - mulaiX;
    const dy = e.changedTouches[0].clientY - mulaiY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) geser(dx < 0 ? 1 : -1);
  });

  // Geser dengan mouse di PC
  let tarik = false, tarikX = 0, tarikY = 0;
  viewer.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    tarik = true;
    tarikX = e.clientX;
    tarikY = e.clientY;
    viewer.classList.add('menarik');
  });
  window.addEventListener('mouseup', e => {
    if (!tarik) return;
    tarik = false;
    viewer.classList.remove('menarik');
    const dx = e.clientX - tarikX;
    const dy = e.clientY - tarikY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) geser(dx < 0 ? 1 : -1);
  });

  // Panah keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') geser(1);
    if (e.key === 'ArrowLeft') geser(-1);
  });

  // Popup Periksa Ulang
  const modal = document.getElementById('modal-reset');
  document.getElementById('buka-reset').addEventListener('click', () => modal.classList.add('buka'));
  document.getElementById('batal-reset').addEventListener('click', () => modal.classList.remove('buka'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('buka'); });
  document.getElementById('konfirmasi-reset').addEventListener('click', () => {
    nilai = {};
    try { localStorage.removeItem(KUNCI_NILAI); } catch (e) {}
    perbaruiProgres();
    modal.classList.remove('buka');
  });

  if (location.hash) dariHash(); else tampilkan(0);
