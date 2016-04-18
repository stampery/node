Stampery = require './index.iced'
fs = require 'fs'

stampery = new Stampery '3c257d54-4747-49e7-9909-2508e12de213'

randomHash = () -> stampery.hash Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 63).toString()
dHash = stampery.hash randomHash()
console.log "Stamping #{dHash}"
stampery.stamp dHash, (err, hash) ->
  console.log 'Stamped', hash
