var ProgressBar = require('progressbar.js')
var innerProgress = new ProgressBar.SemiCircle('.progress-bar .inner-bar', {
  strokeWidth: 20,
  color: "#FF8000"
})

var outerProgress = new ProgressBar.SemiCircle('.progress-bar .outer-bar', {
  strokeWidth: 14,
  color: "#D0E162"
})

var term = new Terminal({ cursorBlink: true });
term.open(document.getElementById('#terminal'));
term.fit();

var electron      = require("electron")
var remote        = electron.remote
var instance      = remote.getGlobal("instance");
var currentWindow = remote.getCurrentWindow()

window.addEventListener("resize", term.fit.bind(term));

$(".loading-status").text("Creating Instance...")
innerProgress.animate(0.30, {duration: 40000})
outerProgress.animate(0.25, {duration: 40000})

instance.on("starting", function() {
  innerProgress.animate(0.65, {duration: 17000});
  outerProgress.animate(0.5, {duration: 17000});
  $(".loading-status").text("Starting...")
})

instance.on("connecting", function() {
  innerProgress.animate(0.95, {duration: 17000});
  outerProgress.animate(0.75, {duration: 17000});
  $(".loading-status").text("Connecting...")
})

instance.on("ready", function() {
  outerProgress.animate(1)
  innerProgress.animate(1, function() {
    $(".loading-screen").hide()
  })
})

instance.waitUntilRunning(function(keyPath, ipAddress) {
  var sshLogin        = "ec2-user@" + ipAddress;
  var sshArgs         = ["-oStrictHostKeyChecking=no", "-i", keyPath, sshLogin];
  var pty             = require('pty').spawn("ssh", sshArgs, { name: "xterm-256color" });

  pty.on("data", function(data) {
    term.write(data);
  });

  term.on("data", function(data) {
    pty.write(data)
  })

  term.focus();
});
