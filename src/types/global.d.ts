import { BrowserWindow } from 'electron';
import { Action } from 'typesafe-actions';

declare global {
  namespace electron {
    let mainWindow: BrowserWindow;
    let dispatchStore: (event: any, args: Action<any>) => void;
  }
}

export {};
