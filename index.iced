crypto = require 'crypto'
request = require 'request'

class Stampery
  constructor : (@apiSecret, @beta) ->
    md5 = crypto.createHash 'md5'
    md5.update @apiSecret
    md5 = md5.digest 'hex'

    @clientId = md5.substring 0, 15
    auth = new Buffer("#{@clientId}:#{@apiSecret}").toString 'base64'

    @req = request.defaults
      baseUrl: if not @beta then 'https://stampery.herokuapp.com/api/v2' else 'https://beta.stampery.co/api/v2'
      json: true
      headers: {'Authorization': auth}

  hash : (data) ->
    hash = crypto.createHash 'sha256'
    hash.update data
    return hash.digest 'hex'

  stamp : (data, cb) -> @_stampJSON data, cb

  _stampJSON : (data, cb) ->
    await @req.post
      uri: '/stamps'
      json: data
    , defer err, res, body
    cb err, res.body?.hash

  ###_stampFile : (fileName, fileHash, extra, cb) ->
    formData =
      fileName: fileName
      extra: JSON.stringify extra

    if typeof fileHash isnt 'string'
      data = fileHash

      formData.fileHash = @hash data
      formData.file =
        value: data
        options:
          filename: fileName

    else
      formData.fileHash = fileHash
      formData.fileSize = 0

    await @req.post
      uri: '/stamps'
      formData: formData
    , defer err, res
    err = if err then err else res.body?.err
    cb err, res.body?.fileHash###

  get : (hash, cb) ->
    await @req.get "/stamps/#{hash}", defer err, res
    cb err, res.body?.stamp

module.exports = Stampery
