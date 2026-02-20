const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

app.use(express.static('public'));

// Хранилище
let messages = [];
let users = new Map();

io.on('connection', (socket) => {
  console.log('Новый пользователь');
  
  // Даем имя
  const userName = 'Гость_' + Math.floor(Math.random() * 1000);
  users.set(socket.id, { name: userName });
  
  // Отправляем историю
  socket.emit('history', messages);
  io.emit('online', Array.from(users.values()));
  
  // Получаем сообщение
  socket.on('message', async (data) => {
    const user = users.get(socket.id) || { name: 'Аноним' };
    
    // Сообщение пользователя
    const userMsg = {
      user: user.name,
      text: data.text,
      time: new Date().toLocaleTimeString(),
      isAI: false
    };
    messages.push(userMsg);
    io.emit('message', userMsg);
    
    // Ответ ИИ (если онлайн < 10)
    if (users.size < 10) {
      socket.emit('typing', true);
      
      // Простой API без ключей
      try {
        const response = await fetch('https://text.pollinations.ai/' + 
          encodeURIComponent(data.text + ' (ответь кратко и с эмодзи)'));
        const aiText = await response.text();
        
        const aiMsg = {
          user: '🐨 Красная Коала',
          text: aiText,
          time: new Date().toLocaleTimeString(),
          isAI: true
        };
        messages.push(aiMsg);
        io.emit('message', aiMsg);
      } catch (e) {
        console.log('Ошибка ИИ');
      }
      
      socket.emit('typing', false);
    }
  });
  
  // Смена имени
  socket.on('setName', (name) => {
    const user = users.get(socket.id);
    if (user) user.name = name;
    io.emit('online', Array.from(users.values()));
  });
  
  socket.on('disconnect', () => {
    users.delete(socket.id);
    io.emit('online', Array.from(users.values()));
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Сервер на порту ${PORT}`);
});