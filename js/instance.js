var AWS     = require("aws-sdk");
var uuid    = require("uuid/v4");
var glob    = require("glob");
var config  = JSON.parse(fs.readFileSync("config.json"));

module.exports = function() {
  this.ec2 = new AWS.EC2(config.ec2);
  this.findOrCreateKey(function(keyName) {
    console.log("Key Name: " + keyName);
  });
}

module.exports.prototype.findOrCreateKey = function(callback) {
  var keyFiles = glob.sync("*.pem");

  if(keyFiles.length > 0) {
    var keyName = keyFiles[0].match(/(.+)\.pem/)[1]
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
      fs.writeFile(keyName + ".pem", data.KeyMaterial, function(err) {
        if(err) return console.log(err);
        callback(keyName);
      });
    }
  });
};
