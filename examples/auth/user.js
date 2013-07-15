var Entity = require('../../lib/entity'),
    events = require('events'),
    util = require('util');

function User () {
  this.apps = {};
  this.username = '';
  this.password = this.pass = '';

  Entity.call(this);
}

util.inherits(User, Entity);

User.prototype.grant = function (param) {
  this.apps[param.appId] = param.appId;
  this.apply('grant', param);
  this.emit('granted', param, this);
};

User.prototype.provision = function (param) {
  this.username = param.username;
  this.password = param.password || param.pass;
  this.apply('provision', param);
  this.emit('provisioned', this);
};

User.prototype.revoke = function (param) {
  delete this.apps[param.appId];
  this.apply('revoke', param);
  this.emit('revoked', param, this);
};

module.exports = User;
