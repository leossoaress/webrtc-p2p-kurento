//Imports
const fs = require('fs');
const https = require('https');
const webSocket = require('ws');
const webSocketServer = webSocket.Server;

const User = require('./user');
const RegisterSystem = require('./register');

let register = new RegisterSystem();
let unique_id = 0;

//Certificate and key
const server_config = {
  key: fs.readFileSync('keys/key.pem'),
  cert: fs.readFileSync('keys/cert.pem')
};

const httpsServer = https.createServer(server_config);
httpsServer.listen(8181, '0.0.0.0');

//Create a server for handling websockets calls
const wss = new webSocketServer({server: httpsServer});

wss.on('connection', (ws) => {
  
  console.log('Connected client ' + unique_id);

  //Treat message ny message
  ws.on('message', (message) => {
    
    console.log('message received: %s', message);

    let msg = JSON.parse(message);

    switch(msg.id) {
      
      case 'register':
        Register(msg.name, ws);
        break;
      
      case 'call':
        Call(msg.from, msg.to);
        break;

      case 'ice':
        relay(msg.to, msg);
        break;

      case 'sdp':
        relay(msg.to, msg);
        break;

      default:
        break;
    }
  })
  
});

const Register = (name, ws) => {

  if(register.getUserByName(name) != undefined) {
    let message = {
      id: 'response_register',
      text: 'rejected'
    }
    return  ws.send(JSON.stringify(message));
  }
 
  let user = new User(unique_id, name, ws);
  register.registerUser(user);
  unique_id += 1;

  let message = {
    id: 'response_register',
    text: 'accepted'
  }

  user.sendMessage(message);
}

const Call = (source, target) => {
  let sourceUser = register.getUserByName(source);
  let targetUser = register.getUserByName(target);

  if(targetUser === undefined) {
    let message = {
      from: source,
      to: source,
      id: 'response',
      text: 'Peer not registered'
    }
    return sourceUser.sendMessage(message); 
  }

  let message = {
    id: 'incoming_call',
    from: source,
    to: target
  }

  return targetUser.sendMessage(message);
}

const relay = (target, message) => {
  console.log(target);
  console.log(message);

  if(target) {
    let targetUser = register.getUserByName(target);
    targetUser.sendMessage(message);
  }
  
}

console.log('Server running at port 8181');