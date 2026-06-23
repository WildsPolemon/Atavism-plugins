const ipcRenderer = require('electron').ipcRenderer;
const fs = window.require('fs');
const path = window.require('path');

const metaFileExtension = '.meta';
const allowedExceptions = ['.png', '.gif', '.jpg', '.jpeg', '.psd', '.tga', '.bmp'];

const checkFile = async (sender, folderFile, meta) => {
  try {
    if (path.extname(folderFile).toLowerCase() !== metaFileExtension) {
      return false;
    }
    const originalFile = folderFile.replace(metaFileExtension, '');
    const originalExtension = path.extname(originalFile);
    if (!allowedExceptions.includes(originalExtension.toLowerCase()) || !fs.existsSync(originalFile)) {
      return false;
    }
    const fileContent = await fs.readFileSync(folderFile, {encoding: 'utf-8'});
    return fileContent.toLowerCase().indexOf(meta.toLowerCase()) !== -1;
  } catch (e) {
    sender.send('sync-worker', {error: e, in_progress: false, done: true});
  }
};

const readFolder = async (sender, folder, meta) => {
  try {
    let result = [];
    const list = await fs.readdirSync(folder);
    for (const file of list) {
      const folderFile = path.resolve(folder, file);
      const fileStat = await fs.statSync(folderFile);
      if (fileStat && fileStat.isDirectory()) {
        const files = await readFolder(sender, folderFile, meta);
        result = [...result, ...files];
      } else {
        sender.send('sync-worker', {in_progress: true, done: false});
        if (meta.length === 0 || (await checkFile(sender, folderFile, meta))) {
          const checkedFile = folderFile.replace(metaFileExtension, '');
          const extension = path.extname(checkedFile);
          let relativePath = checkedFile.replace(folder, '');
          if (relativePath[0] === '/') {
            relativePath = relativePath.slice(1);
          }
          result.push({
            path: checkedFile,
            relative_path: relativePath,
            title: path.basename(checkedFile, extension),
            name: path.basename(checkedFile),
            ext: extension.replace('.', '').toLowerCase()
          });
        }
      }
    }
    return result;
  } catch (e) {
    sender.send('sync-worker', {error: e, in_progress: false, done: true});
  }
};

const startFunctionality = async (sender, profile) => {
  return await readFolder(sender, profile.folder, profile.meta);
};

ipcRenderer.on('start-worker', (event, message) => {
  event.sender.send('sync-worker', {in_progress: false, done: false});
  try {
    startFunctionality(event.sender, message).then((list) => {
      event.sender.send('sync-worker', {list, in_progress: false, done: true});
    });
  } catch (e) {
    event.sender.send('sync-worker', {error: e, in_progress: false, done: true});
  }
});
