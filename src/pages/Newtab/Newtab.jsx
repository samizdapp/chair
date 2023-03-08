import React from 'react';
import logo from '../../assets/img/logo.svg';
import './Newtab.css';
import './Newtab.scss';
import { JitsiMeeting } from '@jitsi/react-sdk';

const Newtab = () => {
  return (
<JitsiMeeting
    roomName = "PleaseUseAGoodRoomName"
    configOverwrite = {{
        startWithAudioMuted: true,
        disableModeratorIndicator: true,
        startScreenSharing: true,
        enableEmailInStats: false
    }}
    interfaceConfigOverwrite = {{
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
    }}
    userInfo = {{
        displayName: 'YOUR_USERNAME'
    }}
    onApiReady = { (externalApi) => {
        // here you can attach custom event listeners to the Jitsi Meet External API
        // you can also store it locally to execute commands
    } }
    getIFrameRef = { (iframeRef) => { iframeRef.style.height = '400px'; } }
/>
  );
};

export default Newtab;
