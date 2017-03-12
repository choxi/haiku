class NewMenu extends React.Component {
  constructor() {
    super()
    this.updateName = this.updateName.bind(this)
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
      </div>
    )
  }
}

module.exports = NewMenu
