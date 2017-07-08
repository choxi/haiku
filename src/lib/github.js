const GithubApi = require("github")
const log       = require('electron-log')

class Github {
  constructor(access_token) {
    this.access_token = access_token
    this.api          = new GithubApi()
  }

  findOrCreateKey(keyName, keyValue) {
    return new Promise((resolve, reject) => {
      let api = this.api

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
      let api = this.api

      api.authenticate({
        type: "oauth",
        token: this.access_token
      })

      api.users.getKeys({}, (error, response) => {
        if(error) log.error(error.toString())

        let keyId
        response.data.forEach((key) => {
          if(key.title === keyName) keyId = key.id
        })

        if(keyId) {
          api.authenticate({
            type: "oauth",
            token: this.access_token
          })

          api.users.deleteKey({ id:  keyId.toString() }, (error, response) => {
            if(error) log.error(error.toString())
            log.info("Deleted GitHub Key")
            resolve()
          })
        } else {
          log.info("No key found on GitHub")
          resolve()
        }
      })
    })
  }
}

module.exports = Github
