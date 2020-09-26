import { combineReducers } from 'redux';
import { ActionType, getType } from 'typesafe-actions';
import * as actions from '../../renderer/renderer/actions';
type Action = ActionType<typeof actions>;

export type GlobalState = {
  /** 通知欄 */
  notify: {
    /** 表示可否 */
    show: boolean;
    /** 色 */
    type: 'info' | 'warning' | 'error';
    /** メッセージ */
    message: string;
    /** 手動で閉じられるか */
    closable: boolean;
  };
  /** 起動中 */
  start: boolean;
  /** Twitchの情報 */
  twitch: {
    id: string;
  };
  /**
   * キー入力の種別
   * - democracy: 一定時間内に入力されたキーを採用
   * - anarchy: 受信したキーを全て採用
   * - random: ランダムにキー入力
   */
  mode: 'democracy' | 'anarchy' | 'random';
  initialMode: 'democracy' | 'anarchy' | 'random';
  /** モード変更の投票を有効にする */
  modeVote: boolean;
  /** モードごとの投票数 */
  modeCount: {
    democracy: number;
    anarchy: number;
    random: number;
  };
  /** democracy、randomの時のキー入力間隔。ミリ秒 */
  keyInterval: number;
  /**
   * democracyにおけるコマンドごとのカウント。
   * @example { up: 0, dowon: 1 }
   */
  democracyCount: {
    [command: string]: number;
  };
  /**
   * チャットコマンドと、実際に入力されるキーボードの対応
   */
  commandToKey: {
    command: string;
    key: string;
    enable: boolean;
  }[];
  /** キーを押している時間 */
  keyPressTime: number;
};

export type RootState = {
  reducer: GlobalState;
};

export const initial: GlobalState = {
  notify: {
    show: false,
    type: 'info',
    message: 'ここが更新されるよ',
    closable: true,
  },
  start: false,
  twitch: {
    id: '',
  },
  mode: 'anarchy',
  initialMode: 'anarchy',
  modeVote: true,
  modeCount: {
    democracy: 0,
    anarchy: 0,
    random: 0,
  },
  keyInterval: 1000,
  democracyCount: {},
  commandToKey: [
    { command: 'up', key: '↑', enable: true },
    { command: 'left', key: '←', enable: true },
    { command: 'down', key: '↓', enable: true },
    { command: 'right', key: '→', enable: true },
    { command: 'A', key: '1', enable: true },
    { command: 'B', key: '2', enable: true },
    { command: 'mic', key: '3', enable: true },
    { command: 'select', key: '4', enable: true },
    { command: 'start', key: '5', enable: true },
    { command: 'X', key: '', enable: false },
    { command: 'Y', key: '', enable: false },
    { command: 'L', key: '', enable: false },
    { command: 'R', key: '', enable: false },
    { command: 'Z', key: '', enable: false },
    { command: '', key: '', enable: false },
  ],
  keyPressTime: 50,
};

const reducer = (state: GlobalState = initial, action: Action): GlobalState => {
  // console.log(action);

  switch (action.type) {
    case getType(actions.changeNotify): {
      return { ...state, notify: { ...action.payload } };
    }
    case getType(actions.closeNotify): {
      return { ...state, notify: { ...state.notify, show: false } };
    }
    case getType(actions.loadState): {
      return action.payload.reducer;
    }
    case getType(actions.applyServer): {
      return {
        ...state,
        start: true,
        mode: action.payload.initialMode,
        initialMode: action.payload.initialMode,
        modeVote: action.payload.modeVote,
        commandToKey: action.payload.commandToKey,
        keyInterval: action.payload.keyInterval,
        keyPressTime: action.payload.keyPressTime,
        twitch: {
          id: action.payload.twitchId,
        },
      };
    }
    case getType(actions.stopServer): {
      return {
        ...state,
        start: false,
      };
    }
    case getType(actions.changeMode): {
      return { ...state, mode: action.payload.mode, modeCount: action.payload.modeCount };
    }
    case getType(actions.resetDemocracyKeyVote): {
      const democracyCount: GlobalState['democracyCount'] = {};
      action.payload.map((command) => {
        democracyCount[command] = 0;
      });
      return {
        ...state,
        democracyCount,
      };
    }
    case getType(actions.updateDemocracyKeyVote): {
      return {
        ...state,
        democracyCount: {
          ...state.democracyCount,
          [action.payload]: state.democracyCount[action.payload] + 1,
        },
      };
    }
    default:
      return state;
  }
};

export default combineReducers({ reducer });
