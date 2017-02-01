var AWS     = require("aws-sdk");
var uuid    = require("uuid/v4");
var glob    = require("glob");
var fs      = require("fs");
var config  = JSON.parse(fs.readFileSync("config.json"));

module.exports = function() {
  this.ec2 = new AWS.EC2(config.ec2);
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
      return this.reservation;
    }
  }.bind(this));
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

  module.exports.prototype.remove = function() {
  this.ec2.stopInstances({ InstanceIds: this.instanceIds() }, function(err, data) {
    console.log(err);
    console.log(data);
  });
}

module.exports.prototype.instanceIds = function() {
  var instanceIds = [];

  for(i=0; i < this.reservation.Instances.length; i++) {
    let instance = this.reservation.Instances[i];
    instanceIds.push(instance.InstanceId);
  }

  return instanceIds;
}

module.exports.prototype.waitUntilRunning = function(callback) {
  if(this.reservation === undefined) {
    setTimeout(function() {
      this.waitUntilRunning(callback);
    }.bind(this), 120000);
    return;
  }

  this.ec2.describeInstances({ InstanceIds: this.instanceIds() }, function(err, data) {
    var ready        = true;
    this.reservation = data.Reservations[0];

    for(r=0; r < data.Reservations.length; r++) {
      let reservation = data.Reservations[r];
      for(i=0; i < reservation.Instances.length; i++) {
        let instance = reservation.Instances[i];
        if(instance.State.Name !== "running") ready = false;
      }
    }

    if(ready) {
      callback(this);
    } else {
      setTimeout(this.waitUntilRunning.bind(this), 1000, callback);
    }
  }.bind(this));
}
