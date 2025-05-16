const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3001;
const ROOMS_FILE = path.join(__dirname, 'rooms.json');

app.use(express.static('public')); // folder 'public' untuk client.js & index.html

// Load rooms dari file (atau kosongkan jika belum ada)
let rooms = {};
try {
  if (fs.existsSync(ROOMS_FILE)) {
    rooms = JSON.parse(fs.readFileSync(ROOMS_FILE));
  }
} catch (err) {
  console.error('Error loading rooms.json:', err);
}

// Simpan rooms ke file
function saveRooms() {
  fs.writeFileSync(ROOMS_FILE, JSON.stringify(rooms, null, 2));
}

// Generate ID Room 6 karakter A-Z0-9 unik
function generateRoomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id;
  do {
    id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[id]); // cek unik
  return id;
}

// Soal kuis contoh
const questions = [
  {
    question: "Apa kegunaan dari `let` dalam JavaScript?",
    options: ["Deklarasi fungsi", "Deklarasi variabel block-scoped", "Import modul", "Menentukan class"],
    answerIndex: 1
  },
  {
    question: "Manakah yang merupakan array valid di JavaScript?",
    options: ["{1, 2, 3}", "(1, 2, 3)", "[1, 2, 3]", "<1, 2, 3>"],
    answerIndex: 2
  },
  {
    question: "Fungsi `console.log()` digunakan untuk?",
    options: ["Mengirim email", "Mencetak ke terminal", "Menampilkan output di konsol", "Menjalankan fungsi"],
    answerIndex: 2
  },
  {
    question: "`const` digunakan untuk?",
    options: ["Variabel global", "Variabel yang dapat diubah", "Deklarasi variabel konstan", "Deklarasi fungsi"],
    answerIndex: 2
  },
  {
    question: "Manakah metode array untuk menambahkan item di akhir?",
    options: ["shift()", "pop()", "push()", "unshift()"],
    answerIndex: 2
  },
  {
    question: "Operator `===` membandingkan apa?",
    options: ["Nilai saja", "Tipe saja", "Nilai dan tipe", "Alamat memori"],
    answerIndex: 2
  },
  {
    question: "Template literal ditulis dengan?",
    options: ["''", "\"\"", "` `", "~~"],
    answerIndex: 2
  },
  {
    question: "Apa hasil dari `typeof null`?",
    options: ["object", "null", "undefined", "boolean"],
    answerIndex: 0
  },
  {
    question: "Apa itu hoisting?",
    options: ["Pengurutan array", "Pengangkatan deklarasi ke atas", "Pemanggilan fungsi otomatis", "Penggabungan objek"],
    answerIndex: 1
  },
  {
    question: "Method untuk mengubah string jadi array?",
    options: ["join()", "toString()", "split()", "push()"],
    answerIndex: 2
  },
  {
    question: "ES6 memperkenalkan fitur berikut, kecuali?",
    options: ["arrow function", "class", "var", "let"],
    answerIndex: 2
  },
  {
    question: "Keyword untuk membuat fungsi di JavaScript?",
    options: ["def", "function", "fun", "lambda"],
    answerIndex: 1
  },
  {
    question: "Apa hasil dari `[1,2,3].length`?",
    options: ["1", "2", "3", "undefined"],
    answerIndex: 2
  },
  {
    question: "Method array untuk mencari item pertama yang cocok?",
    options: ["filter()", "map()", "find()", "reduce()"],
    answerIndex: 2
  },
  {
    question: "`let a = 5; a += 3;` Nilai akhir `a`?",
    options: ["3", "5", "8", "53"],
    answerIndex: 2
  },
  {
    question: "Manakah loop yang cocok untuk iterasi array?",
    options: ["for...of", "while", "do...until", "switch"],
    answerIndex: 0
  },
  {
    question: "Operator logika untuk 'dan' dalam JavaScript?",
    options: ["||", "!", "and", "&&"],
    answerIndex: 3
  },
  {
    question: "Apa yang dikembalikan `Array.isArray([1,2,3])`?",
    options: ["false", "undefined", "true", "null"],
    answerIndex: 2
  },
  {
    question: "Bagaimana cara membuat objek?",
    options: ["[]", "()", "{}", "<>"],
    answerIndex: 2
  },
  {
    question: "Method untuk menyalin sebagian array?",
    options: ["splice()", "slice()", "split()", "copy()"],
    answerIndex: 1
  },
  {
    question: "Di automation testing, `assert` digunakan untuk?",
    options: ["Menjalankan fungsi", "Membuat server", "Menguji kebenaran", "Mengubah array"],
    answerIndex: 2
  },
  {
    question: "`NaN` berarti?",
    options: ["Not a Number", "Null and None", "No assigned Number", "Numeric Array"],
    answerIndex: 0
  },
  {
    question: "Fungsi panah tidak memiliki?",
    options: ["parameter", "return", "this", "body"],
    answerIndex: 2
  },
  {
    question: "Di ES6, `...rest` disebut?",
    options: ["operator join", "rest parameter", "spread array", "group object"],
    answerIndex: 1
  },
  {
    question: "Apa hasil dari `'5' + 3`?",
    options: ["8", "53", "undefined", "error"],
    answerIndex: 1
  },
  {
    question: "Method `map()` digunakan untuk?",
    options: ["Mengubah elemen array", "Menghapus item array", "Menyalin objek", "Menjumlahkan item"],
    answerIndex: 0
  },
  {
    question: "Apa itu callback function?",
    options: ["Fungsi yang dipanggil setelah fungsi lain selesai", "Fungsi yang error", "Fungsi anonim", "Fungsi global"],
    answerIndex: 0
  },
  {
    question: "Keyword `return` digunakan untuk?",
    options: ["Mengakhiri program", "Mengulang fungsi", "Mengembalikan nilai", "Membuat class"],
    answerIndex: 2
  },
  {
    question: "Testing otomatis bertujuan untuk?",
    options: ["Mempercepat debugging", "Mempercantik UI", "Mempercepat kompilasi", "Memperbesar ukuran file"],
    answerIndex: 0
  },
  {
    question: "Di testing, `describe()` digunakan untuk?",
    options: ["Menampilkan hasil", "Membuat grup pengujian", "Menjalankan file", "Menutup koneksi"],
    answerIndex: 1
  }
];


io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ username }) => {
    const roomId = generateRoomId();
    rooms[roomId] = {
      admin: username,
      players: [username],
      scores: {},
      currentQuestion: 0,
      answers: {},
      quizStarted: false,
    };
    saveRooms();

    socket.join(roomId);
    socket.emit('roomCreated', { roomId });
    io.to(roomId).emit('roomData', {
      admin: rooms[roomId].admin,
      players: rooms[roomId].players
    });

    console.log(`Room created: ${roomId} by admin ${username}`);
  });

  socket.on('joinRoom', ({ username, roomId }) => {
    roomId = roomId.toUpperCase();
    if (!rooms[roomId]) {
      socket.emit('errorMsg', 'Room tidak ditemukan!');
      return;
    }
    if (rooms[roomId].quizStarted) {
      socket.emit('errorMsg', 'Kuis sudah berjalan, tidak bisa bergabung!');
      return;
    }
    if (!rooms[roomId].players.includes(username)) {
      rooms[roomId].players.push(username);
      saveRooms();
    }
    socket.join(roomId);
    io.to(roomId).emit('roomData', {
      admin: rooms[roomId].admin,
      players: rooms[roomId].players
    });
    console.log(`${username} joined room ${roomId}`);
  });

  socket.on('startQuiz', ({ roomId }) => {
    if (!rooms[roomId]) return;
    if (rooms[roomId].quizStarted) return;

    rooms[roomId].quizStarted = true;
    rooms[roomId].currentQuestion = 0;
    rooms[roomId].scores = {};
    rooms[roomId].answers = {};
    saveRooms();

    io.to(roomId).emit('quizStarted');

    sendQuestion(roomId);
  });

  function sendQuestion(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    if (room.currentQuestion >= questions.length) {
      // Kuis selesai, kirim hasil
      io.to(roomId).emit('finalResults', room.scores);
      room.quizStarted = false;
      saveRooms();
      return;
    }

    const q = questions[room.currentQuestion];
    io.to(roomId).emit('newQuestion', {
      question: q.question,
      options: q.options,
      questionIndex: room.currentQuestion + 1,
      totalQuestions: questions.length
    });

    // Reset jawaban peserta untuk soal ini
    room.answers = {};

    // Timer 1 menit untuk soal
    setTimeout(() => {
      // Berikan skor untuk jawaban yang benar
      for (const player of room.players) {
        const answer = room.answers[player];
        if (answer === q.answerIndex) {
          room.scores[player] = (room.scores[player] || 0) + 10;
        } else {
          room.scores[player] = room.scores[player] || 0;
        }
      }
      room.currentQuestion++;
      saveRooms();
      sendQuestion(roomId);
    }, 60000);
  }

  socket.on('answer', ({ roomId, username, answerIndex }) => {
    if (!rooms[roomId] || !rooms[roomId].quizStarted) return;
    rooms[roomId].answers[username] = answerIndex;
    saveRooms();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
