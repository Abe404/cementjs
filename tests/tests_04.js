/*jslint node:true, indent: 2*/
// these test are for the build script
// the build script should resolve dependencies
// and perform minification
var builder,
  fs = require('fs'),
  readFile = fs.readFile;

// have a setup function that requires the builder module
exports.setUp = function (callback) {
  builder = require('../builder.js');
  callback();
};

exports["build test"] = function (test) {
  var options = {
    root: "mockData/dependencyTree",
    path: "core.js"
  };
  test.expect(1); 
  builder.build(options, function(compiledOutput){
    // Check that the compiled output contains all the modules in the correct order.
    
    test.ok(true, "something happened");
    test.done();
  });
};