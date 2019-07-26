//Imports
const fs = require('fs');
const https = require('https');
const webSocket = require('ws');
const webSocketServer = webSocket.Server;

//Certificate and key
/*const server_config = {
  key: fs.readFileSync('/keys/key.pem'),
  cert: fs.readFileSync('/keys/cert.pem')
};*/

//Create a server for handling websockets calls
const wss = new webSocketServer({port: 8181});

wss.on('connection', (ws) => {
  
  console.log('Client connected');

  //Broadcast any received message to all clients
  ws.on('message', (message) => {
    console.log('message received: %s', message);
    wss.broadcast(message);
  })
  
});

//Broadcast function
wss.broadcast = function(data) {
  this.clients.forEach((client) => {
    if(client.readyState === webSocket.OPEN) {
      client.send(data);
    }
  });
}

console.log('Server running at port 8181');