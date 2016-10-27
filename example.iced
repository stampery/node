Stampery = require './index'

# Sign up and get your secret token at https://api-dashboard.stampery.com
stampery = new Stampery 'user-secret'

stampery.on 'proof', (hash, proof) ->
  console.log "\nReceived proof for\n#{hash}\n", JSON.stringify(proof, null, 2)
  await stampery.prove hash, proof, defer valid
  console.log 'Proof validity:', valid

stampery.on 'error', (err) ->
  console.log 'woot: ', err

stampery.on 'ready', ->
  random = Math.random().toString(36).slice(2)
  await stampery.hash "The piano has been drinking #{random}", defer hash
  stampery.stamp hash
