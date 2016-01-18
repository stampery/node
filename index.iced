crypto = require 'crypto'
request = require 'request'
stream = require 'stream'
retry = require 'retry'

class Stampery
  constructor : (@apiSecret, @beta) ->
    md5 = crypto.createHash 'md5'
    md5.update @apiSecret
    md5 = md5.digest 'hex'

    @clientId = md5.substring 0, 15
    auth = new Buffer("#{@clientId}:#{@apiSecret}").toString 'base64'

    @req = request.defaults
      baseUrl: if not @beta then 'https://api.stampery.com/v2' else 'https://stampery-api-beta.herokuapp.com/v2'
      json: true
      headers: {'Authorization': auth}

  hash : (data) ->
    hash = crypto.createHash 'sha256'
    hash.update data
    hash.digest 'hex'

  stamp : (data, file, cb) ->
    if file? and cb?
      @_stampFile data, file, cb
    else
      @_stampJSON data, file

  _stampJSON : (data, cb) ->
    operation = retry.operation({
      retries: 3
      minTimeout: 2 * 1000
      maxTimeout: 2 * 1000
    })
    operation.attempt (currentAttempt) =>
      await @req.post
        uri: '/stamps'
        json: data
      , defer err, res, body
      if operation.retry(err)
        return

      cb (if err then operation.mainError() else null), res.body?.hash

  _stampFile : (data = {}, file, cb) ->
    operation = retry.operation({
      retries: 3
      minTimeout: 2 * 1000
      maxTimeout: 2 * 1000
    })
    operation.attempt (currentAttempt) =>
      formData = {data}
      if file instanceof stream
        file.path? and formData.data.name = file.path.split('/').slice(-1)[0]

      formData.file =
        value: file
        options:
          filename: formData.data.name

      formData.data = JSON.stringify formData.data

      await @req.post
        uri: '/stamps'
        formData: formData
      , defer err, res, body
      if operation.retry(err)
        return

      cb (if err then operation.mainError() else null), res.body?.hash

  get : (hash, cb) ->
    await @req.get "/stamps/#{hash}", defer err, res
    cb err, res.body?.stamp

module.exports = Stampery
