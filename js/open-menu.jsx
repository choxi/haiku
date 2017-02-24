const React       = require("react")
const ReactDOM    = require("react-dom")
const fs          = require("fs")
const app         = require('electron').remote.getGlobal("app")
const Reservation = require("./reservation.js")

class OpenMenu extends React.Component {
  constructor() {
    super()
    this.select 		      = this.select.bind(this)
    this.create 		      = this.create.bind(this)
    this.selectedClasses  = this.selectedClasses.bind(this)
    this.disableCreateButton    = this.disableCreateButton.bind(this)

		this.state = { 
			selection: {
				ami: null,
				reservation: null
			}
    }
  }

  select(event) {
    let target = event.currentTarget
    let ami    = target.getAttribute("data-ami")

    this.setState({selection: {ami: ami}})
  }

  selectedClasses(value) {
		if(!!this.state.selection.ami && (value === this.state.selection.ami)) {
			return "selected"
		} else if(!!this.state.selection.reservation && (value === this.state.selection.reservation)) {
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
        name: this.refs.name.value, 
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
    return !this.state.selection.ami
  }
  
  render() {
    let selectInstance
    let reservations = Reservation.all()

    if(Object.keys(reservations).length !== 0) {
      let mappedReservations = Object.keys(reservations).map(function (key) {
        return (<tr className={this.selectedClasses(key)} data-reservation={key} key={key}><td>{key}</td><td>Feb 24, 2017</td></tr>)
      }.bind(this))

      selectInstance = (
        <table className="select-instance">
          <tr><th>Name</th><th>Created</th></tr>
          { mappedReservations } 
        </table>
      )
    }

    return (
      <div className="select-stack">
        <div className="open-instance">
          <h3>Open a Saved Instance</h3>
          {selectInstance}
          <button>Open</button>
        </div>
        <div className="new-instance">
          <h3> Create a New Instance </h3>
          <p>
            <label htmlFor="name">Name</label>
            <input name="name" ref="name" type="text" maxLength="100" />
          </p>
          <div className="stacks">
            <p><label>Stack</label></p>
            <div className={"ruby " + this.selectedClasses("ami-165a0876") } data-ami="ami-165a0876" onClick={this.select}>
              <img src="./images/icon-ruby.png" />
              <p> Ruby </p>
            </div>
            <div className={"javascript " + this.selectedClasses("ami-165a0876")} data-ami="ami-165a0876" onClick={this.select}>
              <img src="./images/icon-javascript.png" />
              <p> Node </p>
            </div>
            <div className={"tensorflow " + this.selectedClasses("ami-165a0876")} data-ami="ami-165a0876" onClick={this.select}>
              <img src="./images/icon-tensorflow.png" />
              <p> Tensorflow </p>
            </div>
          </div>
          <button disabled={this.disableCreateButton()} onClick={this.create} >Create</button>
        </div>
      </div>
    )
  }
}

module.exports = OpenMenu
