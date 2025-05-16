const socket = io();
const app = document.getElementById('app');

let currentRoomId = '';
let currentUsername = '';
let role = ''; // 'admin' atau 'peserta'

let timerInterval = null;
let timeLeft = 60;

// Render halaman pilih role
function renderRoleSelection() {
  app.innerHTML = `
    <h1>Pilih Peran</h1>
    <button onclick="renderAdminForm()">Admin</button>
    <button onclick="renderJoinForm()">Peserta</button>
  `;
  clearTimer();
}

// Render form buat room untuk admin
function renderAdminForm() {
  role = 'admin';
  currentRoomId = '';
  currentUsername = '';
  app.innerHTML = `
    <h2>Admin - Buat Room</h2>
    <input id="adminName" placeholder="Nama Anda" autocomplete="off" oninput="checkAdminInput()" />
    <button id="createRoomBtn" onclick="createRoom()" disabled>Buat Room</button>
    <div id="roomInfo"></div>
  `;
  clearTimer();
}

// Cek input nama admin supaya tombol aktif/nonaktif
function checkAdminInput() {
  const name = document.getElementById('adminName').value.trim();
  document.getElementById('createRoomBtn').disabled = name === '';
}

// Kirim event buat room ke server
function createRoom() {
  const username = document.getElementById('adminName').value.trim();
  if (!username) {
    alert('Masukkan nama terlebih dahulu');
    return;
  }
  currentUsername = username;
  socket.emit('createRoom', { username });
}

// Render form gabung room untuk peserta
function renderJoinForm() {
  role = 'peserta';
  currentRoomId = '';
  currentUsername = '';
  app.innerHTML = `
    <h2>Peserta - Gabung Room</h2>
    <input id="userName" placeholder="Nama Anda" autocomplete="off" />
    <input id="roomId" placeholder="ID Room (6 karakter)" maxlength="6" style="text-transform: uppercase" autocomplete="off" />
    <button onclick="joinRoom()">Gabung</button>
    <div id="joinError" class="error"></div>
  `;
  clearTimer();
}

// Kirim event joinRoom ke server
function joinRoom() {
  const username = document.getElementById('userName').value.trim();
  const roomId = document.getElementById('roomId').value.trim().toUpperCase();
  if (!username || !roomId) {
    document.getElementById('joinError').textContent = 'Nama dan ID Room harus diisi!';
    return;
  }
  currentUsername = username;
  currentRoomId = roomId;
  document.getElementById('joinError').textContent = '';
  socket.emit('joinRoom', { username, roomId });
}

// Server konfirmasi room berhasil dibuat
socket.on('roomCreated', ({ roomId }) => {
  currentRoomId = roomId;
  document.getElementById('roomInfo').innerHTML = `
    <p>Room dibuat dengan ID: <b>${roomId}</b></p>
    <button onclick="startQuiz()">Mulai Kuis</button>
  `;
  renderRoomView(roomId);
  clearTimer();
});

// Server kirim error, tampilkan alert
socket.on('errorMsg', (msg) => {
  alert(msg);
});

// Update data room (admin, list peserta)
socket.on('roomData', ({ admin, players }) => {
  renderRoomView(currentRoomId, admin, players);
  clearTimer();
});

// Render tampilan room dengan data
function renderRoomView(roomId, admin = null, players = []) {
  app.innerHTML = `
    <h2>Room ID: ${roomId}</h2>
    <p><b>Admin:</b> ${admin || 'Loading...'}</p>
    <p><b>Peserta:</b></p>
    <ul>
      ${players.map(p => `<li>${p}</li>`).join('')}
    </ul>
  `;

  if (role === 'admin') {
    app.innerHTML += `<button onclick="startQuiz()">Mulai Kuis</button>`;
  }
  clearTimer();
}

// Kirim event mulai kuis ke server (hanya admin)
function startQuiz() {
  if (!currentRoomId) return;
  socket.emit('startQuiz', { roomId: currentRoomId });
  clearTimer();
}

// Server beri tahu kuis sudah mulai
socket.on('quizStarted', () => {
  app.innerHTML = `<h2>Kuis Dimulai!</h2><p>Tunggu soal berikutnya...</p>`;
  clearTimer();
});

// Server kirim soal baru dengan timer 1 menit
socket.on('newQuestion', ({ question, options, questionIndex, totalQuestions }) => {
  timeLeft = 60;
  clearInterval(timerInterval);

  let optionsHtml = options.map((opt, i) => `<li><button onclick="answerQuestion(${i})">${opt}</button></li>`).join('');
  app.innerHTML = `
    <h3>Soal ${questionIndex} dari ${totalQuestions}</h3>
    <p>${question}</p>
    <ul>${optionsHtml}</ul>
    <p>Waktu tersisa: <span id="timer">${timeLeft}</span> detik</p>
  `;

  timerInterval = setInterval(() => {
    timeLeft--;
    const timerElem = document.getElementById('timer');
    if (timerElem) timerElem.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      answerQuestion(null); // Kirim jawaban kosong jika waktu habis
    }
  }, 1000);
});

// Kirim jawaban ke server dan tampilkan feedback sementara
function answerQuestion(answerIndex) {
  clearInterval(timerInterval);
  socket.emit('answer', { roomId: currentRoomId, username: currentUsername, answerIndex });
  app.innerHTML = `<p>Jawaban terkirim, tunggu soal berikutnya...</p>`;
}

// Server kirim hasil akhir kuis
socket.on('finalResults', (scores) => {
  clearTimer();
  let resultHTML = '<h2>Hasil Kuis</h2><ul>';
  const sortedPlayers = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  sortedPlayers.forEach(([player, score]) => {
    resultHTML += `<li><b>${player}</b>: ${score} poin</li>`;
  });
  resultHTML += '</ul><button onclick="renderRoleSelection()">Mulai Ulang</button>';
  app.innerHTML = resultHTML;
});

// Fungsi bersihkan timer saat pindah halaman atau event
function clearTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

renderRoleSelection();
