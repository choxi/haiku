const electron      = require('electron')
const remote        = electron.remote
const app           = remote.getGlobal("app")
const EventEmitter  = require('events')
const path          = require('path')
const NodeSSH       = require("node-ssh")
const Github        = require("./github.js")
const Reservation   = require("./reservation.js")

var AWS     = require("aws-sdk")
var uuid    = require("uuid/v4")
var glob    = require("glob")
var fs      = require("fs")
var config  = require(path.join(__dirname, "..", "..", "config", "config.json"))
var SSH     = require("simple-ssh")
var log     = require('electron-log')

class Instance extends EventEmitter {
  constructor(params) {
    super()

    this.params = params
    this.ec2    = new AWS.EC2(config.ec2)

    return this
  }

  create() {
    this.emit("creating")
    this.status = "running"

    log.info("Creating Instance...")

    this.findOrCreateKey().then(this.startInstance.bind(this))
                          .then(() => { this.pollInstanceState("running") })
                          .then(this.pollSSHConnection.bind(this))
                          .then(this.setupGit.bind(this))
                          .then(function() { log.info("Done") })
  }
  
  startInstance(keyName) {
    return new Promise((resolve, reject) => {
      if(this.params.reservation) {
        this.pollInstanceState("stopped", this.params.reservation).then(() => {
          this.ec2.startInstances({InstanceIds: this.instanceIds(this.params.reservation)}, (err, data) => {
            if(err) log.error(err)
            this.reservation = this.params.reservation
            resolve()
          })
        })
      } else {
        let p = {
          ImageId: this.params.ami,
          InstanceType: "t2.micro",
          MaxCount: 1,
          MinCount: 1,
          KeyName: keyName,
          SecurityGroupIds: ["sg-c64bf0a1"]
        }

        this.ec2.runInstances(p, (err, data) => {
          if (err) log.error(err, err.stack) // an error occurred
          else {
            this.reservation = data
            resolve()
          }
        })
      }
    })
  }

  findOrCreateKey() {
    return new Promise((resolve, reject) => {
      var keyFiles = glob.sync(this.appDataPath() + "/*.pem")

      if(keyFiles.length > 0) {
        let paths     = keyFiles[0].split("/")
        this.keyName  = paths[paths.length - 1].match(/(.+)\.pem/)[1]

        resolve(this.keyName)
      } else {
        this.createAndSaveKeyPair(resolve, reject)
      }
    })
  }

  createAndSaveKeyPair(resolve, reject) {
    var keyId   =  uuid()
    var keyName = "Haiku-" + keyId

    this.ec2.createKeyPair({ KeyName: keyName }, (err, data) => {
      if (err) log.error(err, err.stack)
      else {
        fs.writeFile(this.appDataPath() + "/" + keyName + ".pem", data.KeyMaterial, {mode: "400"}, (err) => {
          if(err) return log.error(err)
          this.keyName = keyName
          resolve(keyName)
        })
      }
    })
  }

  remove(callback) {
    if(!this.reservation) {
      log.warn("You tried to call .remove() but no reservation was set")
      return
    }

    log.info("Stopping Instance")
    this.ec2.stopInstances({ InstanceIds: this.instanceIds() }, (err, data) => {
      if(err) log.error(err)

      let reservations = {}
      let path = app.getPath("appData") + "/Haiku/reservations.json"
      if(fs.existsSync(path)) reservations = JSON.parse(fs.readFileSync(path))
      reservations[this.params.name] = this.reservation
      fs.writeFileSync(path, JSON.stringify(reservations))

      this.status = "stopped"
      callback()
    })
  }

  instanceIds(r) {
    var instanceIds = []
    let reservation = r || this.reservation

    for(let i=0; i < reservation.Instances.length; i++) {
      let instance = reservation.Instances[i]
      instanceIds.push(instance.InstanceId)
    }

    return instanceIds
  }

  pollInstanceState(state, r) {
    let reservation = r || this.reservation

    return poll((ready) => {
      this.ec2.describeInstances({ InstanceIds: this.instanceIds(reservation) }, (err, data) => {
        this.reservation = data.Reservations[0]
        ready(instancesInState(this.reservation, state))
      })
    })
  }

  keyPath() {
    return this.appDataPath() + "/" + this.keyName + ".pem"
  }
  
  appDataPath() {
    return app.getPath("appData") + "/Haiku"
  }

  pollSSHConnection() {
    this.emit("connecting")
    log.info("Waiting for SSH Connection...")

    return poll(function(ready) {

      let config = {
        host: this.reservation.Instances[0].PublicIpAddress,
        user: 'ec2-user',
        key: fs.readFileSync(this.keyPath()),
        timeout: 1000
      }
      let ssh = new SSH(config)
 
      ssh.exec("exit").start({
        success: () => {
          log.info("Instance Ready")
          this.emit("ready", this.keyPath(), this.reservation.Instances[0].PublicIpAddress)
          ready(true)
        },
        fail: (err) => {
          if(err.message !== "Timed out while waiting for handshake" && err.code !== "ECONNREFUSED") {
            log.error(err)
          }

          ready(false)
        }
      })
    }.bind(this))
  }

  setupGit() {
    log.info("Setup Git")
    return new Promise((resolve, reject) => {
      let ssh             = new NodeSSH()
      let accessTokenPath = app.getPath("appData") + "/Haiku/.github_access_token"
      let github          = new Github(fs.readFileSync(accessTokenPath))
      let keyName         = "Haiku-" + this.params.name 

      let sshConfig  = {
        host: this.reservation.Instances[0].PublicIpAddress,
        username: 'ec2-user',
        privateKey: fs.readFileSync(this.keyPath()).toString()
      }

      ssh.connect(sshConfig).then(() => {
        ssh.execCommand(`cat ~/.ssh/${keyName}.pub`).then((result) => {
          if(result.stdout) github.findOrCreateKey(keyName, result.stdout).then(resolve)
          else {
            log.info("Creating a new key")
            ssh.connect(sshConfig).then(() => {
              ssh.exec(`rm ~/.ssh/${keyName}* 2> /dev/null*; ssh-keygen -t rsa -N '' -f ~/.ssh/${keyName} && echo 'Host github.com\n  IdentityFile ~/.ssh/${keyName}' >> ~/.ssh/config && chmod 600 ~/.ssh/config`).then((response) => {
                ssh.exec(`cat ~/.ssh/${keyName}.pub`).then((response) => {
                  github.findOrCreateKey(keyName, response).then(resolve)
                })
              })
            })
          }
        })
      })
    })
  }

  terminate() {
    let ids = this.instanceIds(this.params.reservation)
    this.ec2.terminateInstances({InstanceIds: ids}, (err, data) => {
      if(err) log.error(err)
      log.info(`Terminated Instance: ${this.params.name}`)

      Reservation.destroy(this.params.name)
    })
  }
}

function poll(callback) {
  return new Promise((resolve, reject) => {
    function _poll() {
      callback(function(ready) {
        if(ready)
          resolve()
        else {
          setTimeout(_poll, 1000)
        }
      })
    } 

    _poll()
  })
}

function instancesInState(reservation, state) {
  let ready = true

  for(let i=0; i < reservation.Instances.length; i++) {
    let instance = reservation.Instances[i]
    if(instance.State.Name !== state) ready = false
  }

  return ready
}

module.exports = Instance 
