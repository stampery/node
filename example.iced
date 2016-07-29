Stampery = require './index.iced'
fs = require 'fs'

stampery = new Stampery '2d4cdee7-38b0-4a66-da87-c1ab05b43768'

stampery.on 'proof', (hash, proof) ->
  console.log "Received proof for #{hash}", proof
  await stampery.prove hash, proof, defer valid
  console.log 'Proof validity:', valid

stampery.on 'error', (err) ->
  console.log 'woot: ', err

stampery.on 'ready', ->
  stampery.receiveMissedProofs()
  random = Math.random().toString(36).slice(2)
  await stampery.hash "The piano has been drinking #{random}", defer hash
  stampery.stamp hash
