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
      selected: null
    }

    Instance.all()
    .then((instances) => {
      this.setState({ instances: instances })
    })
  }

  select(instance) {
    this.setState({ selected: instance })
  }

  selectedClasses(instance) {
    if(this.state.selected && (this.state.selected.id === instance.id)) {
      return "selected"
    } else {
      return ""
    }
  }

  create(event) {
    this.props.onSelect(this.state.selected)
  }

  disableOpenButton() {
    return !this.state.selected
  }

  delete(event, instance) {
    event.stopPropagation()

    instance.terminate()
    .then(Instance.all)
    .then((instances) => this.setState({ instances: instances, selected: null }))
  }

  render() {
    if(!this.state.instances)
      return <h1>Loading</h1>

    let instances = this.state.instances

    let mappedInstances
    let images = {}
    let imagesPath = app.getPath("appData") + "/Haiku/images.json"
    if(fs.existsSync(imagesPath)) images = JSON.parse(fs.readFileSync(imagesPath))

    if(Object.keys(instances).length !== 0) {
      mappedInstances = Object.keys(instances).map((key) => {
        let instance = instances[key]

        return (
          <tr className={ this.selectedClasses(instance) } onClick={ () => this.select(instance) } key={ key }>
            <td>{ instance.name }</td>
            <td>Feb 24, 2017</td>
            <td onClick={ (event) => this.delete(event, instance) }>Delete</td>
            <td>{ instance.state }</td>
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

          <button disabled={ this.disableOpenButton() } onClick={ this.create }>Open</button>
        </div>
        <NewMenu onSelect={ this.props.onSelect } images={ images } />
      </div>
    )
  }
}
