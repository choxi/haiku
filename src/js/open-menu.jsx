const React       = require("react")
const ReactDOM    = require("react-dom")
const fs          = require("fs")
const app         = require('electron').remote.getGlobal("app")
const Reservation = require("./reservation.js")
const NewMenu     = require("./new-menu.jsx")

class OpenMenu extends React.Component {
  constructor() {
    super()
    this.select               = this.select.bind(this)
    this.create               = this.create.bind(this)
    this.selectedClasses      = this.selectedClasses.bind(this)
    this.disableCreateButton  = this.disableCreateButton.bind(this)
    this.disableOpenButton    = this.disableOpenButton.bind(this)

    this.state = { 
      selection: {
        reservation: null
      }
    }
  }

  select(event) {
    let target        = event.currentTarget
    let reservationId = target.getAttribute("data-reservation")
    let reservation

    if(!!reservationId) {
      reservation = Reservation.find(reservationId)
    }

    this.setState({selection: {reservation: reservationId}})
  }

  selectedClasses(value) {
    if(!!this.state.selection.reservation && (value === this.state.selection.reservation)) {
      return "selected"
    } else {
      return ""
    }
  }

  create(event) {
    let params      = {}
    let ami         = this.state.selection.ami
    let reservation = this.state.selection.reservation

    if(!!ami) {
      params = { 
        name: this.state.name, 
        ami: ami 
      }
    } else if(!!reservation) {
      params = {
        name: reservation,
        reservation: Reservation.find(reservation)
      }
    }

    this.props.onSelect(params)
  }
  
  disableCreateButton() {
    return !this.state.selection.ami || !this.state.name || this.state.name === ""
  }

  disableOpenButton() {
    return !this.state.selection.reservation
  }
  
  render() {
    let selectInstance
    let reservations = Reservation.all()

    if(Object.keys(reservations).length !== 0) {
      let mappedReservations = Object.keys(reservations).map(function (key) {
        return (<tr className={this.selectedClasses(key)} onClick={this.select} data-reservation={key} key={key}><td>{key}</td><td>Feb 24, 2017</td></tr>)
      }.bind(this))

      selectInstance = (
        <div className="open-instance">
          <h3>Open a Saved Instance</h3>
          {selectInstance}

          <table className="select-instance">
            <tbody>
              <tr><th>Name</th><th>Created</th></tr>
              { mappedReservations }
            </tbody>
          </table>

          <button disabled={this.disableOpenButton()} onClick={this.create}>Open</button>
        </div>
      )
    }

    return (
      <div className="select-stack">
        {selectInstance}
        <NewMenu />
        <div className="new-instance">
          <button disabled={this.disableCreateButton()} onClick={this.create} >Create</button>
        </div>
      </div>
    )
  }
}

module.exports = OpenMenu
