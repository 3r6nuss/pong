const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const os = require('os');

// Finde die lokale Netzwerk-IP-Adresse heraus
function getLocalIp() {
    const networkInterfaces = os.networkInterfaces();
    for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}

const localIp = getLocalIp();

// Stellt die Server-URL für das Frontend bereit, damit der QR-Code die echte IP statt "localhost" nutzt
app.get('/config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`window.SERVER_URL = "http://${localIp}:3000";`);
});

app.use(express.static(__dirname)); // Serviert deine HTML Dateien

const activePlayers = {};

io.on('connection', (socket) => {
    console.log('Ein Client hat sich verbunden:', socket.id);

    socket.on('joinGame', (data) => {
        // data: { side: 'left' | 'right', name: string }
        if (!data || !data.side) return;
        
        activePlayers[socket.id] = {
            side: data.side,
            name: data.name
        };
        console.log(`Socket ${socket.id} ist beigetreten als ${data.name} (${data.side})`);
        
        io.emit('playerJoined', {
            side: data.side,
            name: data.name
        });
    });

    socket.on('touchY', (relativeY) => {
        const player = activePlayers[socket.id];
        if (player) {
            socket.broadcast.emit('updatePaddle', {
                side: player.side,
                relativeY: relativeY
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('Client getrennt:', socket.id);
        delete activePlayers[socket.id];
    });
});

http.listen(3000, '0.0.0.0', () => {
    console.log('Server läuft auf Port 3000');
    console.log(`Lokale IP für mobile Geräte: http://${localIp}:3000`);
});