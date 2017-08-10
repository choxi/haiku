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

import Api from "./api"

export default class Instance extends EventEmitter {
  constructor(params) {
    super()

    this.getStatus = this.getStatus.bind(this)

    this.params = params
    this.ec2 = new AWS.EC2(config.ec2)

    let accessTokenPath = app.getPath("appData") + "/Haiku/.github_access_token"
    this.github = new Github(fs.readFileSync(accessTokenPath))
  }

  detach(callback) {
    this.status = "detached"
    if(callback) callback()
  }

  createImage() {
    let name = "choxi/test-image"

    let params = {
      InstanceId: this.instanceIds()[0],
      Name: name,
      NoReboot: true
    }

    this.ec2.createImage(params, (err, data) => {
      if(err) console.log(err)

      let images = {}
      let path   = app.getPath("appData") + "/Haiku/images.json"

      if(fs.existsSync(path)) images = JSON.parse(fs.readFileSync(path))
      images[name] = { ImageId: data.ImageId } 
      fs.writeFileSync(path, JSON.stringify(images))
    })
  }

  create() {
    this.emit("creating")
    this.status = "running"

    log.info("Creating Instance...")

        this.startInstance()
        .then((instance) => this.pollInstanceState("running", instance))
        .then((instance) => this.pollSSHConnection(instance))
        .then(this.setupGit.bind(this))
        .then(function() { log.info("Done") })
  }

  startInstance() {
    return new Promise((resolve, reject) => {
      if(this.params.id) {
        this.ec2.describeInstances({ InstanceIds: this.instanceIds(this.params.reservation) }, (err, data) => {
          if(err) log.error(err)
          this.reservation = data.Reservations[0]

          // Check if still running
          if(instancesInState(this.reservation, "running"))
            resolve()
          else {
            this.pollInstanceState("stopped", this.params.reservation).then(() => {
              this.ec2.startInstances({InstanceIds: this.instanceIds(this.params.reservation)}, (err, data) => {
                if(err) log.error(err)
                this.reservation = this.params.reservation
                resolve()
              })
            })
          }
        })
      } else {
        let p = {
          name: this.params.name,
          image_id: this.params.ami,
          type: this.params.instanceType
        }

        Instance.api.post("/instances", p)
        .then((instance) => {
          resolve(instance)
        })
      }
    })
  }

  remove(callback) {
    if(!this.reservation) {
      log.warn("You tried to call .remove() but no reservation was set")
      this.status = "stopped"
      callback()
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

  pollInstanceState(state, instance) {
    let reloadedInstance

    return new Promise((resolve, reject) => {
      poll((ready) => {
        Instance.api.get(`/instances/${instance.id}`)
        .then((newInstance) => {
          reloadedInstance = newInstance
          ready(newInstance.state === state) 
        })
      })
      .then(() => {
        console.log(`Reloaded: ${reloadedInstance}`)
        resolve(reloadedInstance)
      })
    })
  }

  keyPath() {
    return this.appDataPath() + "/Haiku.pem"
  }

  appDataPath() {
    return app.getPath("appData") + "/Haiku"
  }

  pollSSHConnection(instance) {
    this.emit("connecting")
    log.info("Waiting for SSH Connection...")

    return poll((ready) => {
      let config = {
        host: instance.public_ip_address,
        user: 'ec2-user',
        key: fs.readFileSync(this.keyPath()),
        timeout: 1000
      }

      let ssh = new SSH(config)

      ssh.exec("exit").start({
        success: () => {
          log.info("Instance Ready")
          this.emit("ready", this.keyPath(), instance.public_ip_address)
          ready(true)
        },
        fail: (err) => {
          if(err.message !== "Timed out while waiting for handshake" && err.code !== "ECONNREFUSED") {
            log.error(err)
          }

          ready(false)
        }
      })
    })
  }

  setupGit() {
    log.info("Setup Git")
    return new Promise((resolve, reject) => {
      let ssh             = new NodeSSH()
      let keyName         = "Haiku-" + this.params.name.replace(/ /g, "")

      let sshConfig  = {
        host: this.reservation.Instances[0].PublicIpAddress,
        username: 'ec2-user',
        privateKey: fs.readFileSync(this.keyPath()).toString()
      }

      ssh.connect(sshConfig).then(() => {
        ssh.execCommand(`cat ~/.ssh/${keyName}.pub`).then((result) => {
          if(result.stdout) this.github.findOrCreateKey(keyName, result.stdout).then(resolve)
          else {
            log.info("Creating a new key")
            ssh.connect(sshConfig).then(() => {
              let command = `rm ~/.ssh/${keyName}* 2> /dev/null*;` +
                            `ssh-keygen -t rsa -N '' -f ~/.ssh/${keyName}` +
                            `&& echo 'Host github.com\n  IdentityFile ~/.ssh/${keyName}'` +
                            ` >> ~/.ssh/config && chmod 600 ~/.ssh/config`

              ssh.exec(command).then((response) => {
                ssh.exec(`cat ~/.ssh/${keyName}.pub`).then((response) => {
                  this.github.findOrCreateKey(keyName, response).then(resolve)
                })
              })
            })
          }
        })
      })
    })
  }

  terminate() {
    return new Promise((resolve, reject) => {
      let ids = this.instanceIds(this.params.reservation)
      this.ec2.terminateInstances({InstanceIds: ids}, (err, data) => {
        if(err) log.error(err)
        log.info(`Terminated Instance: ${this.params.name}`)

        Reservation.destroy(this.params.name)
        this.github.deleteKey("Haiku-" + this.params.name).then(resolve)
      })
   })
  }

  getStatus() {
    return new Promise((resolve, reject) => {
      this.ec2.describeInstances({ InstanceIds: this.instanceIds(this.params.reservation) }, (err, data) => {
        let instance = data.Reservations[0].Instances[0]
        resolve(instance.State.Name) 
      })
    })
  }
}

Instance.api = new Api()

Instance.all = () => {
  return new Promise((resolve, reject) => {
    Instance.api.get("/instances")
    .then((instances) => {
      resolve(instances.map((instance) => new Instance(instance)))
    })
  })
}

////////////////////////////////////////////////////////////////////////
// Helpers
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
