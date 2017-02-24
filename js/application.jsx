const ProgressBar = require('progressbar.js')
const Instance    = require("./js/instance.js");
const React       = require("react")
const ReactDOM    = require("react-dom")
const OpenMenu    = require("./js/open-menu.jsx")

function createInstance(params) {
  var instance = new Instance(params)

  $(".select-stack").hide()
  $(".loading-screen").show()

  var innerProgress = new ProgressBar.SemiCircle('.progress-bar .inner-bar', {
    strokeWidth: 20,
    color: "#FF8000"
  })

  var outerProgress = new ProgressBar.SemiCircle('.progress-bar .outer-bar', {
    strokeWidth: 14,
    color: "#D0E162"
  })

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

  var term = new Terminal({ cursorBlink: true });
  term.open(document.getElementsByClassName('terminal-wrapper')[0])
  term.fit()

  instance.on("ready", function() {
    outerProgress.animate(1)
    innerProgress.animate(1, function() {
      $(".loading-screen").hide()
      $(".terminal-wrapper").show()
      term.fit();
    }.bind(this))
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

    term.on('resize', function (size) {
      pty.resize(size.cols, size.rows)
    })

    term.focus();
  });

  window.addEventListener("resize", term.fit.bind(term))
  window.onbeforeunload = function(event) {
    if(instance.status !== "stopped") {
      event.returnValue = false
      instance.remove(window.close.bind(window)) 
    }
  }
}

ReactDOM.render(
  <OpenMenu onSelect={createInstance} />,
  document.getElementById('open-menu')
)
