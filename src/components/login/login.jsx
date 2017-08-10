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
      email: this.registerEmail.value,
      password: this.registerPassword.value
    }

    fetch("https://haikuapp-api.herokuapp.com/users", {
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      method: "POST",
      body: JSON.stringify(params)
    }).then((response) => response.json())
    .then((body) => {
      if(body.success !== false && this.props.onLogin)
        this.props.onLogin(body)
    })
    .catch((error) => {
      console.log(error)
    })
  }

  loginUser() {
    let params = {
      email: this.loginEmail.value,
      password: this.loginPassword.value
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
      <input placeholder="email" type="text" ref={ (node) => this.registerEmail = node } />
      <input placeholder="password" type="text" ref={ (node) => this.registerPassword = node } />
      <input type="submit" value="Register" onClick={ this.registerUser }/>

      <h1>Login</h1>
      <input placeholder="email" type="text" ref={ (node) => this.loginEmail = node } />
      <input placeholder="password" type="text" ref={ (node) => this.loginPassword = node } />
      <input type="submit" value="Login" onClick={ this.loginUser }/>
    </div>
  }
}
