chai = require 'chai'
chai.should()

Stampery = require '../src/stampery'
stampery = new Stampery 'd931b968-bcc1-4b18-e732-7fd875bcab96', 'beta'


describe 'Constructor', ->

  it 'should be constructed', ->
    stampery.should.have.property 'prove'

  it 'should set environment', ->
    stampery.env.should.equal 'beta'

  it 'should calculate client ID', ->
    stampery.clientId.should.equal '6583e8d3f3f1d0d'

  it 'should calculate basic auth', ->
    exp = 'Basic NjU4M2U4ZDNmM2YxZDBkOmQ5MzFiOTY4LWJjYzEtNGIxOC1lNzMyLTdmZDg3NWJjYWI5Ng=='
    stampery.auth.should.equal exp


describe 'Hashing', ->

  it 'should hash strings', ->
    exp = Buffer '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'hex'
    stampery.hash('foo').equals(exp).should.equal true

  it 'should hash buffers', ->
    buf = Buffer 'foo'
    exp = Buffer '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'hex'
    stampery.hash(buf).equals(exp).should.equal true


describe 'Merkling', ->

  it 'should mix 2 hashes', ->
    a = Buffer '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'hex'
    b = Buffer 'fcde2b2edba56bf408601fb721fe9b5c338d10ee429ea04fae5511b68fbf8fb9', 'hex'
    ab = Buffer '92475004e70f41b94750f4a77bf7b430551113b25d3d57169eadca5692bb043d', 'hex'
    ba = Buffer 'b6384b8a8c9ad97e91da8b68062a03e397ee831f62eb917bd9fe7289cd32eb0b', 'hex'

    stampery._merkleMix([a, b]).equals(ab).should.equal true
    stampery._merkleMix([b, a]).equals(ba).should.equal true

  it 'should mix 100 hashes', ->
    h = Buffer '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'hex'
    res = Buffer '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae', 'hex'
    exp = Buffer '4986bd87e3cdf7e059f90807a0183551fc6e7e330b07ef1e9137664c4c169063', 'hex'

    for i in [0..99] by 1
      res = stampery._merkleMix([res, h])

    res.equals(exp).should.equal true


 describe 'Stamping', ->
   @timeout 30000

   it 'should stamp', () ->
     h = stampery.hash "the piano has been drinking #{Math.random()}"
     stampery.stamp h
      .then (stamp) ->
        stamp.should.be.a 'object'
        stamp.should.have.property 'id'
        stamp.should.have.property 'time'
        stamp.hash.should.equal h.toString('hex').toUpperCase()
        stamp.token.should.equal stampery.clientId
        stamp.should.have.property 'receipts'
        stamp.receipts.should.be.a 'object'
        stamp.receipts.eth.should.be.a 'number'
        stamp.receipts.btc.should.be.a 'number'
      .catch (req) ->
        console.log req

describe 'Proving', ->

  it 'should retrieve receipts by ID', () ->
    id = '588722b836404000049dfa6f'
    stampery.getById id
      .then (stamp) ->
        stamp.should.be.a 'object'
        stamp.id.should.equal id
        stamp.should.have.property 'time'
        stamp.token.should.equal stampery.clientId
        stamp.receipts.should.be.a 'object'
        stamp.receipts.eth.should.be.a 'object'
        stamp.receipts.btc.should.be.a 'object'
      .catch (error) ->
        error.should.not.equal null

  it 'should retrieve receipts by hash', () ->
    h = Buffer '67d6d9f488ec27ecb15fc67e766261a554c13098b4057d66caa2174b3264ea47', 'hex'
    stampery.getByHash h
      .then (stamp) ->
        stamps.should.be.a 'array'
        stamps.should.have.length.above 0
        stamp = stamps[0]
        stamp.should.be.a 'object'
        stamp.should.have.property 'id'
        stamp.should.have.property 'time'
        stamp.token.should.equal stampery.clientId
        stamp.hash.should.equal h.toString('hex').toUpperCase()
        stamp.receipts.should.be.a 'object'
        stamp.receipts.eth.should.be.a 'object'
        stamp.receipts.btc.should.be.a 'object'
      .catch (error) ->
        error.should.not.equal null

  it 'should prove whole stamps', () ->
    id = '588722b836404000049dfa6f'
    stampery.getById id
      .then (stamp) ->
        stampery.prove(stamp).should.equal true
      .catch (error) ->
        error.should.not.equal null

  it 'should prove dual receipts objects', () ->
    id = '588722b836404000049dfa6f'
    stampery.getById id
      .then (stamp) ->
        stampery.prove(stamp.receipts).should.equal true
      .catch (error) ->
        error.should.not.equal null

  it 'should prove chain-specific receipt objects', () ->
    id = '588722b836404000049dfa6f'
    stampery.getById id
      .then (stamp) ->
        stampery.prove(stamp.receipts.btc).should.equal true
      .catch (error) ->
        error.should.not.equal null

  it 'should fail to prove tampered hashes', () ->
    id = '588722b836404000049dfa6f'
    stampery.getById id
      .then (stamp) ->
        stamp.receipts.btc.targetHash = '0' + stamp.receipts.btc.targetHash.slice(1)
        stampery.prove(stamp.receipts.btc).should.equal false
      .catch (error) ->
        error.should.not.equal null

  it 'should prove chainpoint example receipt', ->
    receipt = {
     "@context": "https://w3id.org/chainpoint/v2",
     "type": "ChainpointSHA256v2",
     "targetHash": "bdf8c9bdf076d6aff0292a1c9448691d2ae283f2ce41b045355e2c8cb8e85ef2",
     "merkleRoot": "51296468ea48ddbcc546abb85b935c73058fd8acdb0b953da6aa1ae966581a7a",
     "proof": [
       {
         "left": "bdf8c9bdf076d6aff0292a1c9448691d2ae283f2ce41b045355e2c8cb8e85ef2"
       },
       {
         "left": "cb0dbbedb5ec5363e39be9fc43f56f321e1572cfcf304d26fc67cb6ea2e49faf"
       },
       {
         "right": "cb0dbbedb5ec5363e39be9fc43f56f321e1572cfcf304d26fc67cb6ea2e49faf"
       }
     ],
     "anchors": [
       {
         "type": "BTCOpReturn",
         "sourceId": "f3be82fe1b5d8f18e009cb9a491781289d2e01678311fe2b2e4e84381aafadee"
       }
     ]
    }
    stampery.prove(receipt).should.equal true

