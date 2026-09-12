const { WebSocketServer } = require('ws');
const port = process.env.PORT || 9080;
const wss = new WebSocketServer({ port });

let servers = {}; // { ws_id: { name, players, max_players, ws } }
let clients = {}; // { ws_id: ws }
let idCounter = 1;

wss.on('connection', (ws) => {
    const wsId = idCounter++;
    clients[wsId] = ws;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'register') {
                servers[wsId] = { 
                    name: data.name || "Сервер", 
                    players: data.players || 1,
                    max_players: data.max_players || 4,
                    ws: ws 
                };
            } 
            else if (data.type === 'update_server') {
                if (servers[wsId]) {
                    servers[wsId].players = data.players;
                }
            }
            else if (data.type === 'get_servers') {
                const list = Object.keys(servers).map(id => ({ 
                    id: id, 
                    name: servers[id].name,
                    players: servers[id].players || 1,
                    max_players: servers[id].max_players || 4
                }));
                ws.send(JSON.stringify({ type: 'server_list', servers: list }));
            } 
            else if (['connect_request', 'offer', 'answer', 'candidate'].includes(data.type)) {
                const targetWs = clients[data.target_id];
                if (targetWs && targetWs.readyState === 1) {
                    data.sender_id = wsId;
                    targetWs.send(JSON.stringify(data));
                }
            }
        } catch (e) { console.error(e); }
    });

    ws.on('close', () => {
        delete clients[wsId];
        delete servers[wsId];
    });
});

console.log(`Signaling server running on port ${port}`);