Stampery = require './index.iced'
fs = require 'fs'

stampery = new Stampery '054c81b2-0040-46df-a54b-a0e3793970a4', true


stampery.on 'proof', (hash, proof) ->
  console.log 'Received proof for ' + hash + ':'
  console.log proof

stampery.on 'error', (err) ->
  console.log 'woot: ', err

stampery.on 'ready', () ->
  stampery.receiveMissedProofs()
  await stampery.hash "whatever", defer hash
  console.log hash
#  i = 0
#  while i < 1
#    await stampery.hash Math.random().toString(36).slice(2), defer randomHash
#    stampery.stamp randomHash
#    i++
