var Value = require('../../dist/index').Value;

module.exports.create = function (app) {
  return Value(app);
};

module.exports.equal = function (app, app2) {
  return app.id === app2.id;
};
