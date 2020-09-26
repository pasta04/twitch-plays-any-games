import { select, call, put, take, takeEvery, race, fork } from 'redux-saga/effects';
import storage from 'electron-json-storage';
import log from 'electron-log';
import { ChatClient } from 'dank-twitch-irc';
import * as actions from '../../renderer/renderer/actions';
import { GlobalState, RootState } from '../reducer';
import inputKey from './key';
import { initial } from '../reducer';

export default function* rootSaga() {
  yield takeEvery(actions.closeNotify, closeNotify);
  yield takeEvery(actions.startServer, startServer);
  yield takeEvery(actions.stopServer, stopServer);
  yield takeEvery(actions.receiveKey, receiveKey);
  yield takeEvery(actions.receiveModeCommand, receiveModeCommand);
}

function* saveState() {
  try {
    console.log(`[intervalSave] ${storage.getDataPath()}`);
    const state: RootState = yield select();

    storage.set(
      'state',
      {
        ...state,
        reducer: {
          ...state.reducer,
          start: initial.start,
          modeCount: initial.modeCount,
        },
      },
      (e) => {
        if (e) console.error(e);
      },
    );
  } catch (error) {
    yield call(errorHandler, error);
  }
}

export const sleep = (msec: number) => new Promise((resolve) => setTimeout(resolve, msec));

function* errorHandler(error: any) {
  try {
    const message = (error.message as string) || '予期せぬエラーが発生しました。';
    yield put(actions.changeNotify(true, 'error', message));
  } catch (e) {
    console.error('★激辛だ★');
  }
}

let twitchChat: ChatClient;
function* startServer(action: ReturnType<typeof actions.startServer>) {
  try {
    console.log('[saga] startServer');
    console.log(action.payload);
    globalThis.electron.mainWindow.setTitle(`Twitch Plays Any Games - ${action.payload.initialMode}`);

    const modeList: GlobalState['mode'][] = ['democracy', 'anarchy', 'random'];

    const commandList = action.payload.commandToKey.map((value) => value.command.toLowerCase().trim());
    const keyList = action.payload.commandToKey.map((value) => value.key.toLowerCase().trim());

    if (!action.payload.twitchId) throw new Error('Twitch ID未指定');

    if (twitchChat) twitchChat.destroy();
    twitchChat = new ChatClient();
    twitchChat.connect();
    twitchChat.join(action.payload.twitchId);

    // 接続完了
    twitchChat.on('ready', () => {
      log.info('[Twitch] Successfully connected to chat');
    });

    // チャット受信
    twitchChat.on('PRIVMSG', (msg) => {
      log.info(`[Twitch] comment received`);
      // log.info(JSON.stringify(msg, null, '  '));
      const text = msg.messageText.toLowerCase().trim();
      console.log(`modeVote: ${action.payload.modeVote}`);
      if (action.payload.modeVote && modeList.includes(text as any)) {
        globalThis.electron.dispatchStore({}, actions.receiveModeCommand(text as any));
      } else {
        const item = action.payload.commandToKey.filter((val) => val.command.toLowerCase().trim() === text.toLowerCase().trim() && val.enable);
        if (item.length > 0) {
          globalThis.electron.dispatchStore({}, actions.receiveKey(item[0]));
        }
      }
    });

    // なんかエラーがあった
    twitchChat.on('error', (event) => {
      log.error(`[Twitch] ${JSON.stringify(event)}`);
    });

    twitchChat.on('close', (event) => {
      log.info('[Twitch] close');
    });

    yield put(actions.applyServer(action.payload));
    yield put(actions.changeMode({ mode: action.payload.initialMode, modeCount: initial.modeCount }));
    yield call(saveState);

    let isContinue = true;
    while (isContinue) {
      const state: RootState = yield select();
      if (state.reducer.start) {
        let key = '';
        switch (state.reducer.mode) {
          case 'democracy': {
            // 投票の多いものを実行
            const sorted = Object.entries(state.reducer.democracyCount).sort((a, b) => {
              if (a[1] < b[1]) return 1;
              if (a[1] > b[1]) return -1;
              return 0;
            });
            // 1位も0票ならスキップ
            if (sorted[0][1] > 0) {
              const command = sorted[0][0];
              key = action.payload.commandToKey.filter((item) => item.command === command)[0].key;
            }
            break;
          }
          case 'random': {
            key = pickRandom(keyList);
            break;
          }
        }
        if (key) {
          inputKey(key, state.reducer.keyPressTime);
          if (state.reducer.mode === 'democracy') yield put(actions.resetDemocracyKeyVote(commandList));
        }

        yield call(sleep, action.payload.keyInterval);
      } else {
        isContinue = false;
      }
    }
  } catch (e) {
    yield call(errorHandler, e);
    yield put(actions.stopServer());
  }
}

function* stopServer() {
  try {
    if (twitchChat) {
      twitchChat.close();
      twitchChat.destroy();
      twitchChat = null as any;
    }
    globalThis.electron.mainWindow.setTitle('Twitch Plays Any Games');
  } catch (error) {
    yield call(errorHandler, error);
  }
}

function* closeNotify() {
  try {
    console.log('[closeNotify] some function...');
  } catch (error) {
    yield call(errorHandler, error);
  }
}

const pickRandom = (list: string[]) => {
  return list[Math.floor(Math.random() * list.length)];
};

function* receiveKey(action: ReturnType<typeof actions.receiveKey>) {
  try {
    const state: RootState = yield select();
    log.info(`[receiveKey] mode: ${state.reducer.mode} command: ${action.payload.command}`);

    switch (state.reducer.mode) {
      case 'anarchy': {
        inputKey(action.payload.key, state.reducer.keyPressTime);
        break;
      }
      case 'democracy': {
        yield put(actions.updateDemocracyKeyVote(action.payload.command));
        break;
      }
    }
  } catch (error) {
    yield call(errorHandler, error);
  }
}

function* receiveModeCommand(action: ReturnType<typeof actions.receiveModeCommand>) {
  try {
    console.log(`[receiveModeCommand] ${action.payload}`);
    const inputMode = action.payload;
    const state: RootState = yield select();
    const commandList = state.reducer.commandToKey.map((value) => value.command);

    const modeCount = {
      ...state.reducer.modeCount,
      [inputMode]: state.reducer.modeCount[inputMode] + 1,
    };
    // console.log(JSON.stringify(modeCount, null, '  '));
    let mode = state.reducer.mode;
    switch (inputMode) {
      case 'democracy': {
        if (modeCount.democracy >= modeCount.anarchy && modeCount.democracy >= modeCount.random) {
          mode = 'democracy';
          yield put(actions.resetDemocracyKeyVote(commandList));
        }
        break;
      }
      case 'anarchy': {
        if (modeCount.anarchy >= modeCount.democracy && modeCount.anarchy >= modeCount.random) {
          mode = 'anarchy';
          yield put(actions.resetDemocracyKeyVote(commandList));
        }
        break;
      }
      case 'random': {
        if (modeCount.random >= modeCount.anarchy && modeCount.random >= modeCount.democracy) {
          mode = 'random';
          yield put(actions.resetDemocracyKeyVote(commandList));
        }
        break;
      }
    }

    globalThis.electron.mainWindow.setTitle(`Twitch Plays Any Games - ${mode}`);
    yield put(
      actions.changeMode({
        mode,
        modeCount,
      }),
    );
  } catch (error) {
    yield call(errorHandler, error);
  }
}
