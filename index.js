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
    Stampery.prototype.hashCache = [];

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
      var err, idx, ok, ___iced_passed_deferral, __iced_deferrals, __iced_k;
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
            lineno: 19
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (err) {
            return console.log("[QUEUE] Error connecting " + err);
          }
          _this.rabbit.on('error', _this._connectRabbit);
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "./index.iced",
              funcname: "Stampery._connectRabbit"
            });
            _this.rabbit.createChannel(__iced_deferrals.defer({
              assign_fn: (function(__slot_1) {
                return function() {
                  err = arguments[0];
                  return __slot_1.channel = arguments[1];
                };
              })(_this),
              lineno: 23
            }));
            __iced_deferrals._fulfill();
          })(function() {
            if (_this.rabbit && _this.hashCache.length !== 0) {
              (function(__iced_k) {
                var _i, _k, _keys, _ref, _results, _while;
                _ref = _this.hashCache;
                _keys = (function() {
                  var _results1;
                  _results1 = [];
                  for (_k in _ref) {
                    _results1.push(_k);
                  }
                  return _results1;
                })();
                _i = 0;
                _while = function(__iced_k) {
                  var _break, _continue, _next;
                  _break = __iced_k;
                  _continue = function() {
                    return iced.trampoline(function() {
                      ++_i;
                      return _while(__iced_k);
                    });
                  };
                  _next = _continue;
                  if (!(_i < _keys.length)) {
                    return _break();
                  } else {
                    idx = _keys[_i];
                    (function(__iced_k) {
                      if (_this.channel) {
                        (function(__iced_k) {
                          __iced_deferrals = new iced.Deferrals(__iced_k, {
                            parent: ___iced_passed_deferral,
                            filename: "./index.iced",
                            funcname: "Stampery._connectRabbit"
                          });
                          _this.channel.assertQueue("" + _this.hashCache[idx] + "-clnt", {
                            durable: true
                          }, __iced_deferrals.defer({
                            assign_fn: (function() {
                              return function() {
                                err = arguments[0];
                                return ok = arguments[1];
                              };
                            })(),
                            lineno: 27
                          }));
                          __iced_deferrals._fulfill();
                        })(__iced_k);
                      } else {
                        return __iced_k();
                      }
                    })(_next);
                  }
                };
                _while(__iced_k);
              })(__iced_k);
            } else {
              return __iced_k();
            }
          });
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
            lineno: 48
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          console.log(err, res);
          if (err) {
            return console.log("[RPC] Auth error: " + err);
          }
        };
      })(this));
    };

    Stampery.prototype.stamp = function(hash, cb) {
      var err, ok, res, ___iced_passed_deferral, __iced_deferrals, __iced_k;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      this.hashCache.push(hash);
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
            lineno: 55
          }));
          __iced_deferrals._fulfill();
        });
      })(this)((function(_this) {
        return function() {
          if (err) {
            console.log("[RPC] Error: " + err);
            return cb(err, null);
          }
          console.log(cb);
          if (ok) {
            console.log("[QUEUE] Bound to " + hash + "-clnt");
            (function(__iced_k) {
              if (_this.channel) {
                (function(__iced_k) {
                  __iced_deferrals = new iced.Deferrals(__iced_k, {
                    parent: ___iced_passed_deferral,
                    filename: "./index.iced",
                    funcname: "Stampery.stamp"
                  });
                  _this.channel.assertQueue("" + hash + "-clnt", {
                    durable: true
                  }, __iced_deferrals.defer({
                    assign_fn: (function() {
                      return function() {
                        err = arguments[0];
                        return ok = arguments[1];
                      };
                    })(),
                    lineno: 63
                  }));
                  __iced_deferrals._fulfill();
                })(__iced_k);
              } else {
                return __iced_k();
              }
            })(function() {
              return __iced_k(channel.consume("" + hash + "-clnt", function(msg) {
                delete this.hashCache[this.hashCache.indexOf(hash)];
                console.log("[QUEUE] Received -> %s", msg.content.toString());
                channel.ack(msg);
                return cb(null, msg);
              }));
            });
          } else {
            return __iced_k(cb("Error binding to " + hash + "-clnt", null));
          }
        };
      })(this));
    };

    return Stampery;

  })();

  module.exports = Stampery;

}).call(this);
