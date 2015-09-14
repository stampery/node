crypto = require 'crypto'
request = require 'request'

class Stampery
  constructor : (@api_key, @beta) ->
    @req = request.defaults
      baseUrl: if not @beta then 'https://stampery.co/api/v1' else 'https://beta.stampery.co/api/v1'
      json: true
      headers: {'x-user-token': @api_key}

  hash : (data) ->
    hash = crypto.createHash 'sha256'
    hash.update data
    return hash.digest 'hex'

  stamp : (fileName, fileHash, extra, cb) ->
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
      baseUrl: 'https://stampery.herokuapp.com/api/v1' if not @beta
      url: '/stamp'
      formData: formData
    , defer err, res
    err = if err then err else res.body?.err
    cb err, res.body?.fileHash

  get : (id, cb) ->
    await @req.get "/stamp/#{id}", defer err, res
    cb err, res.body?.stamp

  proof : (id, cb) ->
    await @req.get "/stamp/#{id}/proof", defer err, res
    cb err, res.body?.proof

  #searchUsers : (q, cb) ->
  #  await @req.get {url: '/users', qs: {q}}, defer err, res
  #  cb err, res.body?.users

module.exports = Stampery
