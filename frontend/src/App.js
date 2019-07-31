import React, {useState, useEffect} from 'react';

import {Connection} from './services/api';
import {peerConnectionConfig, constraints} from './configs/peer2peer';

const App = () => {

  let localVideo = null;
  let localStream = null;
  let remoteVideo = null;
  let peerConnection = null;
  let uuid = null;

  let [username, setUsername] = useState('');
  let [peer, setPeer] = useState('');
  let [state, setState] = useState('off');

  useEffect(() => {
    init();
  });

  const handlerUsername = (event) => {
    setUsername(event.target.value);
  }

  const handlePeer = (event) => {
    setPeer(event.target.value);
  }

  const handleUsernameSubmit = (event) => {
    event.preventDefault();
    let message = {
      id : 'register',
		  name : username
    }
    sendMessage(message);

    if(navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSucess);
    }
  }

  const handlePeerSubmit = (event) => {
    event.preventDefault();
    let message = {
      id : 'call',
      from: username,
		  to : peer
    }
    sendMessage(message);
  }

  const sendMessage = (message) => {
    let msg = JSON.stringify(message);
    console.log('Sending message: ' + msg);
    Connection.send(msg);
  }

  const init = () => {
    localVideo = document.getElementById('local_video');
    remoteVideo = document.getElementById('remote_video');
    Connection.onmessage = handleMessageFromServer;
  }

  const handleMessageFromServer = (message) => {

    let msg = JSON.parse(message.data);
    console.log(msg);

    switch(msg.id) {

      case 'response_register':
        registerResponse(msg);
        break;
      
      case 'response_call':
        responseCall();
        break;

      case 'incoming_call':
        incomingCall();
        break;
      
      case 'ice': 
        addIceCandidate();
        break;

      case 'sdp': 
        addSdp();
        break;

      default: 
        break;

    }

  }

  const registerResponse = (message) => {
    if(message.text === 'accepted') {
      setState('ready');
    }
  }

  const responseCall = (message) => {
  }

  const incomingCall = (message) => {
    console.log('Receiving a call');
    peer = message.from;
    incomingStart();
  }

  const addIceCandidate = (message) => {
    peerConnection.addIceCandidate(new RTCIceCandidate(message.ice));
  }

  const addSdp = (message) => {
    peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp)).then(() => {
      if(message.sdp.type === 'offer') {
        peerConnection.createAnswer().then(createSDP);
      }
    });
  }

  const getUserMediaSucess = (stream) => {
    localStream = stream;
    localVideo.srcObject = stream;
  }

  const startCall = () => {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.ontrack = getRemoteStream;
    peerConnection.addStream(localStream);
    peerConnection.createOffer().then(createSDP);
  }

  const gotIceCandidate = (event) => {
    if(event.candidate != null) {
      Connection.send(JSON.stringify({id:'ice', to:peer, 'ice': event.candidate}));
    }
  }

  const getRemoteStream = (event) => {
    remoteVideo.srcObject = event.streams[0];
  }

  const createSDP = (description) => {
    peerConnection.setLocalDescription(description).then(() => {
      Connection.send(JSON.stringify({id:'sdp', to:peer, 'sdp': peerConnection.localDescription}));
    });
  }

  const incomingStart = () => {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.ontrack = getRemoteStream;
    peerConnection.addStream(localStream);
  }

  const start = (isCaller) => {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
    peerConnection.ontrack = getRemoteStream;
    peerConnection.addStream(localStream);

    if(isCaller) {
      peerConnection.createOffer().then(createSDP);
    }
  }

  return (
    <div className="App">
      
      <h1>WebRTC Peer to Peer</h1>
      
      <form onSubmit={handleUsernameSubmit}>
        <label>
          Nome:
          <input type="text" name="name" value={username} onChange={handlerUsername}/>
        </label>
        <input type="submit" value="Enviar" />
      </form>

      <form onSubmit={handlePeerSubmit}>
        <label>
          Peer:
          <input type="text" name="name" value={peer} onChange={handlePeer}/>
        </label>
        <input type="submit" value="Ligar" />
      </form>

      <video id='local_video' autoPlay muted />
      <video id='remote_video' autoPlay/>
      <input type="button" id="start" onClick={start.bind(true)} value="Start Video"></input>
    </div>
  );
}

export default App;
