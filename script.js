// ==========================================
// 1. PENGATURAN KUNCI (ISI DENGAN MILIKMU!)
// ==========================================
const CLOUD_NAME = "t1dycrzk"; 
const UPLOAD_PRESET = "flasacardo_preset"; 

const SUPABASE_URL = 'https://scgtalvsyllcyabbndrw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ3RhbHZzeWxsY3lhYmJuZHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzODIxNTksImV4cCI6MjEwMDk1ODE1OX0.ZW_fs-eH3N_gavtXZsI2s8eLRPD3qqsnXUPpM7SK13w';

// Aktifkan koneksi ke Supabase secara global
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 2. VARIABEL STATE & DOM ELEMENTS
// ==========================================
let currentDeck = "";
let currentSubDeck = "";
let daftarKartu = [];
let indexSaatIni = 0;

const viewDashboard = document.getElementById('view-dashboard');
const viewBelajar = document.getElementById('view-belajar');
const viewKelola = document.getElementById('view-kelola');

document.getElementById('btnKembaliBelajar').addEventListener('click', loadDashboard);
document.getElementById('btnKembaliKelola').addEventListener('click', loadDashboard);

function switchView(viewId) {
    viewDashboard.classList.add('hidden');
    viewBelajar.classList.add('hidden');
    viewKelola.classList.add('hidden');
    document.getElementById(viewId).classList.remove('hidden');
}

// ==========================================
// 3. LOGIKA DASHBOARD (GROUPING DECK & SUB DECK)
// ==========================================
async function loadDashboard() {
    switchView('view-dashboard');
    const deckList = document.getElementById('deck-list');
    deckList.innerHTML = '<p class="text-gray-500 italic">Memuat deck...</p>';

    try {
        const { data, error } = await supabaseClient.from('kartu_belajar').select('nama_deck, sub_deck');
        if (error) throw error;

        deckList.innerHTML = '';
        if (data.length === 0) {
            deckList.innerHTML = '<p class="text-gray-500 italic">Belum ada deck. Buat baru di bawah!</p>';
            return;
        }

        const strukturDeck = {};
        data.forEach(item => {
            if (!strukturDeck[item.nama_deck]) {
                strukturDeck[item.nama_deck] = new Set();
            }
            strukturDeck[item.nama_deck].add(item.sub_deck || "Utama");
        });

        // Merender HTML per Deck Utama
        Object.keys(strukturDeck).forEach((namaUtama, index) => {
            const idSafe = "deck_" + index; // ID unik untuk mengelompokkan checkbox
            
            const div = document.createElement('div');
            div.className = 'bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col';
            
            let htmlIsi = `
                <div class="bg-gray-100 p-3 border-b-2 border-gray-200 flex justify-between items-center">
                    <h3 class="font-bold text-lg text-arema truncate mr-2">${namaUtama}</h3>
                    <button onclick="bukaBelajar('${namaUtama.replace(/'/g, "\\'")}', 'SEMUA')" class="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded shadow transition shrink-0">
                        Belajar Semua
                    </button>
                </div>
                <ul class="p-3 space-y-2 flex-grow">
            `;
            
            strukturDeck[namaUtama].forEach(namaSub => {
                // TAMBAHAN: Kotak centang (Checkbox) di samping nama Sub-Deck
                const namaSubAman = namaSub.replace(/'/g, "\\'");
                htmlIsi += `
                    <li class="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                        <div class="flex items-center gap-2 overflow-hidden mr-2">
                            <input type="checkbox" value="${namaSub.replace(/"/g, '&quot;')}" class="chk-${idSafe} w-4 h-4 text-arema rounded cursor-pointer shrink-0">
                            <span class="font-medium text-gray-700 text-sm truncate">📂 ${namaSub}</span>
                        </div>
                        <div class="flex gap-1 shrink-0">
                            <button onclick="bukaBelajar('${namaUtama.replace(/'/g, "\\'")}', '${namaSubAman}')" class="bg-arema text-white text-xs font-bold py-1 px-2 rounded hover:bg-aremaDark">Belajar</button>
                            <button onclick="bukaKelola('${namaUtama.replace(/'/g, "\\'")}', '${namaSubAman}')" class="bg-gray-200 text-gray-700 text-xs font-bold py-1 px-2 rounded hover:bg-gray-300">Kelola</button>
                        </div>
                    </li>
                `;
            });
            
            // TAMBAHAN: Tombol Belajar Pilihan di bagian bawah kotak Deck
            htmlIsi += `</ul>
                <div class="bg-blue-50 p-2 border-t-2 border-blue-100 flex justify-center hover:bg-blue-100 transition">
                    <button onclick="bukaBelajarPilihan('${namaUtama.replace(/'/g, "\\'")}', '${idSafe}')" class="text-arema hover:text-aremaDark text-sm font-bold flex items-center gap-2 w-full justify-center">
                        ✓ Belajar Sub-Deck Centang
                    </button>
                </div>
            `;
            
            div.innerHTML = htmlIsi;
            deckList.appendChild(div);
        });

    } catch (error) {
        console.error("Gagal memuat deck:", error);
    }
}

document.getElementById('btnBuatDeck').addEventListener('click', () => {
    const namaBaru = document.getElementById('inputNamaDeckBaru').value.trim();
    const subBaru = document.getElementById('inputSubDeckBaru').value.trim() || "Utama"; 
    
    if (!namaBaru) return alert("Nama Deck Utama tidak boleh kosong!");
    
    document.getElementById('inputNamaDeckBaru').value = '';
    document.getElementById('inputSubDeckBaru').value = '';
    bukaKelola(namaBaru, subBaru);
});


// ==========================================
// 4. LOGIKA MODE BELAJAR (SATUAN, SEMUA, & PILIHAN)
// ==========================================

// Fungsi Belajar Standar (Satu Sub-Deck atau SEMUA)
async function bukaBelajar(deckUtama, subDeck) {
    currentDeck = deckUtama;
    currentSubDeck = subDeck;
    
    if (subDeck === 'SEMUA') {
        document.getElementById('judulBelajar').innerText = `${deckUtama} (Semua Bab)`;
    } else {
        document.getElementById('judulBelajar').innerText = `${deckUtama} > ${subDeck}`;
    }
    
    switchView('view-belajar');
    
    let query = supabaseClient.from('kartu_belajar').select('*').eq('nama_deck', deckUtama);
    if (subDeck !== 'SEMUA') query = query.eq('sub_deck', subDeck);
    
    const { data } = await query;
    if (!data || data.length === 0) return alertKosong();

    daftarKartu = subDeck === 'SEMUA' ? data.sort(() => Math.random() - 0.5) : data;
    indexSaatIni = 0;
    tampilkanKartuDiLayar();
}

// Fungsi BARU: Belajar Berdasarkan Centang (Checkbox)
async function bukaBelajarPilihan(deckUtama, idSafe) {
    // Cari semua checkbox yang dicentang di dalam Deck ini
    const checkboxes = document.querySelectorAll(`.chk-${idSafe}:checked`);
    const subDecksTerpilih = Array.from(checkboxes).map(cb => cb.value);

    // Validasi kalau user belum centang apa-apa
    if (subDecksTerpilih.length === 0) {
        return alert("Centang minimal satu sub-deck dulu di kotak kecil sebelah kirinya, Sam!");
    }

    // Kalau cuma centang 1, oper ke fungsi belajar normal
    if (subDecksTerpilih.length === 1) {
        return bukaBelajar(deckUtama, subDecksTerpilih[0]);
    }

    document.getElementById('judulBelajar').innerText = `${deckUtama} (${subDecksTerpilih.length} Pilihan)`;
    switchView('view-belajar');
    
    // Fitur sakti Supabase: .in() untuk mengambil banyak data sekaligus
    const { data, error } = await supabaseClient
        .from('kartu_belajar')
        .select('*')
        .eq('nama_deck', deckUtama)
        .in('sub_deck', subDecksTerpilih); 
        
    if (error || !data || data.length === 0) return alertKosong();

    // Acak kartu karena ini gabungan materi
    daftarKartu = data.sort(() => Math.random() - 0.5);
    indexSaatIni = 0;
    tampilkanKartuDiLayar();
}

function alertKosong() {
    alert("Tidak ada kartu yang ditemukan!");
    loadDashboard();
}

// DOM & Animasi Kartu
const flashcard = document.getElementById('flashcard');
const cardInner = document.getElementById('card-inner');

function balikKartu() { cardInner.classList.toggle('is-flipped'); }
flashcard.addEventListener('click', balikKartu);
document.getElementById('btnBalik').addEventListener('click', balikKartu);

function tampilkanKartuDiLayar() {
    cardInner.classList.remove('is-flipped');
    const kartu = daftarKartu[indexSaatIni];
    
    setTimeout(() => {
        document.getElementById('progressBelajar').innerText = `Kartu ${indexSaatIni + 1} / ${daftarKartu.length}`;
        document.getElementById('teksSoal').innerText = kartu.soal;
        document.getElementById('teksJawaban').innerText = kartu.jawaban;
        
        const imgEl = document.getElementById('gambarSoal');
        if (kartu.gambar_url) {
            imgEl.src = kartu.gambar_url;
            imgEl.classList.remove('hidden');
        } else {
            imgEl.classList.add('hidden');
        }
    }, 150);
}

document.getElementById('btnLanjut').addEventListener('click', () => {
    indexSaatIni++;
    if (indexSaatIni >= daftarKartu.length) {
        indexSaatIni = 0;
        alert("Mantap! Kamu sudah mereview semua kartu dalam sesi ini!");
    }
    tampilkanKartuDiLayar();
});


// ==========================================
// 5. LOGIKA MODE KELOLA (CRUD & BULK)
// ==========================================
async function bukaKelola(deckUtama, subDeck) {
    currentDeck = deckUtama;
    currentSubDeck = subDeck;
    document.getElementById('judulKelola').innerText = `${deckUtama} > ${subDeck}`;
    switchView('view-kelola');
    await muatTabelKartu();
}

async function muatTabelKartu() {
    const tbody = document.getElementById('tabelKartuBody');
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Memuat data...</td></tr>';

    const { data, error } = await supabaseClient.from('kartu_belajar')
                            .select('*')
                            .eq('nama_deck', currentDeck)
                            .eq('sub_deck', currentSubDeck)
                            .order('created_at', { ascending: false });
    
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-gray-500">Belum ada kartu di sub-deck ini.</td></tr>';
        return;
    }

    data.forEach(kartu => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="py-2 px-4 border-b text-sm">${kartu.soal}</td>
            <td class="py-2 px-4 border-b text-sm">${kartu.jawaban}</td>
            <td class="py-2 px-4 border-b text-sm text-center">
                ${kartu.gambar_url ? `<img src="${kartu.gambar_url}" class="h-8 mx-auto rounded">` : '-'}
            </td>
            <td class="py-2 px-4 border-b text-sm text-center">
                <button onclick='bukaModalEdit(${JSON.stringify(kartu)})' class="bg-yellow-400 hover:bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold mr-1">Edit</button>
                <button onclick="hapusKartu(${kartu.id})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Tab Switch Kelola
document.getElementById('tabSingle').addEventListener('click', (e) => {
    e.target.classList.add('text-arema', 'border-b-2', 'border-arema'); e.target.classList.remove('text-gray-400');
    document.getElementById('tabBulk').classList.remove('text-arema', 'border-b-2', 'border-arema'); document.getElementById('tabBulk').classList.add('text-gray-400');
    document.getElementById('formSingle').classList.remove('hidden'); document.getElementById('formBulk').classList.add('hidden');
});
document.getElementById('tabBulk').addEventListener('click', (e) => {
    e.target.classList.add('text-arema', 'border-b-2', 'border-arema'); e.target.classList.remove('text-gray-400');
    document.getElementById('tabSingle').classList.remove('text-arema', 'border-b-2', 'border-arema'); document.getElementById('tabSingle').classList.add('text-gray-400');
    document.getElementById('formBulk').classList.remove('hidden'); document.getElementById('formSingle').classList.add('hidden');
});

// ==========================================
// 6. CREATE (Single, Bulk, Upload Gambar)
// ==========================================
async function uploadKeCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: formData });
    const data = await response.json();
    if (!data.secure_url) throw new Error("Gagal upload gambar");
    return data.secure_url;
}

document.getElementById('btnSimpanSingle').addEventListener('click', async (e) => {
    const soal = document.getElementById('inputSoal').value.trim();
    const jawaban = document.getElementById('inputJawaban').value.trim();
    const file = document.getElementById('inputGambar').files[0];
    const status = document.getElementById('statusUpload');

    if (!soal || !jawaban) return alert("Soal dan Jawaban wajib diisi!");
    
    e.target.disabled = true; e.target.innerText = "Memproses...";
    let urlGambar = "";

    try {
        if (file) {
            status.innerText = "Mengunggah gambar...";
            urlGambar = await uploadKeCloudinary(file);
        }
        status.innerText = "Menyimpan ke database...";
        
        // Simpan dengan tambahan field sub_deck
        await supabaseClient.from('kartu_belajar').insert([{ nama_deck: currentDeck, sub_deck: currentSubDeck, soal, jawaban, gambar_url: urlGambar }]);
        
        document.getElementById('inputSoal').value = '';
        document.getElementById('inputJawaban').value = '';
        document.getElementById('inputGambar').value = '';
        status.innerText = "Berhasil disimpan!";
        status.className = "text-sm text-green-600 text-center font-bold";
        await muatTabelKartu();
    } catch (err) {
        status.innerText = "Terjadi kesalahan.";
        status.className = "text-sm text-red-600 text-center font-bold";
    }
    setTimeout(() => { e.target.disabled = false; e.target.innerText = "Simpan Kartu"; status.innerText = ""; }, 2000);
});

document.getElementById('btnSimpanBulk').addEventListener('click', async (e) => {
    const teksBulk = document.getElementById('inputBulk').value.trim();
    const status = document.getElementById('statusBulk');
    if (!teksBulk) return alert("Kotak teks masih kosong!");
    
    const dataInsert = [];
    teksBulk.split('\n').forEach(baris => {
        if (baris.includes('|')) {
            const bagian = baris.split('|');
            // Simpan dengan tambahan field sub_deck
            dataInsert.push({ nama_deck: currentDeck, sub_deck: currentSubDeck, soal: bagian[0].trim(), jawaban: bagian[1].trim() });
        }
    });

    if (dataInsert.length === 0) return alert("Format salah. Pakai tanda |");

    e.target.disabled = true; e.target.innerText = "Menyimpan " + dataInsert.length + " kartu...";
    try {
        await supabaseClient.from('kartu_belajar').insert(dataInsert);
        document.getElementById('inputBulk').value = '';
        status.innerText = `${dataInsert.length} Kartu berhasil ditambahkan!`;
        status.className = "text-sm text-green-600 text-center font-bold";
        await muatTabelKartu();
    } catch (err) { status.innerText = "Terjadi kesalahan."; }
    setTimeout(() => { e.target.disabled = false; e.target.innerText = "Simpan Banyak Kartu Sekaligus"; status.innerText = ""; }, 2000);
});

// ==========================================
// 7. UPDATE & DELETE KARTU
// ==========================================
async function hapusKartu(id) {
    if (confirm("Yakin ingin menghapus kartu ini secara permanen?")) {
        await supabaseClient.from('kartu_belajar').delete().eq('id', id);
        muatTabelKartu();
    }
}

const modalEdit = document.getElementById('modalEdit');
const centangHapusGambar = document.getElementById('centangHapusGambar');
const areaHapusGambar = document.getElementById('areaHapusGambar');

function bukaModalEdit(kartu) {
    document.getElementById('editIdKartu').value = kartu.id;
    document.getElementById('editUrlLama').value = kartu.gambar_url || "";
    document.getElementById('editSoal').value = kartu.soal;
    document.getElementById('editJawaban').value = kartu.jawaban;
    document.getElementById('editGambarBaru').value = ''; 
    centangHapusGambar.checked = false;
    
    if (kartu.gambar_url) { areaHapusGambar.classList.remove('hidden'); } 
    else { areaHapusGambar.classList.add('hidden'); }
    modalEdit.classList.remove('hidden');
}

document.getElementById('btnBatalEdit').addEventListener('click', () => modalEdit.classList.add('hidden'));

document.getElementById('btnSimpanEdit').addEventListener('click', async (e) => {
    const id = document.getElementById('editIdKartu').value;
    const soal = document.getElementById('editSoal').value.trim();
    const jawaban = document.getElementById('editJawaban').value.trim();
    const file = document.getElementById('editGambarBaru').files[0];
    const status = document.getElementById('statusEdit');

    e.target.disabled = true; e.target.innerText = "Updating...";
    let finalUrl = document.getElementById('editUrlLama').value; 
    if (centangHapusGambar.checked) finalUrl = ""; 

    try {
        if (file) {
            status.innerText = "Mengunggah gambar baru...";
            finalUrl = await uploadKeCloudinary(file);
        }
        status.innerText = "Menyimpan perubahan...";
        await supabaseClient.from('kartu_belajar').update({ soal, jawaban, gambar_url: finalUrl }).eq('id', id);
        modalEdit.classList.add('hidden');
        await muatTabelKartu(); 
    } catch (err) { status.innerText = "Gagal memperbarui."; }
    
    e.target.disabled = false; e.target.innerText = "Update Data"; status.innerText = "";
});

// START
loadDashboard();