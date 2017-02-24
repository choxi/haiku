const React       = require("react")
const ReactDOM    = require("react-dom")
const fs          = require("fs")
const app         = require('electron').remote.getGlobal("app")

class OpenMenu extends React.Component {
  constructor() {
    super()
    this.select = this.select.bind(this)

    if(fs.existsSync(app.getPath("appData") + "/Haiku/reservation.json")) {
      this.reservation = JSON.parse(fs.readFileSync(app.getPath("appData") + "/Haiku/reservation.json"))
    }
  }

  select(event) {
    let ami = event.target.getAttribute("data-ami")
    let r

    if(event.target.getAttribute("data-reservation")) {
      r = this.reservation
    }

    this.props.onSelect({ami: ami, reservation: r})
  }
  
  render() {
    let selectInstance

    if(this.reservation) {
      selectInstance = (
        <ul className="select-instance">
          <li onClick={this.select} data-reservation={this.reservation.ReservationId} >{this.reservation.ReservationId}</li>
        </ul>
      )
    }

    return (
      <div className="select-stack">
        {selectInstance}
        <h3> Select a Stack </h3>
        <div className="stacks">
          <div className="ruby" data-ami="ami-165a0876" onClick={this.select}>
            <img src="./images/icon-ruby.png" />
            <p> Ruby </p>
          </div>
          <div className="javascript" data-ami="ami-165a0876" onClick={this.select}>
            <img src="./images/icon-javascript.png" />
            <p> Node </p>
          </div>
          <div className="tensorflow" data-ami="ami-165a0876" onClick={this.select}>
            <img src="./images/icon-tensorflow.png" />
            <p> Tensorflow </p>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = OpenMenu
