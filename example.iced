Stampery = require './index.iced'
fs = require 'fs'

stampery = new Stampery '578d5e19-60ac-4125-d562-8b16e67d041a', true

stampery.on 'proof', (hash, proof) ->
  console.log 'Received proof for ' + hash + ':', proof

stampery.on 'error', (err) ->
  console.log 'woot: ', err

stampery.on 'ready', () ->
  # await stampery.hash Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 63).toString(), defer randomHash 
  # console.log "Stamping #{randomHash}"
  # stampery.stamp randomHash

  stampery.receiveMissedProofs 'CBD48B89EDA1A7BB22728A93E165FC8448BA2FC08BBBD8896D4CB231DDDA8E871650F12171E71689A14BC886A1243C315C11C5DFB05AEEDFA6D40610A37A0C2'


  

# fakeSiblings = []
# i = 0
# while i < 5
#   await stampery.hash Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 63).toString(), defer randomHash 
#   fakeSiblings.push randomHash
#   i++

# console.log fakeSiblings

# await stampery.calculateProof '9647127dff3a469ae7f13a7b7cb18e34d10ebce4e55343913b55d793d6cb40bbe910d7d7adeb6ff', fakeSiblings, defer finalRoot
# console.log finalRoot