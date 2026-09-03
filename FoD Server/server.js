const { WebSocketServer } = require('ws');
const port = process.env.PORT || 9080;
const wss = new WebSocketServer({ port });

let servers = {}; // { ws_id: { name, ws } }
let clients = {}; // { ws_id: ws }
let idCounter = 1;

wss.on('connection', (ws) => {
    const wsId = idCounter++;
    clients[wsId] = ws;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'register') {
                servers[wsId] = { name: data.name, ws: ws };
            } 
            else if (data.type === 'get_servers') {
                const list = Object.keys(servers).map(id => ({ id: id, name: servers[id].name }));
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