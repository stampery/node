crypto = require 'crypto'
request = require 'request'

###*
* Stampery API for NodeJS: seamlessly integrate the blockchain-powered,
* industrial-scale certification platform into your NodeJS apps.
###
class Stampery

  constructor : (@clientSecret, @env = 'prod') ->
    @clientId = crypto
      .createHash('md5')
      .update(@clientSecret)
      .digest('hex')
      .substring(0, 15)

    buf = new Buffer("#{@clientId}:#{@clientSecret}")
    @auth = 'Basic ' + buf.toString('base64')

    @host = if @env is 'beta'
      'https://api-beta.stampery.com'
    else
      'https://api-prod.stampery.com'

  ###*
  * Convenience function for obtaining the SHA-256 hash of a string
  * @param {(string|buffer)} input - String or Buffer to hash
  * @returns {buffer} Resulting buffer containing the hashed string
  ###
  hash : (input) ->
    crypto
      .createHash('sha256')
      .update(input)
      .digest()

  ###*
   * Retrieve information and receipts for one stamp ID
   * @param {string} sid - Stamp ID
   * @param {getByIdCallback} cb - Callback for handling the response
  ###
  getById : (sid, cb) =>
    @_get "stamps/#{sid}", (err, res) ->
      if res then res = res[0]
      cb err, res
  ###*
  * @callback getByIdCallback
  * @param {Object} err - Error
  * @param {Object} res - Stamp information and receipts
  ###

  ###*
   * Retrieve information and receipts for all stamps related to one hash
   * @param {(string|Buffer)} hash - Hash
   * @param {getByHashCallback} cb - Callback for handling the response
  ###
  getByHash : (hash, cb) =>
    if hash instanceof Buffer
      hash = hash.toString 'hex'
    @_get "stamps/#{hash}", cb
  ###*
  * @callback getByHashCallback
  * @param {Object} err - Error
  * @param {Object[]} res - Array containing stamp information and receipts
  ###

  ###*
   * Retrieve information and receipts for all my stamps
   * @param {number=0} page - Results are paginated and returned in chunks of 50
   * @param {getAllCallback} cb - Callback for handling the response
  ###
  getAll : (cb, aux) =>
    [page, cb] = if aux? then [cb, aux] else [0, cb]
    @_get "stamps?page=#{page}", cb
  ###*
  * @callback getByHashCallback
  * @param {Object} err - Error
  * @param {Object[]} res - Array containing stamp information and receipts
  ###

  ###*
  * Function for submitting a new stamp
  * @param {(string|buffer)} hash - The hash to be stamped
  * @param {stampCallback} cb - Callback for handling the response
  ###
  stamp : (hash, cb) =>
    if hash instanceof Buffer
      hash = hash.toString('hex')
    @_post "stamps", {hash}, cb
  ###*
  * @callback stampCallback
  * @param {Object} err - Error
  * @param {Object} res - Stamp information and receipts ETA
  ###

  _get : (path, cb) =>
    @_req 'GET', path, {}, cb

  _post : (path, params, cb) =>
    @_req 'POST', path, params, cb

  _req : (method, path, params, cb) =>
    options =
      method: method
      url: "#{@host}/#{path}"
      headers:
        'Authorization': @auth
        'Content-Type': 'application/json'

    if params then options.json = params
    request options, (error, response, body) ->
      if error
        cb error, null
      else if response.statusCode >= 400
        cb
          code: response.statusCode
          message: response.statusMessage
        , null
      else
        cb null, body.result

  ###*
  * Function for proving a the receipts contained in a stamp
  * @param {Object} receipts - The 'receipts' object or the stamp itself
  * @param {proveCallback} cb - Callback for handling the result
  ###
  prove : (receipt) =>
    if 'receipts' of receipt
      receipt = receipt.receipts
    if 'btc' of receipt
      receipt = [receipt.btc, receipt.eth].find (receipt) ->
        typeof receipt isnt 'number'
    if receipt
      hash = Buffer receipt.targetHash, 'hex'
      return @_checkSiblings hash, receipt.proof, receipt.merkleRoot
    false
  ###*
  * @callback proveCallback
  * @param {Boolean} res - Whether the longest receipt is valid or not
  ###

  _checkSiblings : (hash, siblings, root) =>
    if siblings.length > 0
      head = siblings[0]
      tail = siblings.slice 1
      hashes = if 'left' of head then [head.left, hash] else [hash, head.right]
      mix = @_merkleMix hashes
      @_checkSiblings mix, tail, root
    else
      root = new Buffer root, 'hex'
      root.equals hash

  _merkleMix : (hashes) =>
    buf = Buffer.concat hashes.map (h) -> Buffer(h, 'hex')
    @hash buf

module.exports = Stampery
