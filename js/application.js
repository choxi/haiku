const Instance = require("./js/instance.js");

var term = new Terminal();
term.open(document.getElementById('#terminal'));

var instance = new Instance();
instance.waitUntilRunning(function() {
  var pemFilePath     =  instance.keyName + ".pem";
  var sshLogin        =  "ec2-user@" + instance.publicIpAddress;
  var sshArgs         = ["-oStrictHostKeyChecking=no", "-i", pemFilePath, sshLogin]
  var pty             = require('pty').spawn("ssh", sshArgs, { name: "xterm-256color" });

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
});
