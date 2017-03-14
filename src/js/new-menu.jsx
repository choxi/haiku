class NewMenu extends React.Component {
  constructor() {
    super()
    this.create               = this.create.bind(this)
    this.select               = this.select.bind(this)
    this.updateName           = this.updateName.bind(this)
    this.updateInstanceType   = this.updateInstanceType.bind(this)
    this.selectedClasses      = this.selectedClasses.bind(this)
    this.disableCreateButton  = this.disableCreateButton.bind(this)
    this.instanceTypeOptions  = ["t1.micro", "g2.2xlarge"]

    this.state = {
      name: null,
      ami: null,
      instanceType: this.instanceTypeOptions[0]
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

  updateInstanceType(event) {
    this.setState({instanceType: event.target.value})
  }

  disableCreateButton() {
    return !this.state.ami || !this.state.name || this.state.name === ""
  }

  create(event) {
    let params = {
      name: this.state.name,
      ami:  this.state.ami,
      instanceType: this.state.instanceType
    }

    this.props.onSelect(params)
  }

  render() {
    let instanceOptions = this.instanceTypeOptions.map((type) => {
      return (
        <option value={type} key={type}>{type}</option>
      )
    })

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
        <p>
          <label>Instance Type  </label>
          <select onChange={this.updateInstanceType}>
            { instanceOptions }
          </select>
        </p>

        <div className="new-instance">
          <button disabled={this.disableCreateButton()} onClick={this.create} >Create</button>
        </div>
      </div>
    )
  }
}

module.exports = NewMenu
