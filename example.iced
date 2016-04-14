Stampery = require './index.iced'
fs = require 'fs'

stampery = new Stampery '830fa1bf-bee7-4412-c1d3-31dddba2213d'

randomHash = () -> stampery.hash Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 63).toString()
dHash = stampery.hash randomHash()
console.log "Stamping #{dHash}"
stampery.stamp dHash, (err, hash) ->
  console.log 'Stamped', hash
