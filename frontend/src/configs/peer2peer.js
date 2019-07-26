let peerConnectionConfig = {
  'iceServers': [
    {'urls': 'stun:stun.stunprotocol.org:3478'},
    {'urls': 'stun:stun.l.google.com:19302'},
  ]
};

let constraints = {
  video: true,
  audio: true,
};

export {peerConnectionConfig, constraints};