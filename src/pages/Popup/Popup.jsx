import React from 'react';
import { useEffect } from 'react';
import logo from '../../assets/img/logo.svg';
import Greetings from '../../containers/Greetings/Greetings';
import './Popup.css';

const Popup = () => {
  const [room, setRoom] = React.useState('');

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <input
          type="text"
          placeholder="room name"
          onChange={({ target: { value } }) => {
            console.log(value);
            setRoom(value);
          }}
        />
        <button
          className="App-link"
          onClick={() => {
            (async () => {
              const [
                {
                  workArea: { height, width },
                },
              ] = await chrome.system.display.getInfo();
              const browser = await chrome.windows.create({
                left: 300,
                width: width - 300,
              });

              const _url = new URL(window.location.href);
              _url.searchParams.set('room', room);
              _url.searchParams.set('browser', browser.id);
              _url.protocol = 'chrome-extension';
              _url.host = window.location.host;
              _url.pathname = '/jitsi.html';
              const url = _url.toString();

              const meeting = await chrome.windows.create({
                url,
                type: 'popup',
                left: 0,
                top: 0,
                width: 300,
              });
            })();
          }}
          // href={`chrome-extension://${
          //   window.location.host
          // }/jitsi.html#${Math.random().toString(36).substring(7)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          start meeting
        </button>
      </header>
    </div>
  );
};

export default Popup;
