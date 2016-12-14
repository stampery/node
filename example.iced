Stampery = require './index.iced'

# Sign up and get your secret token at https://api-dashboard.stampery.com
stampery = new Stampery '14f1e553-325f-4549-ced6-6c5311b1a470'

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
