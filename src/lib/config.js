import fs from "fs"

let config
let configPath = "./config/config.json"

if(fs.existsSync(configPath))
  config = JSON.parse(fs.readFileSync(configPath))
else
  throw new Error(`Unable to find configuration file at: ${configPath}`)

export default config
