
var fs  = require('fs');





if(!fs.existsSync("Box.pem")) {
  createAndSaveKeyPair()
}

params = {
  ImageId: "ami-0b33d91d",
  InstanceType: "t2.micro",
  MaxCount: 1,
  MinCount: 1
}

ec2.runInstances(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});

var params = {
  InstanceIds: [
    "i-081ee6ee057a07b51"
  ]
}

ec2.stopInstances(params, function(err, data) {
  if (err) console.log(err, err.stack); // an error occurred
  else     console.log(data);           // successful response
});

stopAllInstances = function() {
  var instanceIds = [];

  ec2.describeInstances({}, function(err, data) {
    for(i=0; i < data.Reservations.length; i++) {
      reservation = data.Reservations[i];
      for(j=0; j < reservation.Instances.length; j++) {
        instance = reservation.Instances[j];
        instanceIds.push(instance.InstanceId);
      }
    }

    ec2.stopInstances({ InstanceIds: instanceIds }, function(err, data) {
      console.log(err);
      console.log(data);
    });
  });
}

window.term = new Terminal();
term.open(document.getElementById('#terminal'));

var pty  = require('pty').spawn("ssh", ["-oStrictHostKeyChecking=no", "-i", "General.pem", "ec2-user@54.209.64.45"], {
  name: "xterm-256color"
});

pty.on("data", function(data) {
  term.write(data);
});

term.on('key', function (key, ev) {
  var printable = (
    !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey
  );

  if (ev.keyCode == 13) {
    pty.write(key);
  } else if (ev.keyCode == 8) {
   // Do not delete the prompt
    if (term.x > 2) {
      term.write('\b \b');
    }
  } else if (printable) {
    pty.write(key);
  }
});

term.focus();
