import React, {useEffect} from 'react';
import {Connection} from './services/api';
import {peerConnectionConfig, constraints} from './configs/peer2peer';

const App = () => {

  let localVideo = null;
  let localStream = null;
  let remoteVideo = null;
  let peerConnection = null;
  let uuid = null;

  useEffect(() => {
    init();
  });

  const init = () => {
    uuid = createUUID();

    localVideo = document.getElementById('local_video');
    remoteVideo = document.getElementById('remote_video');

    Connection.onmessage = gotMessageFromServer;

    if(navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia(constraints).then(getUserMediaSucess);
    }
  }

  const getUserMediaSucess = (stream) => {
    localStream = stream;
    localVideo.srcObject = stream;
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

  const gotMessageFromServer = (message) => {
    if(!peerConnection) start(false);

    let signal = JSON.parse(message.data);

    //Ignore messages from ourself
    if(signal.uuid === uuid) return;

    if(signal.sdp) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
        if(signal.sdp.type === 'offer') {
          peerConnection.createAnswer().then(createSDP);
        }
      });
    }
    else if(signal.ice) {
      peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }

  }

  const gotIceCandidate = (event) => {
    if(event.candidate != null) {
      Connection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
    }
  }

  const getRemoteStream = (event) => {
    remoteVideo.srcObject = event.streams[0];
  }

  const createSDP = (description) => {
    peerConnection.setLocalDescription(description).then(() => {
      Connection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
    });
  }

  const createUUID = () => {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
  
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }



  return (
    <div className="App">
      <h1>WebRTC Peer to Peer</h1>
      <video id='local_video' autoPlay muted />
      <video id='remote_video' autoPlay/>
      <input type="button" id="start" onClick={start.bind(true)} value="Start Video"></input>
    </div>
  );
}

export default App;
