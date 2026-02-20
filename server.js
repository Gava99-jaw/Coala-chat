const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*" }
});

app.use(express.static('public'));

let messages = [];
let users = new Map();

io.on('connection', (socket) => {
  console.log('Новый пользователь');
  
  const userName = 'Гость_' + Math.floor(Math.random() * 1000);
  users.set(socket.id, { name: userName });
  
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
    
    // Ответ ИИ если онлайн < 10
    if (users.size < 10) {
      socket.emit('typing', true);
      
      let aiText = '';
      
      // ПРОБУЕМ ПЕРВЫЙ API (Pollinations)
      try {
        console.log('Пробуем Pollinations...');
        const response = await fetch('https://text.pollinations.ai/' + 
          encodeURIComponent(data.text + ' (ответь кратко, как красная коала, 1-2 предложения, с эмодзи)'));
        
        if (response.ok) {
          aiText = await response.text();
          console.log('Pollinations ответил');
        } else {
          throw new Error('Pollinations error');
        }
      } catch (e) {
        console.log('Pollinations не отвечает, пробуем DeepSeek...');
        
        // ЗАПАСНОЙ API - DeepSeek
        try {
          const response2 = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer sk-or-v1-64e1068c3d8a4c7c9b5f2e1d3a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5g6h'
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                {role: 'system', content: 'Ты красная коала. Отвечай кратко, мило, с эмодзи.'},
                {role: 'user', content: data.text}
              ],
              temperature: 0.9,
              max_tokens: 60
            })
          });
          
          const data2 = await response2.json();
          aiText = data2.choices?.[0]?.message?.content;
          
          if (!aiText) throw new Error('Нет ответа от DeepSeek');
          console.log('DeepSeek ответил');
          
        } catch (e2) {
          console.log('Оба API упали, даем заглушку');
          
          // ЗАГЛУШКИ если оба API не работают
          const fallbacks = [
            '🐨 Я коала и я сплю на дереве... мяу то есть фррр',
            '🍃 Ветка шевелится... это я, коала!',
            '🌳 Красная коала дремлет, но слышит тебя',
            '🐨 У коалы выходной, спроси позже!',
            '😴 Zzz... а? что? я тут, просто сплю на дереве'
          ];
          aiText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
      }
      
      socket.emit('typing', false);
      
      // Отправляем ответ ИИ
      const aiMsg = {
        user: '🐨 Красная Коала',
        text: aiText,
        time: new Date().toLocaleTimeString(),
        isAI: true
      };
      messages.push(aiMsg);
      io.emit('message', aiMsg);
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
