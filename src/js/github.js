const GithubApi = require("github")
const log       = require('electron-log')

class Github {
  constructor(access_token) {
    this.access_token = access_token
  }

  findOrCreateKey(keyName, keyValue) {
    return new Promise((resolve, reject) => {
      let api = new GithubApi()

      api.authenticate({
        type: "oauth",
        token: this.access_token
      })

      api.users.getKeys({}, (error, response) => {
        let keyExists = false
        response.data.forEach((key) => {
          if(key.title === keyName) {
            keyExists = true
          }
        })

        if(keyExists) {
          log.info("Key exists.")
          resolve()
        } else {
          api.authenticate({
            type: "oauth",
            token: this.access_token
          })

          api.users.createKey({
            title:  keyName,
            key:    keyValue
          }, (error, response) => {
            resolve()
          })
        }
      })
    })
  }

  deleteKey(keyName) {
    return new Promise((resolve, reject) => {
      api.authenticate({
        type: "oauth",
        token: this.access_token
      })

      api.users.deleteKey({
        id:  keyName,
      }, (error, response) => {
        if(error) log.error(error)
        resolve()
      })
    })
  }
}

module.exports = Github
