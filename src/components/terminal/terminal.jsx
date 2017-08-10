import React        from "react"
import { ipcRenderer as ipc } from "electron"
import ProgressBar  from "progressbar.js"
import Instance     from "../../lib/instance.js"
import Xterm        from "xterm"
Xterm.loadAddon("fit")

const { app } = require('electron').remote

export default class Terminal extends React.Component {
  constructor(props) {
    super(props)

    this.instance = new Instance(this.props.params)

    ipc.on("detach", (event) => {
      this.instance.detach(() => {
        window.close()
      })
    })
  }

  componentDidMount() {
    let loadingStatus = document.getElementsByClassName("loading-status")[0]

    var innerProgress = new ProgressBar.SemiCircle('.progress-bar .inner-bar', {
      strokeWidth: 20,
      color: "#FF8000"
    })

    var outerProgress = new ProgressBar.SemiCircle('.progress-bar .outer-bar', {
      strokeWidth: 14,
      color: "#D0E162"
    })

    loadingStatus.textContent = "Creating Instance..."
    innerProgress.animate(0.30, {duration: 40000})
    outerProgress.animate(0.25, {duration: 40000})

    this.instance.on("starting", () => {
      innerProgress.animate(0.65, {duration: 17000})
      outerProgress.animate(0.5, {duration: 17000})
      loadingStatus.textContent = "Starting..."
    })

    this.instance.on("connecting", () => {
      innerProgress.animate(0.95, {duration: 17000})
      outerProgress.animate(0.75, {duration: 17000})
      loadingStatus.textContent = "Connecting..."
    })

    var term = new Xterm({ cursorBlink: true });
    term.open(document.getElementsByClassName('terminal-wrapper')[0], { focus: true })
    term.fit()

    this.instance.on("ready", (keyPath, ipAddress) => {
      outerProgress.animate(1)
      innerProgress.animate(1, function() {
        document.getElementsByClassName("loading-screen")[0].style.display = "none"
        document.getElementsByClassName("terminal-wrapper")[0].style.display = "block"
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

    this.instance.start()

    window.addEventListener("resize", term.fit.bind(term))
    window.onbeforeunload = (event) => {
      if(this.instance.state !== "stopped" && this.instance.state !== "detached") {
        event.returnValue = false
        this.instance.stop(() => {
          window.close()
          app.quit()
        })
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
