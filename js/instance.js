const electron      = require('electron')
const remote        = electron.remote
const app           = remote.getGlobal("app")
const EventEmitter  = require('events');

var AWS     = require("aws-sdk");
var uuid    = require("uuid/v4");
var glob    = require("glob");
var fs      = require("fs");
var config  = JSON.parse(fs.readFileSync(app.getAppPath() + "/config.json"));
var SSH     = require("simple-ssh");
var log     = require('electron-log');

class Instance extends EventEmitter {
  constructor(params) {
    super()

    this.params = params
    this.status = "running"
    this.ec2    = new AWS.EC2(config.ec2)

    this.emit("creating")
    this.findOrCreateKey(this.createInstance.bind(this))
    return this;
  }

  createInstance(keyName) {
    log.info("Creating Instance...")
    if(this.params.reservation) {
      this.ec2.startInstances({InstanceIds: this.instanceIds(this.params.reservation)}, function(err, data) {
        if(err) log.error(err)
        this.reservation = this.params.reservation
      }.bind(this))
    } else {
      var params = {
        ImageId: this.params.ami,
        InstanceType: "t2.micro",
        MaxCount: 1,
        MinCount: 1,
        KeyName: keyName,
        SecurityGroupIds: ["sg-c64bf0a1"]
      }

      this.ec2.runInstances(params, function(err, data) {
        if (err) log.error(err, err.stack); // an error occurred
        else {
          this.reservation = data;
        }
      }.bind(this));
    }
  }

  findOrCreateKey(callback) {
    var keyFiles = glob.sync(this.appDataPath() + "/*.pem");

    if(keyFiles.length > 0) {
      let paths     = keyFiles[0].split("/")
      this.keyName  = paths[paths.length - 1].match(/(.+)\.pem/)[1]

      callback(this.keyName);
    } else {
      this.createAndSaveKeyPair(callback);
    }
  }

  createAndSaveKeyPair(callback) {
    var keyId   =  uuid();
    var keyName = "Haiku-" + keyId;

    this.ec2.createKeyPair({ KeyName: keyName }, function(err, data) {
      if (err) log.error(err, err.stack);
      else {
        fs.writeFile(this.appDataPath() + "/" + keyName + ".pem", data.KeyMaterial, {mode: "400"}, function(err) {
          if(err) return log.error(err);
          this.keyName = keyName;
          callback(keyName);
        }.bind(this));
      }
    }.bind(this));
  }

  remove(callback) {
    log.info("Stopping Instance")
    this.ec2.stopInstances({ InstanceIds: this.instanceIds() }, function(err, data) {
      if(err) log.error(err)
      fs.writeFileSync(this.appDataPath() + "/reservation.json", JSON.stringify(this.reservation))

      this.status = "stopped"
      callback();
    }.bind(this));
  }

  instanceIds(r) {
    var instanceIds = [];
    let reservation = r || this.reservation

    for(let i=0; i < reservation.Instances.length; i++) {
      let instance = reservation.Instances[i];
      instanceIds.push(instance.InstanceId);
    }

    return instanceIds;
  }

  //  Before we can SSH, we need to wait for:
  //
  //    - the EC2 reservation request to complete
  //    - the instance to change state to "running"
  //    - the instance to boot up its SSH server
  //
  waitUntilRunning(callback) {
    if(this.reservation === undefined) {
      setTimeout(function() {
        this.waitUntilRunning(callback);
      }.bind(this), 1000);
    } else {
      log.info("Waiting for Instance to Start...")
      this.emit("starting")
      this.pollInstanceState(callback);
    }
  }

  pollInstanceState(callback) {
    this.ec2.describeInstances({ InstanceIds: this.instanceIds() }, function(err, data) {
      this.reservation = data.Reservations[0];
      if(!instancesReady(this.reservation)) {
        setTimeout(function() { this.pollInstanceState(callback) }.bind(this), 1000);
      } else {
        this.emit("connecting")
        log.info("Waiting for SSH Connection...")
        this.pollSSHConnection(callback);
      }
    }.bind(this));
  }

  keyPath() {
    return this.appDataPath() + "/" + this.keyName + ".pem";
  }
  
  appDataPath() {
    return app.getPath("appData") + "/Haiku"
  }

  pollSSHConnection(callback) {
    let config = {
      host: this.reservation.Instances[0].PublicIpAddress,
      user: 'ec2-user',
      key: fs.readFileSync(this.keyPath()),
      timeout: 1000
    }
    let ssh = new SSH(config);

    ssh.exec("exit").start({
      success: function() {
        log.info("Instance Ready");
        this.emit("ready")
        callback(this.keyPath(), this.reservation.Instances[0].PublicIpAddress);
      }.bind(this),
      fail: function(err) {
        if(err.message !== "Timed out while waiting for handshake" && err.code !== "ECONNREFUSED") {
          log.error(err)
        }
        this.pollSSHConnection(callback);
      }.bind(this)
    });
  }
}

function instancesReady(reservation) {
  let ready = true;

  for(let i=0; i < reservation.Instances.length; i++) {
    let instance = reservation.Instances[i];
    if(instance.State.Name !== "running") ready = false;
  }

  return ready;
}

module.exports = Instance 
