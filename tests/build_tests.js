/*jslint node:true*/
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
exports.tearDown = function (callback) {
  // delete compiledModuleA 
  fs.unlink('output/compiledModuleA.js', function (err) {
    fs.unlink('output/compiledModuleC.js', function (err) {
      callback();
    });
  });
};

//exports['error for cyclic dependency'] = function (test) {
//  test.ok(false, "implemented");  
//  test.done();
//};


exports["resolving single dependency"] = function (test) {
  var moduleAText = null,
    moduleBText = null;
  test.expect(6);
  test.ok(builder, "build module exists");
  // there are 2 files (moduleA.js and moduleB.js)
  // module A requires module B
  function getModuleA(callback) {
    readFile('mockdata/moduleA.js', function (err, data) {
      if (err) {
        throw err;
      }
      moduleAText = data.toString();
      test.ok(moduleAText, "module A exists");
      callback();
    });
  }
  function getModuleB(callback) {
    readFile('mockdata/moduleB.js', function (err, data) {
      moduleBText = data.toString();
      test.ok(moduleBText, "module B exists");
      callback();
    });
  }
  // check that the dependencies were resolved correctly
  function checkBuildSuccess() {
    readFile('output/compiledModuleA.js', function (err, data) {
      var compiledText = data.toString();
      // check that the compiled module contains all of module A
      test.ok(compiledText.indexOf(moduleAText) !== -1, "moduleA is in the compiled output");
      // check that the compiled module contains all of module B
      // as module B is a dependency of module A make sure that module B 
      // is defined before moduleA in the file
      test.ok(compiledText.indexOf(moduleBText) !== -1, "moduleB is in the compiled output");
      test.ok(compiledText.indexOf(moduleAText) > compiledText.indexOf(moduleBText),
        "moduleA is after moduleB as moduleA depends on B.");
      test.done();
    });
  }
  // run the build process and on success check depencies were resolved correctly 
  function runBuild() {
    // check that the build module resolves dependencies.
    // tell it to build moduleA
    builder.build(
      {
        target: 'mockdata/moduleA.js',
        output: 'output/compiledModuleA.js'
      },
      checkBuildSuccess
    );
  }
  getModuleA(function () {
    getModuleB(runBuild);
  });
};

exports["resolving multiple dependency"] = function (test) {
  // test files modules C D and E
  // C requires both D and E
  test.expect(2);
  builder.build({target: 'mockdata/moduleC.js', output: 'output/compiledModuleC.js'}, function () {
    // check that D and E are both included before C
    readFile('output/compiledModuleC.js', function (err, compiled) {
      compiled = compiled.toString();
      var cIndex = compiled.indexOf("cement.define('moduleC"),
        dIndex = compiled.indexOf("cement.define('moduleD"),
        eIndex = compiled.indexOf("cement.define('moduleE");
      test.ok(dIndex > -1 && dIndex < cIndex, "d included before c");
      test.ok(eIndex > -1 && eIndex < cIndex, "e included before c");
      test.done();
    });
  });
};

exports["resolving deep dependency"] = function (test) {
  // test files modules F A B 
  // F requires A and A requires B
  // F - A - B
  // run build on F.
  // check that A and B are in the output
  // and that the order is (top to bottom)
  // B A F
  
  test.done();
};





