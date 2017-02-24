const React       = require("react")
const ReactDOM    = require("react-dom")
const fs          = require("fs")
const app         = require('electron').remote.getGlobal("app")

class OpenMenu extends React.Component {
  constructor() {
    super()
    this.select = this.select.bind(this)
    this.create = this.create.bind(this)

    let path = app.getPath("appData") + "/Haiku/reservations.json"
    if(fs.existsSync(path)) {
      this.reservations = JSON.parse(fs.readFileSync(path))
    }
  }

  select(event) {
    let target        = event.currentTarget
    let ami           = target.getAttribute("data-ami")
    let reservationId = target.getAttribute("data-reservation")
    let reservation

    if(!!reservationId) {
      reservation = this.reservations[reservationId]
    }

    this.setState({selection: {ami: ami, reservation: reservation}})
  }

  create(event) {
    this.props.onSelect(this.state.selection)
  }
  
  render() {
    let selectInstance
    if(this.reservations) {
      let mappedReservations = Object.keys(this.reservations).map(function (key) {
        return (<li onClick={this.select} data-reservation={key} key={key}>{key}</li>)
      }.bind(this))

      selectInstance = <ul className="select-instance"> { mappedReservations } </ul>
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
        <label htmlFor="name">Name</label>
        <input name="name" type="text" maxLength="100" />
        <button onClick={this.create} >Create</button>
      </div>
    )
  }
}

module.exports = OpenMenu
