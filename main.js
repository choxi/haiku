var path = require('path');
var electronCompile = require('electron-compile');

let initScript = path.resolve(__dirname, 'index.js');
electronCompile.init(__dirname, initScript);
