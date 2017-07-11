import React from "react"
import Spin from "spin"

export default class Spinner extends React.Component {
  constructor(props) {
    super(props)
    this.state = { content: null, loading: true }

    if(this.props.load)
      this.props.load().then((value) => {
        this.setState({ content: value, loading: false })
      })
  }

  componentDidMount() {
    let options = {
      length: 2,
      radius: 2,
      width: 1,
      position: "absolute",
      left: "50%"
    }

    if(this.state.loading)
      new Spin(options).spin(this.spinner)
  }

  render() {
    let contents 
    if(this.state.loading)
      contents = <div className="spinner" ref={ (node) => this.spinner = node } />
    else
      contents = this.state.content

    return <div className="Spinner">
      { contents }
    </div>
  }
}
