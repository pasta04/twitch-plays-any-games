import electron from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './component/App';

const ipcRenderer = electron.ipcRenderer;

if ((module as any).hot) {
  (module as any).hot.accept();
}

ipcRenderer.on('render', (sender, state) => {
  console.log('[ipc][renderer] render');
  ReactDOM.render(React.createElement(App, state), document.getElementById('root'));
});
