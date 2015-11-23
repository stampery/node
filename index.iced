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
      baseUrl: if not @beta then 'https://stampery.herokuapp.com/api/v2' else 'https://stampery-beta.herokuapp.com/api/v2'
      json: true
      headers: {'Authorization': auth}

  hash : (data) ->
    hash = crypto.createHash 'sha256'
    hash.update data
    hash.digest 'hex'

  stamp : (data, name, file, cb) ->
    if name and file
      @_stampFile data, name, file, cb
    else
      @_stampJSON data, name

  _stampJSON : (data, cb) ->
    await @req.post
      uri: '/stamps'
      json: data
    , defer err, res, body
    cb err, res.body?.hash

  _stampFile : (data = {}, name, file, cb) ->
    formData = {data}

    formData.file =
      value: file
      options:
        filename: name

    formData.data = JSON.stringify formData.data
    console.log formData

    await @req.post
      uri: '/stamps'
      formData: formData
    , defer err, res, body
    cb err, res.body?.hash

  get : (hash, cb) ->
    await @req.get "/stamps/#{hash}", defer err, res
    cb err, res.body?.stamp

module.exports = Stampery
