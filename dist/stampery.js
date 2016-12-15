(function() {
  var Stampery, crypto, request,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  crypto = require('crypto');

  request = require('request');

  Stampery = (function() {
    function Stampery(clientSecret, env) {
      var buf;
      this.clientSecret = clientSecret;
      this.env = env;
      this._merkleMix = bind(this._merkleMix, this);
      this._checkSiblings = bind(this._checkSiblings, this);
      this.prove = bind(this.prove, this);
      this._req = bind(this._req, this);
      this._post = bind(this._post, this);
      this._get = bind(this._get, this);
      this.stamp = bind(this.stamp, this);
      this.getAll = bind(this.getAll, this);
      this.getByHash = bind(this.getByHash, this);
      this.getById = bind(this.getById, this);
      this.clientId = crypto.createHash('md5').update(this.clientSecret).digest('hex').substring(0, 15);
      console.log(this.clientId, this.clientSecret);
      buf = new Buffer(this.clientId + ":" + this.clientSecret);
      this.auth = 'Basic ' + buf.toString('base64');
      this.host = this.env === 'beta' ? 'http://api-beta.stampery.com' : 'https://api.stampery.com';
    }

    Stampery.prototype.hash = function(string) {
      return crypto.createHash('sha256').update(string).digest();
    };

    Stampery.prototype.getById = function(stamp_id, cb) {
      return this._get("stamps/" + stamp_id, function(err, res) {
        if (res) {
          res = res[0];
        }
        return cb(err, res);
      });
    };

    Stampery.prototype.getByHash = function(hash, cb) {
      return this._get("stamps/" + hash, cb);
    };

    Stampery.prototype.getAll = function(cb, aux) {
      var page, ref;
      ref = aux != null ? [cb, aux] : [0, cb], page = ref[0], cb = ref[1];
      return this._get("stamps?page=" + page, cb);
    };

    Stampery.prototype.stamp = function(hash, cb) {
      if (hash instanceof Buffer) {
        hash = hash.toString('hex');
      }
      return this._post("stamps", {
        hash: hash
      }, cb);
    };

    Stampery.prototype._get = function(path, cb) {
      return this._req('GET', path, {}, cb);
    };

    Stampery.prototype._post = function(path, params, cb) {
      return this._req('POST', path, params, cb);
    };

    Stampery.prototype._req = function(method, path, params, cb) {
      var options;
      options = {
        method: method,
        url: this.host + "/" + path,
        headers: {
          'Authorization': this.auth,
          'Content-Type': 'application/json'
        }
      };
      if (params) {
        options.json = JSON.stringify(params);
      }
      return request(options, function(error, response, body) {
        if (error) {
          return cb(error, null);
        } else {
          return cb(body.error, body.result);
        }
      });
    };

    Stampery.prototype.prove = function(receipts) {
      var receipt;
      if ('receipts' in receipts) {
        receipts = receipts.receipts;
      }
      console.log('Proving', receipts);
      receipt = receipts.btc || receipts.eth;
      if (receipt) {
        return this._checkSiblings(receipt.targetHash, receipt.proof, receipt.merkleRoot);
      } else {
        return false;
      }
    };

    Stampery.prototype._checkSiblings = function(hash, siblings, root) {
      var hashes, head, mix, tail;
      if (siblings.length > 0) {
        head = siblings[0];
        tail = siblings.slice(1);
        hashes = 'left' in [head.left, hash] ? [hash, head.left] : void 0;
        mix = this._merkleMix(hashes);
        return _checkSiblings(mix, tail, root);
      } else {
        return hash === root;
      }
    };

    Stampery.prototype._merkleMix = function(hashes) {
      var buf;
      buf = Buffer.concat(hashes.map(function(h) {
        return Buffer(h, 'hex');
      }));
      return this.hash(buf);
    };

    return Stampery;

  })();

  module.exports = Stampery;

}).call(this);
