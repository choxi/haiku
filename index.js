const electron        = require('electron')
const app             = electron.app
const BrowserWindow   = electron.BrowserWindow
const path            = require('path')
const url             = require('url')
const autoUpdater     = require("electron-updater").autoUpdater
const log             = require("electron-log")

global.app = app

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function login() {
  // huge hack to make github oauth page work
  process.env.NODE_ENV = "production"

  let OauthGithub = require('electron-oauth-github');

  let github = new OauthGithub({
    id: process.env.GITHUB_CLIENT_ID,
    secret: process.env.GITHUB_CLIENT_SECRET,
    scopes: [],
  })

  github.startRequest(function(access_token, err) {
    if (err) log.error(err)
    process.env.NODE_ENV = undefined

    log.info(access_token)
  })
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    icon: './images/Logo - Sunrise - Small - Blue.png',
    width: 600,
    height: 400
  })

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  BrowserWindow.addDevToolsExtension("/Users/Choxi/Library/Application Support/Google/Chrome/Default/Extensions/fmkadmapgofadopljbjfkapdkoienihi/2.0.12_0")
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('App starting...')

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for update...');
})

autoUpdater.on('update-available', (ev, info) => {
  console.log('Update available.');
})

autoUpdater.on('update-not-available', (ev, info) => {
  console.log('Update not available.');
})

autoUpdater.on('error', (ev, err) => {
  console.log('Error in auto-updater.');
})

autoUpdater.on('download-progress', (ev, progressObj) => {
  console.log('Download progress...');
})

autoUpdater.on('update-downloaded', (ev, info) => {
  console.log('Update downloaded.  Will quit and install in 5 seconds.');

  // Wait 5 seconds, then quit and install
  setTimeout(function() {
    autoUpdater.quitAndInstall();  
  }, 5000)
})

// Wait a second for the window to exist before checking for updates.
setTimeout(function() {
  autoUpdater.checkForUpdates()  
}, 1000);
