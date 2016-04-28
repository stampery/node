Stampery = require './index.iced'
fs = require 'fs'

stampery = new Stampery '3c257d54-4747-49e7-9909-2508e12de213', true

await stampery.hash Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 63).toString(), defer randomHash 

console.log "Stamping #{randomHash}"
stampery.stamp randomHash, (err, hash) ->
  console.log 'Stamped', hash, err

# fakeSiblings = []
# i = 0
# while i < 5
#   await stampery.hash Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 63).toString(), defer randomHash 
#   fakeSiblings.push randomHash
#   i++

# console.log fakeSiblings

# await stampery.calculateProof '9647127dff3a469ae7f13a7b7cb18e34d10ebce4e55343913b55d793d6cb40bbe910d7d7adeb6ff', fakeSiblings, defer finalRoot
# console.log finalRoot