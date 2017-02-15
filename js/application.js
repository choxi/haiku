var term = new Terminal({ cursorBlink: true });
term.open(document.getElementById('#terminal'));
term.fit();

var electron      = require("electron")
var remote        = electron.remote
var instance      = remote.getGlobal("instance");
var currentWindow = remote.getCurrentWindow()

currentWindow.on("resize", term.fit);

instance.on("creating", function() {
  $(".loading-status").text("Creating Instance...")
})

instance.on("starting", function() {
  $(".loading-status").text("Starting...")
})

instance.on("connecting", function() {
  $(".loading-status").text("Connecting...")
})

instance.on("ready", function() {
  $(".loading-screen").hide()
})

instance.waitUntilRunning(function(keyPath, ipAddress) {
  var sshLogin        = "ec2-user@" + ipAddress;
  var sshArgs         = ["-oStrictHostKeyChecking=no", "-i", keyPath, sshLogin];
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
      if (term.x > 28) {
        term.write('\b \b');
      }
    } else if (printable) {
      pty.write(key);
    }
  });

  term.focus();
});
