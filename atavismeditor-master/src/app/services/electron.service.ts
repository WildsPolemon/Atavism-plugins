import {Injectable} from '@angular/core';
import {ipcRenderer, shell} from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface ElectronSettings {
  version: string;
  folder: string;
  serve: boolean;
  userDataPath: string;
}

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  public ipcRenderer: typeof ipcRenderer;
  public shell: typeof shell;
  public fs: typeof fs;
  public path: typeof path;
  public settings: ElectronSettings = {
    version: '',
    folder: '',
    serve: false,
    userDataPath: '',
  };
  public remote: any;

  constructor() {
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.shell = window.require('electron').shell;
      this.remote = window.require('@electron/remote');
      this.settings = this.remote.getGlobal('sharedSettings');
      this.fs = window.require('fs');
      this.path = window.require('path');
    }
  }

  public get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  public get isMacOS(): boolean {
    return this.isElectron && window.process.platform === 'darwin';
  }

  public get isWindows(): boolean {
    return this.isElectron && window.process.platform === 'win32';
  }

  public get isLinux(): boolean {
    return this.isElectron && window.process.platform === 'linux';
  }
}
