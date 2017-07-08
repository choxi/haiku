import React        from "react"
import ProgressBar  from "progressbar.js"
import Instance     from "../js/instance.js"
import Xterm        from "xterm"
Xterm.loadAddon("fit")

export default class Terminal extends React.Component {
  constructor() {
    super()
    this.state = { loading: false }
  }

  componentDidMount() {
    let params    = this.props.params
    var instance  = new Instance(params)

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

    var term = new Xterm({ cursorBlink: true });
    term.open(document.getElementsByClassName('terminal-wrapper')[0])
    term.fit()

    instance.on("ready", function(keyPath, ipAddress) {
      outerProgress.animate(1)
      innerProgress.animate(1, function() {
        $(".loading-screen").hide()
        $(".terminal-wrapper").show()
        term.fit();
      }.bind(this))

      var sshLogin        = "ec2-user@" + ipAddress;
      var sshArgs         = ["-oStrictHostKeyChecking=no", "-i", keyPath, sshLogin];
      var pty             = require('pty').spawn("ssh", sshArgs, { name: "xterm-256color" });

      pty.on("data", function(data) {
        term.write(data)
      });

      term.on("data", function(data) {
        pty.write(data)
      })

      term.on('resize', function (size) {
        pty.resize(size.cols, size.rows)
      })

      term.focus()
    })

    instance.create()

    window.addEventListener("resize", term.fit.bind(term))
    window.onbeforeunload = function(event) {
      if(instance.status !== "stopped") {
        event.returnValue = false
        instance.remove(window.close.bind(window)) 
      }
    }
  }

  render() {
    return <div>
      <div className="loading-screen">
        <div className="progress-bar">
          <div className="inner-bar"></div>
          <div className="outer-bar"></div>
          <div className="center"></div>
          <div className="ripple-1"></div>
          <div className="ripple-2"></div>
          <div className="ripple-3"></div>
        </div>
        <p className="loading-status">Creating Instance...</p>
      </div>
      <div className="terminal-wrapper"></div>
    </div>
  }
}
