import React from "react"

export default class Status extends React.Component {
  render() {
    return <p className="loading-status">{ this.props.text }</p>
  }
}
