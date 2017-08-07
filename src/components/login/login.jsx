import React from "react"

export default class Login extends React.Component {
  constructor() {
    super()

    this.loginUser = this.loginUser.bind(this)
    this.registerUser = this.registerUser.bind(this)
  }

  registerUser() {
    let params = {
      name: this.name.value,
      email: this.email.value,
      password: this.password.value
    }

    fetch("https://haikuapp-api.herokuapp.com/users", {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify(params)
    }).then((response) => {
      response.json().then(body => console.log(body))
    }).catch((error) => {
      console.log(error)
    })
  }

  loginUser() {
    let params = {
      email: this.email.value,
      password: this.password.value
    }

    fetch("https://haikuapp-api.herokuapp.com/login", {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then((body) => {
      if(this.props.onLogin)
        this.props.onLogin(body)
    })
    .catch((error) => {
      console.log(error)
    })
  }

  render() {
    return <div className="Login">
      <h1>Register</h1>
      <input placeholder="name" type="text" ref={ (node) => this.name = node } />
      <input placeholder="email" type="text" ref={ (node) => this.email = node } />
      <input placeholder="password" type="text" ref={ (node) => this.password = node } />
      <input type="submit" value="Register" onClick={ this.registerUser }/>

      <h1>Login</h1>
      <input placeholder="email" type="text" ref={ (node) => this.email = node } />
      <input placeholder="password" type="text" ref={ (node) => this.password = node } />
      <input type="submit" value="Login" onClick={ this.loginUser }/>
    </div>
  }
}
