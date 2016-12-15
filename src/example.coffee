Stampery = require './stampery.coffee'

# Sign up and get your user secret at https://api-dashboard.stampery.com
stampery = new Stampery '14f1e553-325f-4549-ced6-6c5311b1a470', 'beta'

stampery.getById '5852e3ff9e7cba6e67aee623', (err, res) ->
  console.error err
  console.log res
  console.log stampery.prove res.receipts

# stampery.getAll (err, res) ->
#   console.error err
#   console.log res

# h = stampery.hash 'hola caracola ' + Math.random()
# stampery.stamp h, (err, sid) ->
#   if err then throw err
#   stampery.getById sid, (err, res) ->
#     if err then throw err
#     console.log res
