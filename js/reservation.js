const fs          = require("fs")
const app         = require('electron').remote.getGlobal("app")

class Reservation {
}

Reservation.find = function(id) {
  let reservations = this.all()
  return reservations[id]
}

Reservation.all = function() {
  let path          = app.getPath("appData") + "/Haiku/reservations.json"
  let reservations  = {}

  if(fs.existsSync(path)) {
    reservations = JSON.parse(fs.readFileSync(path))
  }

  return reservations
}

module.exports = Reservation
