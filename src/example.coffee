Stampery = require './stampery.coffee'

###*
* Please replace this dummy user secret with a real one.
* Sign up and get your own user secret at https://api-dashboard.stampery.com
###
stampery = new Stampery '14f1e553-325f-4549-ced6-6c5311b1a470'

###*
* Simple workflow for stamping a string
* This will return a receipt containing all the data related to the stamp plus
* an estimation of the remaining time for the Ethereum and Bitcoin proofs to
* be ready for proving. Average ETA is ~30 seconds for ETH and ~5 minutes
* for BTC.
###
h = stampery.hash 'the piano has been drinking ' + Math.random()
stampery.stamp h
  .then (stamp) ->
    console.log stamp
  .catch (err) ->
    console.error err

###*
* Example for retrieving the proofs for a certain stamp at any time afterwards.
* It also verifies if the proof is valid and prints the result.
###
stampery.getById '5857d1629e7cba66c3ea20a8'
  .then (stamp) ->
    console.log stamp
    console.log 'Validity: ', stampery.prove stamp.receipts
  .catch (err) ->
    console.error err

###*
* Example for retrieving the proofs for all the stamps related to a certain file
* hash at any time afterwards.
###
stampery.getByHash '<put here the file hash>'
  .then (stamps) ->
    console.log stamps
  .catch (err) ->
    console.error err

###*
* Example for retrieving all the proofs in your stamps history at any time
* afterwards. For the sake of responsiveness, it will return only the last 50
* stamps (page 0).
###
stampery.getAll
  .then (stamps) ->
    console.log stamps
  .catch (err) ->
    console.log err

###*
* Example for retrieving next 50 proofs from the stamps history.
* Increase the first argument to get page 0, 1, 2, 3 and so on.
* This example should return stamps numbers from 200 to 249.
###
stampery.getAll 4
  .then (stamp) ->
    console.log stamp
  .catch (err) ->
    console.error err
