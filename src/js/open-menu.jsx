const React       = require("react")
const ReactDOM    = require("react-dom")
const Reservation = require("./reservation.js")
const NewMenu     = require("./new-menu.jsx")
const Instance    = require("./instance.js")

class OpenMenu extends React.Component {
  constructor() {
    super()
    this.select               = this.select.bind(this)
    this.create               = this.create.bind(this)
    this.delete               = this.delete.bind(this)
    this.selectedClasses      = this.selectedClasses.bind(this)
    this.disableOpenButton    = this.disableOpenButton.bind(this)

    this.state = {
      reservation: null,
      reservations: Reservation.all()
    }
  }

  select(event) {
    let target        = event.currentTarget
    let reservationId = target.getAttribute("data-reservation")
    let reservation

    if(!!reservationId) {
      reservation = Reservation.find(reservationId)
    }

    this.setState({ reservation: reservationId })
  }

  selectedClasses(value) {
    if(!!this.state.reservation && (value === this.state.reservation)) {
      return "selected"
    } else {
      return ""
    }
  }

  create(event) {
    let name = this.state.reservation
    let params = {
      name:         name,
      reservation:  Reservation.find(name)
    }

    this.props.onSelect(params)
  }

  disableOpenButton() {
    return !this.state.reservation
  }

  delete(event) {
    let target        = event.currentTarget.parentElement
    let reservationId = target.getAttribute("data-reservation")
    let reservation   = Reservation.find(reservationId)
    let instance      = new Instance({reservation: reservation, name: reservationId})

    instance.terminate().then(() => {
      this.setState({ reservations: Reservation.all(), reservation: null })
    })
  }

  render() {
    let reservations = this.state.reservations
    let mappedReservations

    if(Object.keys(reservations).length !== 0) {
      mappedReservations = Object.keys(reservations).map((key) => {
        return (
          <tr className={this.selectedClasses(key)} onClick={this.select} data-reservation={key} key={key}>
            <td>{key}</td>
            <td>Feb 24, 2017</td>
            <td onClick={this.delete}>Delete</td>
          </tr>
        )
      })
    }

    return (
      <div className="select-stack">
        <div className="open-instance">
          <h3>Open a Saved Instance</h3>

          <table className="select-instance">
            <tbody>
              <tr><th>Name</th><th>Created</th><th>Actions</th></tr>
              { mappedReservations }
            </tbody>
          </table>

          <button disabled={this.disableOpenButton()} onClick={this.create}>Open</button>
        </div>
        <NewMenu onSelect={this.props.onSelect} />
      </div>
    )
  }
}

module.exports = OpenMenu
