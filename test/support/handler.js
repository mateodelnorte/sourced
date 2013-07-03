var db = require('my_db_lib'),
    dep2 = require('./handler2');

module.exports.method = function onboardUser (event) {

  // we want to test this function's behavior, but need to isolate the behavior of the module apart from the behavior of it's dependency, the db. 

  db.User.findByEmail(event.email, function (err, user) {
    if(err) throw err;

    user.onboarding = 'complete';

    user.save(function (err) { 
      if(err) throw err; 
    });
  });
};

module.exports.childDependency = db;

module.exports.childDependency2 = dep2;
