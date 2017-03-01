const electron      = require('electron')
const remote        = electron.remote
const app           = remote.getGlobal("app")
const EventEmitter  = require('events')

var AWS     = require("aws-sdk")
var uuid    = require("uuid/v4")
var glob    = require("glob")
var fs      = require("fs")
var config  = JSON.parse(fs.readFileSync(app.getAppPath() + "/config.json"))
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
    //   this.findOrCreateKey().then(startInstance)
    //                         .then(pollInstanceState)
    //                         .then(pollSSHServer)
    //                         .then(ready)

    this.findOrCreateKey().then(this.startInstance.bind(this))
                          .then(this.waitUntilRunning.bind(this))
                          .then(this.pollInstanceState.bind(this))
                          .then(this.pollSSHConnection.bind(this))
  }
  
  startInstance(keyName) {
    return new Promise((resolve, reject) => {
      if(this.params.reservation) {
        this.ec2.startInstances({InstanceIds: this.instanceIds(this.params.reservation)}, (err, data) => {
          if(err) log.error(err)
          this.reservation = this.params.reservation
          resolve()
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

  findOrCreateKey(callback) {
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

  //  Before we can SSH, we need to wait for:
  //
  //    - the EC2 reservation request to complete
  //    - the instance to change state to "running"
  //    - the instance to boot up its SSH server
  //
  waitUntilRunning() {
    return poll((callback) => {
      if(this.reservation === undefined) {
        callback(false)
      } else {
        log.info("Waiting for Instance to Start...")
        this.emit("starting")
        callback(true)
      }
    })
  }

  pollInstanceState() {
    return poll((callback) => {
      this.ec2.describeInstances({ InstanceIds: this.instanceIds() }, (err, data) => {
        this.reservation = data.Reservations[0]
        callback(instancesReady(this.reservation))
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

    let config = {
      host: this.reservation.Instances[0].PublicIpAddress,
      user: 'ec2-user',
      key: fs.readFileSync(this.keyPath()),
      timeout: 1000
    }
    let ssh = new SSH(config)

    ssh.exec("exit").start({
      success: function() {
        log.info("Instance Ready")
        this.emit("ready", this.keyPath(), this.reservation.Instances[0].PublicIpAddress)
      }.bind(this),
      fail: function(err) {
        if(err.message !== "Timed out while waiting for handshake" && err.code !== "ECONNREFUSED") {
          log.error(err)
        }
        this.pollSSHConnection()
      }.bind(this)
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

function instancesReady(reservation) {
  let ready = true

  for(let i=0; i < reservation.Instances.length; i++) {
    let instance = reservation.Instances[i]
    if(instance.State.Name !== "running") ready = false
  }

  return ready
}

module.exports = Instance 
