import { deprecated, getType } from 'typesafe-actions';
import { GlobalState, RootState } from '../../../main/reducer';
const createAction = deprecated.createAction;

const OPEN_NOTIFY = 'OPEN_NOTIFY';
const CLOSE_NOTIFY = 'CLOSE_NOTIFY';

/** state全読み込み */
export const loadState = createAction('LOAD_STATE', (action) => {
  return (state: RootState) => action(state);
});

/** 通知欄表示 */
export const changeNotify = createAction(OPEN_NOTIFY, (action) => {
  return (show: boolean, type: 'info' | 'warning' | 'error', message: string, closable?: boolean) => action({ show, type, message, closable: closable === false ? false : true });
});
/** 通知欄閉じる */
export const closeNotify = createAction(CLOSE_NOTIFY);

/** 起動 */
export const startServer = createAction('START_SERVER', (action) => {
  return (obj: { twitchId: string; keyInterval: number; keyPressTime: number; initialMode: GlobalState['mode']; modeVote: boolean; commandToKey: GlobalState['commandToKey'] }) =>
    action(obj);
});

export const applyServer = createAction('APPLY_SERVER', (action) => {
  return (obj: ReturnType<typeof startServer>['payload']) => action(obj);
});

/** 停止 */
export const stopServer = createAction('STOP_SERVER', (action) => {
  return () => action();
});

/** モード変更 */
export const changeMode = createAction('CHANGE_MODE', (action) => {
  return (obj: { mode: GlobalState['mode']; modeCount: GlobalState['modeCount'] }) => action(obj);
});

/** モード変更コマンド受付 */
export const receiveModeCommand = createAction('RECEIVE_MODE_COMMAND', (action) => {
  return (command: GlobalState['mode']) => action(command);
});

/** キー受付 */
export const receiveKey = createAction('RECEIVE_KEY', (action) => {
  return (obj: GlobalState['commandToKey'][0]) => action(obj);
});

/** democracyモードでのコマンド投票リセット */
export const resetDemocracyKeyVote = createAction('RESET_DEMOCRACY_KEY_VOTE', (action) => {
  return (commandList: string[]) => action(commandList);
});

/** democracyモードでのコマンド投票 */
export const updateDemocracyKeyVote = createAction('UPDATE_DEMOCRACY_KEY_VOTE', (action) => {
  return (obj: string) => action(obj);
});
