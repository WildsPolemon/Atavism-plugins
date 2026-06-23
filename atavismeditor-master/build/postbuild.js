const fs = require('fs');
const packageVersion = JSON.parse(fs.readFileSync('electron-builder.json')).buildVersion;

fs.readFile('electron-builder.json', 'utf8', function(err, data) {
  if (err) {
    return console.warn(err);
  }
  let result = data.replace(packageVersion, '[VERSION]');
  result = result.replace(packageVersion, '[VERSION]');
  result = result.replace(packageVersion, '[VERSION]');
  result = result.replace(packageVersion, '[VERSION]');
  result = result.replace(packageVersion, '[VERSION]');
  result = result.replace(packageVersion, '[VERSION]');
  result = result.replace(packageVersion, '[VERSION]');
  result = result.replace(packageVersion, '[VERSION]');
  result = result.replace(packageVersion, '[VERSION]');
  fs.writeFile('electron-builder.json', result, 'utf8', function(err) {
    if (err) {
      return console.warn(err);
    }
  });
});
fs.readFile('src/index.html', 'utf8', function(err, data) {
  if (err) {
    return console.warn(err);
  }
  let result = data.replace(packageVersion, '[VERSION]');
  fs.writeFile('src/index.html', result, 'utf8', function(err) {
    if (err) {
      return console.warn(err);
    }
  });
});
fs.readFile('editor-version.txt', 'utf8', function(err, data) {
  if (err) {
    return console.warn(err);
  }
  let result = data.replace(packageVersion, '[VERSION]');
  fs.writeFile('editor-version.txt', result, 'utf8', function(err) {
    if (err) {
      return console.warn(err);
    }
  });
});
