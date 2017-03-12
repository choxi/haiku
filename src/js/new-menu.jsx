class NewMenu extends React.Component {
  constructor() {
    super()
    this.updateName       = this.updateName.bind(this)
    this.selectedClasses  = this.selectedClasses.bind(this)
    this.select           = this.select.bind(this)

    this.state = {
      name: null,
      ami: null
    }
  }

  selectedClasses(value) {
    if(!!this.state.ami && (value === this.state.ami)) {
      return "selected"
    } else {
      return ""
    }
  }

  select(event) {
    let target        = event.currentTarget
    let ami           = target.getAttribute("data-ami")

    this.setState({ami: ami})
  }

  updateName(event) {
    this.setState({name: event.target.value})
  }

  render() {
    return (
      <div className="new-instance">
        <h3> Create a New Instance </h3>
        <p>
          <label htmlFor="name">Name</label>
          <input name="name" ref="name" type="text" maxLength="100" onChange={this.updateName} />
        </p>
        <div className="stacks">
          <p><label>Stack</label></p>
          <div className={"ruby " + this.selectedClasses("ami-970eead3") } data-ami="ami-970eead3" onClick={this.select}>
            <img src="./images/icon-ruby.png" />
            <p> Ruby </p>
          </div>
          <div className={"javascript " + this.selectedClasses("ami-165a0876")} data-ami="ami-165a0876" onClick={this.select}>
            <img src="./images/icon-javascript.png" />
            <p> Node </p>
          </div>
          <div className={"tensorflow " + this.selectedClasses("ami-54f2bc34")} data-ami="ami-54f2bc34" onClick={this.select}>
            <img src="./images/icon-tensorflow.png" />
            <p> Tensorflow </p>
          </div>
        </div>
      </div>
    )
  }
}

module.exports = NewMenu
