import electron from 'electron';
import React, { ChangeEvent } from 'react';
import * as actions from '../actions';
import { RootState } from '../../../main/reducer';
import { Button, Checkbox, createStyles, Divider, IconButton, makeStyles, MenuItem, Paper, Select, TextField, Theme, ThemeProvider, Typography } from '@material-ui/core';
import theme from '../theme';

const ipcRenderer = electron.ipcRenderer;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: 10,
    },
    divider: {
      margin: 5,
    },
    lineItem: {
      display: 'flex',
      alignItems: 'center',
    },
    menuItem: {
      width: '100%',
      height: '100%',
      display: 'flex',
    },
    menuLabel: {
      width: 200,
    },
  }),
);

const App: React.FunctionComponent<RootState> = (props: RootState) => {
  const classes = useStyles();

  const twitchIdRef = React.useRef<HTMLTextAreaElement>(null);
  const keyIntervalRef = React.useRef<HTMLTextAreaElement>(null);
  const keyPressTimeRef = React.useRef<HTMLTextAreaElement>(null);
  const initialModeRef = React.useRef<HTMLTextAreaElement>(null);
  const modeVoteRef = React.useRef<HTMLInputElement>(null);
  const [commandToKeyList, setCommandToKeyList] = React.useState<{ command: string; key: string; enable: boolean }[]>(props.reducer.commandToKey);

  React.useEffect(() => {
    setCommandToKeyList(props.reducer.commandToKey);
  }, [JSON.stringify(props.reducer.commandToKey)]);

  const startServer = () => {
    const twitchId = twitchIdRef.current?.value as string;
    const keyInterval = Number(keyIntervalRef.current?.value as string);
    const keyPressTime = Number(keyPressTimeRef.current?.value as string);
    const initialMode = initialModeRef.current?.value as 'democracy' | 'anarchy' | 'random';
    const modeVote = modeVoteRef.current?.checked as boolean;

    ipcRenderer.send(
      'dispatch-store',
      actions.startServer({
        twitchId,
        initialMode,
        modeVote,
        keyInterval: Number(keyInterval),
        keyPressTime: Number(keyPressTime),
        commandToKey: commandToKeyList,
      }),
    );
  };
  const stopServer = () => ipcRenderer.send('dispatch-store', actions.stopServer());

  const changeCommandToKey = (index: number, val: 'command' | 'key') => (event: ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    commandToKeyList[index][val] = event.currentTarget.value;
    setCommandToKeyList(commandToKeyList);
  };
  const toggleCommandToKey = (index: number) => (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    commandToKeyList[index].enable = checked;
    setCommandToKeyList(commandToKeyList);
  };

  const createCommandToKeyList = () => {
    return (
      <>
        {commandToKeyList.map((value, index) => (
          <div className={classes.lineItem} key={`${index}`}>
            <TextField
              style={{ width: '200px' }}
              variant={'outlined'}
              defaultValue={value.command}
              disabled={props.reducer.start}
              onChange={changeCommandToKey(index, 'command')}
            />
            <TextField style={{ width: '200px' }} variant={'outlined'} defaultValue={value.key} disabled={props.reducer.start} onChange={changeCommandToKey(index, 'key')} />
            <Checkbox style={{ padding: 5 }} disabled={props.reducer.start} defaultChecked={value.enable} onChange={toggleCommandToKey(index)} />
          </div>
        ))}
      </>
    );
  };

  const sum = props.reducer.modeCount.democracy + props.reducer.modeCount.anarchy + props.reducer.modeCount.random;
  const demoPercent = sum === 0 ? '' : `(${Math.floor((props.reducer.modeCount.democracy / sum) * 100)}%)`;
  const anaPercent = sum === 0 ? '' : `(${Math.floor((props.reducer.modeCount.anarchy / sum) * 100)}%)`;
  const ranPercent = sum === 0 ? '' : `(${Math.floor((props.reducer.modeCount.random / sum) * 100)}%)`;

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root}>
        <div>
          <TextField variant={'outlined'} placeholder={'Twitch ID'} disabled={props.reducer.start} inputRef={twitchIdRef} defaultValue={props.reducer.twitch.id} />
          <Button variant={'contained'} size={'small'} color={'primary'} onClick={startServer} disabled={props.reducer.start}>
            起動
          </Button>
          <Button variant={'contained'} size={'small'} color={'primary'} onClick={stopServer} disabled={!props.reducer.start}>
            停止
          </Button>
        </div>

        <Divider className={classes.divider} />

        {/* 現在のモード */}
        <div style={{ display: props.reducer.start ? 'block' : 'none' }}>
          <Typography style={{ width: '200px' }} variant={'h3'}>
            {props.reducer.mode}
          </Typography>
          {/* 投票状況 */}
          <div style={{ display: props.reducer.start && props.reducer.modeVote ? 'block' : 'none' }}>
            <div className={classes.menuItem}>
              <div className={classes.menuLabel}>Democracy </div>
              <div>
                {props.reducer.modeCount.democracy} {demoPercent}
              </div>
            </div>
            <div className={classes.menuItem}>
              <div className={classes.menuLabel}>Anarchy </div>
              <div>
                {props.reducer.modeCount.anarchy} {anaPercent}
              </div>
            </div>
            <div className={classes.menuItem}>
              <div className={classes.menuLabel}>Random </div>
              <div>
                {props.reducer.modeCount.random} {ranPercent}
              </div>
            </div>
          </div>
        </div>

        <Divider className={classes.divider} />

        <div>
          {/* コマンド設定 */}
          <div style={{ maxHeight: 350, overflowY: 'scroll' }}>
            <div style={{ display: 'flex' }}>
              <Typography style={{ width: '200px' }} variant={'caption'}>
                chat command
              </Typography>
              <Typography style={{ width: '200px' }} variant={'caption'}>
                keyboard
              </Typography>
            </div>
            {createCommandToKeyList()}
          </div>

          <Divider className={classes.divider} />

          {/* その他 */}
          <div>
            <div className={classes.menuItem}>
              <Typography className={classes.menuLabel} variant={'body1'}>
                キー押下時間(ミリ秒)
              </Typography>
              <TextField variant={'outlined'} disabled={props.reducer.start} inputRef={keyPressTimeRef} defaultValue={props.reducer.keyPressTime} />
            </div>

            <div className={classes.menuItem}>
              <Typography className={classes.menuLabel} variant={'body1'}>
                キー投票間隔(ミリ秒)
              </Typography>
              <TextField variant={'outlined'} disabled={props.reducer.start} inputRef={keyIntervalRef} defaultValue={props.reducer.keyInterval} />
            </div>
            <div className={classes.menuItem}>
              <Typography className={classes.menuLabel} variant={'body1'}>
                モード初期値
              </Typography>
              <Select style={{ width: 200 }} disabled={props.reducer.start} inputRef={initialModeRef} defaultValue={props.reducer.initialMode}>
                <MenuItem value="democracy">Democracy</MenuItem>
                <MenuItem value="anarchy">Anarchy</MenuItem>
                <MenuItem value="random">Random</MenuItem>
              </Select>
            </div>
            <div className={classes.menuItem}>
              <Typography className={classes.menuLabel} variant={'body1'}>
                モード変更投票
              </Typography>
              <Checkbox disabled={props.reducer.start} inputRef={modeVoteRef} defaultChecked={props.reducer.modeVote} />
            </div>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;
