import './index.css';

const script = document.createElement('script');
script.src = `chrome-extension://${window.location.host}/external_api.js`;
document.head.appendChild(script);
script.onload = () => {
  const tabMap = new Map();
  const participants = new Set();
  let conductor = false;
  const domain = 'meet.jit.si';
  const url = new URL(window.location.href);
  const room = url.searchParams.get('room');
  const browser = parseInt(url.searchParams.get('browser'));
  const options = {
    roomName: room,
    width: '100%',
    height: '100%',
    parentNode: document.getElementById('app-container'),
  };

  // eslint-disable-next-line no-unused-vars, no-undef
  const api = (window.api = new JitsiMeetExternalAPI(domain, options));
  api.addListener('videoConferenceJoined', async () => {
    api.executeCommand('setTileView', true);

    // api.executeCommand('toggleChat');
    const {
      rooms: [room],
    } = await api.getRoomsInfo();
    if (room.participants?.length === 1) {
      conductor = true;
    }

    for (const participant of room.participants) {
      participants.add(participant.id);
    }
  });

  let dataChannelOpened = false;
  let cbs = [];

  api.addListener('dataChannelOpened', async () => {
    dataChannelOpened = true;
    let cb;
    while ((cb = cbs.shift())) {
      cb();
    }
  });

  api.addListener('participantLeft', async ({ id }) => {
    participants.delete(id);
  });

  api.addListener('participantJoined', async ({ id }) => {
    participants.add(id);
    if (conductor) {
      const tabs = (
        await chrome.tabs.query({
          windowId: browser,
        })
      ).map(({ id, title, url, active }) => ({ id, title, url, active }));
      for (const tab of tabs) {
        tabMap.set(tab.id, tab.id);
      }
      console.log('new participant joined, sending tabs', id);
      const sendTabs = () => {
        console.log('sending tabs', id, tabs);
        for (const tab of tabs) {
          console.log('sending tab', tab);
          api.executeCommand(
            'sendEndpointTextMessage',
            id,
            JSON.stringify({
              type: 'tab',
              tab,
            })
          );
        }
      };

      if (dataChannelOpened) {
        sendTabs();
      } else {
        cbs.push(sendTabs);
      }
    }
  });

  api.addListener('incomingMessage', async (message) => {
    console.log('got message', message);
    try {
      const json = JSON.parse(message.message);
      if (json.type === 'tabs') {
        const { tabs } = json;
        console.log('got tabs', tabs);
      }
    } catch (e) {
      console.log('not json', message.message);
    }
  });

  api.addListener('endpointTextMessageReceived', async (event) => {
    const {
      data: {
        eventData: { text },
      },
    } = event;
    console.log('got message', text);
    try {
      const json = JSON.parse(text);
      if (json.type === 'tab') {
        const { tab } = json;
        console.log('got tab', tab);
        const { id, url } = tab;
        if (tabMap.has(id)) {
          console.log('tab already exists', id);
          //update our local tab to match the remote tab
          const tabId = tabMap.get(id);
          const tab = await chrome.tabs.get(tabId);
          if (tab.url !== url) {
            await chrome.tabs.update(tabId, { url });
          }
        } else {
          const newTab = await chrome.tabs.create({
            windowId: browser,
            url,
            active: false,
          });
          console.log('new tab', newTab);
          tabMap.set(id, newTab.id);
          tabMap.set(newTab.id, id);
        }
      }
    } catch (e) {
      console.log('not json', text);
    }
  });

  chrome.webNavigation.onCompleted.addListener(
    async ({ tabId, url, frameId }) => {
      console.log('tab completed', tabId, url, frameId);
      if (frameId !== 0) {
        console.log('not main frame', frameId);
        return;
      }
      const tab = await chrome.tabs.get(tabId);
      if (tab.windowId !== browser) {
        console.log('not in browser window', tab.windowId, browser);
        return;
      }
      if (!tabMap.has(tabId)) {
        tabMap.set(tabId, tabId);
      }

      const id = tabMap.get(tabId);
      const active = tab.active;

      for (const participant of participants) {
        console.log('sending tab', tabId, url, participant);
        api.executeCommand(
          'sendEndpointTextMessage',
          participant,
          JSON.stringify({
            type: 'tab',
            tab: {
              id,
              url,
              active,
            },
          })
        );
      }
    }
  );
};
