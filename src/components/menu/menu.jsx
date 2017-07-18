import React       from "react"
import ReactDOM    from "react-dom"
import NewMenu     from "./new-menu.jsx"
import Reservation from "../../lib/reservation.js"
import Instance    from "../../lib/instance.js"
import Spinner     from "../spinner/spinner.jsx"
import electron    from "electron"
import fs from "fs"

const app = electron.remote.app

export default class Menu extends React.Component {
  constructor() {
    super()
    this.select               = this.select.bind(this)
    this.create               = this.create.bind(this)
    this.delete               = this.delete.bind(this)
    this.selectedClasses      = this.selectedClasses.bind(this)
    this.disableOpenButton    = this.disableOpenButton.bind(this)

    this.state = {
      reservation: null,
      reservations: Reservation.all(),
      instances: Instance.all()
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
    event.stopPropagation()

    let target        = event.currentTarget.parentElement
    let reservationId = target.getAttribute("data-reservation")
    let reservation   = Reservation.find(reservationId)
    let instance      = new Instance({reservation: reservation, name: reservationId})

    instance.terminate().then(() => {
      this.setState({ reservations: Reservation.all(), reservation: null })
    })
  }

  render() {
    let instances = Instance.all()
    let mappedInstances
    let images = {}
    let imagesPath = app.getPath("appData") + "/Haiku/images.json"
    if(fs.existsSync(imagesPath)) images = JSON.parse(fs.readFileSync(imagesPath))

    if(Object.keys(instances).length !== 0) {
      mappedInstances = Object.keys(instances).map((key) => {
        let instance = instances[key]

        return (
          <tr className={this.selectedClasses(key)} onClick={this.select} data-reservation={key} key={key}>
            <td>{key}</td>
            <td>Feb 24, 2017</td>
            <td onClick={this.delete}>Delete</td>
            <td><Spinner load={ instance.getStatus } /></td>
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
              <tr>
                <th>Name</th>
                <th>Created</th>
                <th>Actions</th>
                <th>Status</th>
              </tr>
              { mappedInstances }
            </tbody>
          </table>

          <button disabled={this.disableOpenButton()} onClick={this.create}>Open</button>
        </div>
        <NewMenu onSelect={this.props.onSelect} images={ images } />
      </div>
    )
  }
}
