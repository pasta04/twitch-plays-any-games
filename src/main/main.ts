// Electronのモジュール
import path from 'path';
import electron, { dialog, ipcMain } from 'electron';
import log from 'electron-log';
import configureStore from './store';
import storage from 'electron-json-storage';
import * as actions from '../renderer/renderer/actions';
import { Action } from 'typesafe-actions';
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('electron-reload')(__dirname, {
  electron: path.join(__dirname, 'node_modules', '.bin', 'electron'),
});

process.on('uncaughtException', (err) => {
  log.error(err);
});

const app = electron.app;

// 多重起動防止
if (!app.requestSingleInstanceLock()) {
  log.error('[app] It is terminated for multiple launches.');
  app.quit();
} else {
  log.info('[app] started');

  app.allowRendererProcessReuse = true;

  // メインウィンドウはGCされないようにグローバル宣言
  globalThis.electron = {
    mainWindow: null as any,
    dispatchStore: null as any,
  };

  // Electronの初期化完了後に実行
  app.on('ready', () => {
    // ウィンドウサイズを（フレームサイズを含まない）設定
    const mainWin = new electron.BrowserWindow({
      width: 600,
      height: 600,

      useContentSize: true,
      webPreferences: {
        nodeIntegration: true,
      },
      // skipTaskbar: true,
    });
    globalThis.electron.mainWindow = mainWin;

    mainWin.setTitle('Twitch Plays Any Games');
    mainWin.setMenu(null);

    // レンダラーで使用するhtmlファイルを指定する
    mainWin.loadURL(path.resolve(__dirname, '../src/html/index.html'));

    // ウィンドウが閉じられたらアプリも終了
    mainWin.on('close', (event) => {
      // 確認ダイアログではいをクリックしたら閉じる
      event.preventDefault();
      dialog
        .showMessageBox(mainWin, {
          type: 'question',
          buttons: ['Yes', 'No'],
          // title: '',
          message: '終了しますか？',
        })
        .then((value) => {
          if (value.response === 0) {
            app.exit();
          }
        });
    });
    mainWin.on('closed', () => {
      log.info('[app] close');
      app.exit();
    });

    // 開発者ツールを開く
    // mainWin.webContents.openDevTools();

    // Mainプロセスが持ってるStore
    const store = configureStore();
    const render = () => {
      // log.info('[main][render]');
      // log.info(JSON.stringify(store, null, '  '));
      globalThis.electron.mainWindow.webContents.send('render', store.getState());
    };

    /**
     * 発行されたActionを適用して再レンダリング
     */
    const dispathStore = (event: any, args: Action<any>) => {
      store.dispatch(args);
      render();
    };
    globalThis.electron.dispatchStore = dispathStore;
    ipcMain.on('dispatch-store', dispathStore);

    // 初期state読み込み
    storage.get('state', (e, data) => {
      // console.log(JSON.stringify(data, null, '  '));
      if (Object.keys(data).length > 0) {
        const action = actions.loadState(data as any);
        dispathStore({}, action);
      }
      if (e) {
        console.warn(e);
      }
    });

    // 初回レンダリング
    mainWin.webContents.on('dom-ready', render);

    // MainプロセスからActionを発行して更新するサンプル
    // let i = 0;
    // setInterval(() => {
    //   console.log(i);
    //   i += 1;
    //   const action = actions.changeNotify(true, 'info', `Mainプロセスによる自動更新: ${i}`);
    //   dispathStore({}, action);
    // }, 5000);
  });
}
