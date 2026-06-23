import {app, BrowserWindow, ipcMain, Menu, screen} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as url from 'url';

require('@electron/remote/main').initialize();

const log = require('electron-log');
const appConfig = require('electron-settings');
let lockFile = '';
const logFileName = `AtavismEditor_base_${app.getVersion()}`;
const userDataFolder = app.getPath('userData');
log.transports.file.level = 'info';
log.transports.file.maxSize = 5 * 1024 * 1024; // should be 5MB
log.transports.file.resolvePath = () => path.join(userDataFolder, `/logs/${logFileName}.log`);
log.transports.file.archiveLog = (file: string) => {
  file = file.toString();
  const info = path.parse(file);
  try {
    const files = fs.readdirSync(info.dir);
    let lastUsed = 0;
    for (const logFile of files) {
      if (logFile.indexOf(logFileName) !== -1) {
        const logFileInfo = path.parse(logFile);
        let neededThings = logFileInfo.base.replace(logFileName, '');
        if (neededThings !== logFileInfo.ext) {
          neededThings = neededThings.replace(logFileInfo.ext, '');
          lastUsed = +neededThings.replace('_', '');
          if (isNaN(lastUsed)) {
            lastUsed = parseInt(neededThings, 10);
          }
          lastUsed++;
        }
      }
    }
    let archiveFile = path.join(info.dir, info.name + '_' + lastUsed + info.ext);
    if (fs.existsSync(archiveFile)) {
      archiveFile = path.join(info.dir, info.name + '_' + (lastUsed + 1) + info.ext);
    }
    fs.renameSync(file, archiveFile);
  } catch (e) {
    log.error('Could not rotate log', e);
  }
};

let mainWindow: BrowserWindow | undefined, workerWindow: BrowserWindow | undefined, serve: boolean;
const args = process.argv.slice(1);
const projectPath = args.find((arg) => arg.indexOf('projectpath=') !== -1);
serve = args.some((val) => val === '--serve');
// @ts-ignore
global.sharedSettings = {
  version: app.getVersion(),
  folder: projectPath ? projectPath.replace('projectpath=', '') : '',
  serve,
  userDataPath: userDataFolder,
};
function createWindow() {
  try {
    const mainWindowStateKeeper = windowStateKeeper('9df9fsd-c170095d');
    mainWindow = new BrowserWindow({
      x: mainWindowStateKeeper.x,
      y: mainWindowStateKeeper.y,
      width: mainWindowStateKeeper.width,
      height: mainWindowStateKeeper.height,
      backgroundColor: '#2d323e',
      enableLargerThanScreen: true,
      webPreferences: {
        nodeIntegration: true,
        allowRunningInsecureContent: !!serve,
        contextIsolation: false,
      },
    });
    if (mainWindowStateKeeper.isFullscreen) {
      mainWindow.maximize();
    }
    mainWindowStateKeeper.track(mainWindow);

    require('@electron/remote/main').enable(mainWindow.webContents);
    if (serve) {
      mainWindow.webContents.openDevTools();
      require('electron-reload')(__dirname, {
        electron: require(path.join(__dirname, '/../node_modules/electron')),
      });
      mainWindow.loadURL('http://localhost:4200');
    } else {
      // Path when running electron executable
      let pathIndex = './index.html';
      if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
        // Path when running electron in local folder
        pathIndex = '../dist/index.html';
      }
      mainWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, pathIndex),
          protocol: 'file:',
          slashes: true,
        }),
      );
    }
    mainWindow.on('closed', () => {
      try {
        if (lockFile.length > 0 && fs.existsSync(lockFile)) {
          fs.unlinkSync(lockFile);
        }
      } catch (e) {
        log.error(e);
      }
      mainWindow = undefined;
    });
    Menu.setApplicationMenu(null);
    mainWindow.setMenuBarVisibility(false);
    mainWindow.webContents.once('did-finish-load', () => {
      if (mainWindow) {
        mainWindow.setMenuBarVisibility(false);
        mainWindow.removeMenu();
        mainWindow.setMenu(null);
      }
    });
  } catch (e) {
    log.error(e.message, e.name, e);
  }
}

function createWorkerWindow(message: any) {
  try {
    workerWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: true,
        nodeIntegrationInWorker: true,
        contextIsolation: false,
      },
    });
    const startingFile = 'worker/index.html';
    workerWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, startingFile),
        protocol: 'file:',
        slashes: true,
      }),
    );
    workerWindow.webContents.openDevTools();
    workerWindow.on('closed', () => (workerWindow = undefined));
    setTimeout(() => {
      (workerWindow as BrowserWindow).webContents.send('start-worker', message);
    }, 2000);
  } catch (e) {
    log.error(e.message, e.name, e);
  }
}
function windowStateKeeper(windowName: string) {
  const size = screen.getPrimaryDisplay().workAreaSize;
  interface WindowKeeperState {
    x: number;
    y: number;
    width: number;
    height: number;
    isFullscreen?: boolean;
  }
  let window: BrowserWindow, windowState: WindowKeeperState;

  function setBounds() {
    const windowConfig = appConfig.getSync(`windowState.${windowName}`);
    if (windowConfig) {
      return windowConfig;
    }
    return {
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
      isFullscreen: false,
    };
  }
  function saveState() {
    try {
      if (!windowState.isFullscreen) {
        windowState = window.getBounds();
      }
      windowState.isFullscreen = window.isMaximized();
      appConfig.setSync(`windowState.${windowName}`, windowState as any);
    } catch (e) {
      log.error(e.message, e.name, e);
    }
  }
  function track(win: BrowserWindow) {
    try {
      window = win;
      ['resize', 'move', 'close'].forEach((event) => {
        // @ts-ignore
        win.on(event, saveState);
      });
    } catch (e) {
      log.error(e.message, e.name, e);
    }
  }
  windowState = setBounds();
  return {
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    isFullscreen: windowState.isFullscreen,
    track,
  };
}
function makeSingleInstance() {
  if (process.mas) {
    return;
  }
  app.requestSingleInstanceLock();
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

try {
  app.on('ready', () => {
    makeSingleInstance();
    createWindow();
  });
  let link = '';
  app.on('open-url', (event, data) => {
    event.preventDefault();
    link = data;
  });
  app.setAsDefaultProtocolClient('atavism');
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
  ipcMain.on('start-sync-worker', (event, message) => {
    event.sender.send('sync-worker', {in_progress: 0, done: false});
    createWorkerWindow(message);
  });
  ipcMain.on('cancel-sync-worker', (event) => {
    if (workerWindow) {
      event.sender.send('sync-worker', {list: [], done: true});
      workerWindow.close();
      workerWindow = undefined;
    }
  });
  ipcMain.on('sync-worker', (_, message) => {
    if (mainWindow) {
      mainWindow.webContents.send('sync-worker-next', message);
      if (message.done && workerWindow) {
        workerWindow.close();
        workerWindow = undefined;
      }
    } else if (workerWindow) {
      workerWindow.close();
      workerWindow = undefined;
    }
  });
  ipcMain.on('lock_file_update', (_, params) => {
    lockFile = params.lockFile;
  });
  ipcMain.on('restart_app', () => {
    app.relaunch();
    app.exit();
  });
  module.exports.getLink = () => link;
} catch (e) {
  log.error(e.message, e.name, e);
}
