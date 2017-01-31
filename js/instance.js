var AWS    = require("aws-sdk");
var config = JSON.parse(fs.readFileSync("config.json"));

module.exports = function() {
  this.ec2 = new AWS.EC2(config.ec2);
}

module.exports.prototype.createAndSaveKeyPair = function() {
  ec2.createKeyPair({ KeyName: "Box" }, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else {
      fs.writeFile("Box.pem", data.KeyMaterial, function(err) {
        if(err) return console.log(err);

        console.log("The file was saved!");
      });
    }
  });
};
