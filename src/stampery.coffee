crypto = require 'crypto'
request = require 'request-promise-native'

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
   * @returns {Promise<Object>} - Stamp information and receipts
  ###
  getById : (sid) =>
    @_get "stamps/#{sid}"


  ###*
   * Retrieve information and receipts for all stamps related to one hash
   * @param {(string|Buffer)} hash - Hash
   * @returns {Promise<Object>} - Stamp information and receipts
  ###
  getByHash : (hash) =>
    if hash instanceof Buffer
      hash = hash.toString 'hex'
    @_get "stamps/#{hash}"

  ###*
   * Retrieve information and receipts for all my stamps
   * @param {number=0} page - Results are paginated and returned in chunks of 50
   * @returns {Promise<Object[]>} - Array containing stamp information and receipts
  ###
  getAll : (cb, aux) =>
    [page, cb] = if aux? then [cb, aux] else [0, cb]
    @_get "stamps?page=#{page}", cb

  ###*
  * Function for submitting a new stamp
  * @param {(string|buffer)} hash - The hash to be stamped
  * @param {string=null} hook - A WebHook URI notify when full receipt is ready
  * @returns {Promise<Object[]>} -
  ###
  stamp : (hash, hook = null) =>
    if hash instanceof Buffer
      hash = hash.toString('hex')

    payload = {hash}
    if hook
      payload['hook'] = hook

    @_post "stamps", payload

  _get : (path) =>
    @_req 'GET', path, {}

  _post : (path, params) =>
    @_req 'POST', path, params

  _req : (method, path, params) =>
    options =
      method: method
      uri: "#{@host}/#{path}"
      headers:
        'Authorization': @auth
        'Content-Type': 'application/json'
      json: true

    if params then options.json = params

    new Promise (resolve, reject) ->
      request options
        .then (res) ->
          resolve res.result
        .catch (err) ->
          reject err

  ###*
  * Function for proving a the receipts contained in a stamp
  * @param {Object} receipts - The 'receipts' object or the stamp itself
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
