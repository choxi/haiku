const electron        = require('electron')
const path            = require('path')
const url             = require('url')
const autoUpdater     = require("electron-updater").autoUpdater
const log             = require("electron-log")
const OauthGithub     = require('electron-oauth-github')
const fs              = require("fs")

import { app, BrowserWindow, Menu, ipcMain as ipc } from "electron"

global.app = app

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function openMenu() {
  let win = new BrowserWindow({
    width: 600,
    height: 500,
    frame: false
  })

  win.loadURL(`file://${__dirname}/menu.html`)

  return win
}

function login() {
  let config = require(path.join(__dirname, "..", "config", "config.json"))

  let github = new OauthGithub({
    id: config.github.client_id,
    secret: config.github.client_secret,
    scopes: ["admin:public_key"],
  })

  let tokenPath = path.join(app.getPath("appData"), "haiku", ".github_access_token")
  let token

  if(fs.existsSync(tokenPath)) {
    token = fs.readFileSync(tokenPath) 
    app.on("ready", createWindow)
  } else {
    github.startRequest(function(access_token, err) {
      if (err) log.error(err)
      fs.writeFileSync(tokenPath, access_token)

      createWindow()
    })
  }
}

login()

function createWindow () {
  ipc.on("open-instance", (event, params) => {
    let menu  = BrowserWindow.fromWebContents(event.sender)
    let win   = new BrowserWindow({ width: 800, height: 600, show: false })

    menu.close()

    win.loadURL(`file://${__dirname}/terminal.html`)
    win.webContents.on("did-finish-load", () => {
      win.webContents.send("open-instance", params)
      win.show()
    })
  })

  mainWindow = openMenu()
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  // Create Menubar
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New', accelerator: 'CmdOrCtrl+N', click: openMenu
        },
        {
          label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: (event) => {
            app.quit()
          }
        }
      ]
    },
    {
      label: "Edit",
      submenu: [
          { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
          { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
          { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
          { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
      ]
    },
    {
      label: "Developer",
      submenu: [
        {
          label: "Refresh", accelerator: 'CmdOrCtrl+R', click: (item, focusedWindow) => {
            focusedWindow.webContents.reload()
          }
        },
        {
          label: "Developer Tools", accelerator: 'CmdOrCtrl+Option+I', click: (item, focusedWindow) => {
            focusedWindow.webContents.toggleDevTools()
          }
        }
      ]
    }
  ]

  // Create the menubar
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

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
