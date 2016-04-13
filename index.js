(function() {
  var MsgpackRPC, Stampery, crypto, iced, net, retry, stream, __iced_k, __iced_k_noop;

  iced = require('iced-runtime');
  __iced_k = __iced_k_noop = function() {};

  crypto = require('crypto');

  net = require('net');

  MsgpackRPC = require('msgpackrpc');

  retry = require('retry');

  stream = require('stream');

  Stampery = (function() {
    function Stampery(apiSecret, beta) {
      var err, md5, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      this.apiSecret = apiSecret;
      this.beta = beta;
      md5 = crypto.createHash('md5');
      md5.update(this.apiSecret);
      md5 = md5.digest('hex');
      this.clientId = md5.substring(0, 15);
      this.sock = net.Socket();
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery"
          });
          _this.sock.connect(4000, 'localhost', __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                return err = arguments[0];
              };
            })(),
            lineno: 14
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          _this.rpc = new MsgpackRPC('stampery.3', _this.sock);
          return _this.authed = false;
        };
      })(this));
    }

    Stampery.prototype.hash = function(data) {
      var hash;
      hash = crypto.createHash('sha256');
      hash.update(data);
      return hash.digest('hex');
    };

    Stampery.prototype.hashFile = function(fd, cb) {
      var hash;
      hash = crypto.createHash('sha256');
      hash.setEncoding('hex');
      fd.on('end', function() {
        hash.end();
        return cb(hash.read());
      });
      return fd.pipe(hash);
    };

    Stampery.prototype.stamp = function(data, cb) {
      var dataHash, err, hash, res, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      dataHash = null;
      (function(_this) {
        return (function(__iced_k) {
          if (data instanceof stream) {
            (function(__iced_k) {
              __iced_deferrals = new iced.Deferrals(__iced_k, {
                parent: ___iced_passed_deferral,
                filename: "./index.iced",
                funcname: "Stampery.stamp"
              });
              _this.hashFile(data, __iced_deferrals.defer({
                assign_fn: (function() {
                  return function() {
                    return hash = arguments[0];
                  };
                })(),
                lineno: 36
              }));
              __iced_deferrals._fulfill();
            })(function() {
              return __iced_k(dataHash = hash);
            });
          } else {
            return __iced_k(dataHash = _this.hash(data));
          }
        });
      })(this)((function(_this) {
        return function() {
          (function(__iced_k) {
            if (!_this.authed) {
              (function(__iced_k) {
                __iced_deferrals = new iced.Deferrals(__iced_k, {
                  parent: ___iced_passed_deferral,
                  filename: "./index.iced",
                  funcname: "Stampery.stamp"
                });
                _this.rpc.invoke('auth', [_this.clientId, _this.apiSecret], __iced_deferrals.defer({
                  assign_fn: (function() {
                    return function() {
                      err = arguments[0];
                      return res = arguments[1];
                    };
                  })(),
                  lineno: 42
                }));
                __iced_deferrals._fulfill();
              })(function() {
                if (err) {
                  return cb(err, null);
                }
                return __iced_k();
              });
            } else {
              return __iced_k();
            }
          })(function() {
            return _this.rpc.invoke('stamp', [dataHash], cb);
          });
        };
      })(this));
    };

    return Stampery;

  })();

  module.exports = Stampery;

}).call(this);
