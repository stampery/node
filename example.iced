Stampery = require './index.iced'
fs = require 'fs'

stampery = new Stampery '578d5e19-60ac-4125-d562-8b16e67d041a', true

stampery.on 'proof', (hash, proof) ->
  console.log 'Received proof for ' + hash + ':', proof

stampery.on 'error', (err) ->
  console.log 'woot: ', err

stampery.on 'ready', () ->
  i = 0
  while i < 20
    await stampery.hash Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 63).toString(), defer randomHash 
    stampery.stamp randomHash
    i++
