Stampery = require './index.iced'
fs = require 'fs'

stampery = new Stampery '2d4cdee7-38b0-4a66-da87-c1ab05b43768'


stampery.on 'proof', (hash, proof) ->
  console.log 'Received proof for ' + hash + ':'
  console.log proof
  valid = stampery.prove hash, proof
  console.log 'Proof validity:', valid

stampery.on 'error', (err) ->
  console.log 'woot: ', err

stampery.on 'ready', () ->
  stampery.receiveMissedProofs()
  await stampery.hash 'The piano has been drinking', defer hash
  stampery.stamp hash
  console.log hash
