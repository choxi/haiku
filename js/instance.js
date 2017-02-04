var AWS     = require("aws-sdk");
var uuid    = require("uuid/v4");
var glob    = require("glob");
var fs      = require("fs");
var config  = JSON.parse(fs.readFileSync("config.json"));
var SSH     = require("simple-ssh");

module.exports = function() {
  this.ec2             = new AWS.EC2(config.ec2);
  this.sshOpen         = false;
  this.findOrCreateKey(this.createInstance.bind(this));
  return this;
}

module.exports.prototype.createInstance = function(keyName) {
  var params = {
    ImageId: "ami-0b33d91d",
    InstanceType: "t2.micro",
    MaxCount: 1,
    MinCount: 1,
    KeyName: keyName,
    SecurityGroupIds: ["sg-0a2ea676"]
  }

  this.ec2.runInstances(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      this.reservation = data;
      console.log("Waiting for Instance to Start...")
      this.pollInstanceState();
    }
  }.bind(this));
}

module.exports.prototype.pollSSHConnection = function() {
  let config = {
    host: this.reservation.Instances[0].PublicIpAddress,
    user: 'ec2-user',
    key: fs.readFileSync(this.keyName + ".pem"),
    timeout: 1000
  }
  let ssh = new SSH(config);

  ssh.exec("exit").start({
    success: function() {
      console.log("Instance Ready");
      this.sshOpen = true;
    }.bind(this),
    fail: this.pollSSHConnection.bind(this)
  });
}

module.exports.prototype.findOrCreateKey = function(callback) {
  var keyFiles = glob.sync("*.pem");

  if(keyFiles.length > 0) {
    var keyName = keyFiles[0].match(/(.+)\.pem/)[1]
    this.keyName = keyName;
    callback(keyName);
  } else {
    this.createAndSaveKeyPair(callback);
  }
}

module.exports.prototype.createAndSaveKeyPair = function(callback) {
  var keyId   =  uuid();
  var keyName = "Box-" + keyId;

  this.ec2.createKeyPair({ KeyName: keyName }, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
      fs.writeFile(keyName + ".pem", data.KeyMaterial, {mode: "400"}, function(err) {
        if(err) return console.log(err);
        this.keyName = keyName;
        callback(keyName);
      }.bind(this));
    }
  }.bind(this));
};

module.exports.prototype.remove = function(callback) {
  this.ec2.stopInstances({ InstanceIds: this.instanceIds() }, function(err, data) {
    callback();
  }.bind(this));
}

module.exports.prototype.instanceIds = function() {
  var instanceIds = [];

  for(i=0; i < this.reservation.Instances.length; i++) {
    let instance = this.reservation.Instances[i];
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
module.exports.prototype.waitUntilRunning = function(callback) {
  if(this.reservation === undefined) {
    setTimeout(function() {
      this.waitUntilRunning(callback);
    }.bind(this), 1000);
    return;
  }

  if(!instancesReady(this.reservation)) {
    setTimeout(function() {
      this.waitUntilRunning(callback);
    }.bind(this), 1000);
    return;
  }

  if(this.sshOpen === false) {
    setTimeout(function() {
      this.waitUntilRunning(callback);
    }.bind(this), 1000);
    return;
  }

  callback(this.keyName, this.reservation.Instances[0].PublicIpAddress);
}

function instancesReady(reservation) {
  let ready = true;

  for(i=0; i < reservation.Instances.length; i++) {
    let instance = reservation.Instances[i];
    if(instance.State.Name !== "running") ready = false;
  }

  return ready;
}

module.exports.prototype.pollInstanceState = function() {
  this.ec2.describeInstances({ InstanceIds: this.instanceIds() }, function(err, data) {
    this.reservation = data.Reservations[0];
    if(!instancesReady(this.reservation)) {
      setTimeout(this.pollInstanceState.bind(this), 1000);
    } else {
      console.log("Waiting for SSH Connection...")
      this.pollSSHConnection();
    }
  }.bind(this));
}
