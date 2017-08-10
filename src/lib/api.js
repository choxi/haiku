import url from "url"
const electron      = require('electron')
const remote        = electron.remote
const app           = remote.getGlobal("app")
var fs      = require("fs")

export default class Api {
  constructor() {
    this.baseUri = "https://haikuapp-api.herokuapp.com"

    let credentialsPath = app.getPath("appData") + "/Haiku/credentials.json"
    this.credentials = JSON.parse(fs.readFileSync(credentialsPath))
  }

  post(path, params={}) {
    params.token = this.credentials.token

    return new Promise((resolve, reject) => {
      fetch(this.baseUri + path, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(params)
      })
      .then(response => response.json())
      .then(body => resolve(body))
    })
  }

  get(path, params={}) {
    params.token = this.credentials.token

    return new Promise((resolve, reject) => {
      let queryString = url.format({ query: params })

      fetch(this.baseUri + path + queryString, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(body => resolve(body))
    })
  }

  put(path, params={}) {
    params.token = this.credentials.token

    return new Promise((resolve, reject) => {
      fetch(this.baseUri + path, {
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        method: "PUT",
        body: JSON.stringify(params)
      })
      .then(response => response.json())
      .then(body => resolve(body))
    })
  }
}
