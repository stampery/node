crypto = require 'crypto'
net = require 'net'
MsgpackRPC = require 'msgpackrpc'
retry = require 'retry'
stream = require 'stream'

class Stampery
  constructor : (@apiSecret, @beta) ->
    md5 = crypto.createHash 'md5'
    md5.update @apiSecret
    md5 = md5.digest 'hex'
    @clientId = md5.substring 0, 15

    @sock = net.Socket()
    await @sock.connect 4000, 'localhost', defer err
    @rpc = new MsgpackRPC 'stampery.3', @sock
    @authed = false

  hash : (data) ->
    hash = crypto.createHash 'sha256'
    hash.update data
    hash.digest 'hex'

  hashFile : (fd, cb) ->
    hash = crypto.createHash 'sha256'
    hash.setEncoding 'hex'

    fd.on 'end', () ->
      hash.end()
      cb hash.read()

    fd.pipe hash

  stamp : (data, cb) ->
    dataHash = null
    if data instanceof stream
      await @hashFile data, defer hash
      dataHash = hash
    else
      dataHash = @hash data

    if !@authed
      await @rpc.invoke 'auth', [@clientId, @apiSecret], defer err, res
      if err
        return cb err, null
    
    @rpc.invoke 'stamp', [dataHash], cb

module.exports = Stampery
