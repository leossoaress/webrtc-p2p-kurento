import {w3cwebsocket} from 'websocket';

let Connection = null;

let server_url = null;
let scheme = 'ws';

if (document.location.protocol === "https:") {
  scheme += "s";
}
server_url = scheme + "://127.0.0.1:8181";

console.log(`Connecting to server: ${server_url}`);
Connection = new w3cwebsocket(server_url, "json");

export {Connection}; 