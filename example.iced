Stampery = require './index'

stampery = new Stampery '4d49c0ca-b559-44a2-f5b9-5984f172e689'

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
