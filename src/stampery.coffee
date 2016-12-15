crypto = require 'crypto'
request = require 'request'

class Stampery

  constructor : (@clientSecret, @env) ->
    @clientId = crypto
      .createHash('md5')
      .update(@clientSecret)
      .digest('hex')
      .substring(0, 15)

    console.log(@clientId, @clientSecret)
    buf = new Buffer("#{@clientId}:#{@clientSecret}")
    @auth = 'Basic ' + buf.toString('base64')

    @host = if @env is 'beta'
      'http://api-beta.stampery.com'
    else
      'https://api.stampery.com'

  hash : (string) ->
    crypto
      .createHash('sha256')
      .update(string)
      .digest()

  getById : (stamp_id, cb) =>
    @_get "stamps/#{stamp_id}", (err, res) ->
      if res then res = res[0]
      cb err, res

  getByHash : (hash, cb) =>
    @_get "stamps/#{hash}", cb

  getAll : (cb, aux) =>
    [page, cb] = if aux? then [cb, aux] else [0, cb]
    @_get "stamps?page=#{page}", cb

  stamp : (hash, cb) =>
    if hash instanceof Buffer
      hash = hash.toString('hex')
    @_post "stamps", {hash}, cb

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

    if params then options.json = JSON.stringify params
    request options, (error, response, body) ->
      if error then cb(error, null) else cb(body.error, body.result)

  prove : (receipts) =>
    if 'receipts' of receipts
      receipts = receipts.receipts
    console.log 'Proving', receipts
    receipt = receipts.btc or receipts.eth
    if receipt
      @_checkSiblings receipt.targetHash, receipt.proof, receipt.merkleRoot
    else false

  _checkSiblings : (hash, siblings, root) =>
    if siblings.length > 0
      head = siblings[0]
      tail = siblings.slice 1
      hashes = if 'left' of [head.left, hash] then [hash, head.left]
      mix = @_merkleMix hashes
      _checkSiblings mix, tail, root
    else
      hash is root

  _merkleMix : (hashes) =>
    buf = Buffer.concat hashes.map (h) -> Buffer(h, 'hex')
    return @hash buf

module.exports = Stampery
