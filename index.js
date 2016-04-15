(function() {
  var MsgpackRPC, RockSolidSocket, Stampery, amqp, crypto, iced, stream, __iced_k, __iced_k_noop,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  iced = require('iced-runtime');
  __iced_k = __iced_k_noop = function() {};

  crypto = require('crypto');

  stream = require('stream');

  RockSolidSocket = require('rocksolidsocket');

  MsgpackRPC = require('msgpackrpc');

  amqp = require('amqplib/callback_api');

  Stampery = (function() {
    function Stampery(clientSecret, beta) {
      var sock;
      this.clientSecret = clientSecret;
      this.beta = beta;
      this._connectRabbit = __bind(this._connectRabbit, this);
      this.clientId = this._hash('md5', this.clientSecret).substring(0, 15);
      sock = new RockSolidSocket('localhost:4000');
      this.rpc = new MsgpackRPC('stampery.3', sock);
      this._auth();
      this._connectRabbit();
    }

    Stampery.prototype._connectRabbit = function() {
      var err, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery._connectRabbit"
          });
          amqp.connect('amqp://consumer:9FBln3UxOgwgLZtYvResNXE7@young-squirrel.rmq.cloudamqp.com/ukgmnhoi', __iced_deferrals.defer({
            assign_fn: (function(__slot_1) {
              return function() {
                err = arguments[0];
                return __slot_1.rabbit = arguments[1];
              };
            })(_this),
            lineno: 16
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (err) {
            return console.log(console.log("[QUEUE] Error connecting " + err));
          }
          return _this.rabbit.on('error', _this._connectRabbit);
        };
      })(this));
    };

    Stampery.prototype._hash = function(algo, data) {
      return crypto.createHash(algo).update(data).digest('hex');
    };

    Stampery.prototype.hash = function(data, cb) {
      if (data instanceof stream) {
        return this._hashFile(data, cb);
      } else {
        return this._hash('sha256', data);
      }
    };

    Stampery.prototype._hashFile = function(fd, cb) {
      var hash;
      hash = crypto.createHash('sha256');
      hash.setEncoding('hex');
      fd.on('end', function() {
        hash.end();
        return cb(hash.read());
      });
      return fd.pipe(hash);
    };

    Stampery.prototype._auth = function() {
      var err, res, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery._auth"
          });
          _this.rpc.invoke('auth', [_this.clientId, _this.clientSecret], __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                err = arguments[0];
                return res = arguments[1];
              };
            })(),
            lineno: 39
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (err) {
            return console.log("[RPC] Auth error: " + err);
          }
        };
      })(this));
    };

    Stampery.prototype.stamp = function(hash, cb) {
      var channel, err, res, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      if (!this.rabbit) {
        return setTimeout(this.stamp.bind(this, hash, cb), 500);
      }
      (function(_this) {
        return (function(__iced_k) {
          __iced_deferrals = new iced.Deferrals(__iced_k, {
            parent: ___iced_passed_deferral,
            filename: "./index.iced",
            funcname: "Stampery.stamp"
          });
          _this.rpc.invoke('stamp', [hash], __iced_deferrals.defer({
            assign_fn: (function() {
              return function() {
                err = arguments[0];
                return res = arguments[1];
              };
            })(),
            lineno: 45
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (err) {
            return console.log("[RPC] Error: " + err);
          }
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery.stamp"
            });
            _this.rabbit.createChannel(__iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  err = arguments[0];
                  return channel = arguments[1];
                };
              })(),
              lineno: 48
            }));
            __iced_deferrals._fulfill();
          })(function() {
            console.log("[QUEUE] Bound to " + hash + "-clnt");
            return channel.consume("" + hash + "-clnt", function(msg) {
              console.log("[QUEUE] Received -> %s", msg.content.toString());
              channel.ack(msg);
              return cb(msg);
            });
          });
        };
      })(this));
    };

    return Stampery;

  })();

  module.exports = Stampery;

}).call(this);
