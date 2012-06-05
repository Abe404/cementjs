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
  fs.unlink('compiledModuleA.js', function (err) {
    callback();
  });
};

//exports['error for cyclic dependency'] = function (test) {
//  test.ok(false, "implemented");  
//  test.done();
//};

//exports["resolving deep dependency"] = function (test) {
  // test files modules F G H 
  // test.ok(false, "implemented");  
  // F requires G and G requires H
  // run build F.
  // check that G and H are in the output
  // and that the order is (top to bottom)
  // H G F
  // test.done();
//};

exports["resolving multiple dependency"] = function (test) {
  // test files modules C D and E
  // C requires both D and E
  test.expect(2);
  builder.build({target: 'moduleC.js', output: 'compiledModuleC.js'}, function () {
    var moduleC = null,
      moduleD = null,
      moduleE = null;
    function checkOrder() {
      // check that D and E are both included before C
      readFile('compiledModuleC.js', function (err, compiled) {
        compiled = compiled.toString();
        var cIndex = compiled.indexOf(moduleC),
          dIndex = compiled.indexOf(moduleD),
          eIndex = compiled.indexOf(moduleE);

        test.ok(dIndex > -1 && dIndex < cIndex, "d included before c");
        test.ok(eIndex > -1 && eIndex < cIndex, "e included before c");
        test.done();
      });
    }
    readFile('moduleC.js', function (err, data) {
      moduleC = data.toString();
      if (moduleC && moduleD) {
        checkOrder();
      }
    });
    readFile('moduleD.js', function (err, data) {
      moduleD = data.toString();
      if (moduleC && moduleD) {
        checkOrder();
      }
    });
  });
};

exports["resolving single dependency"] = function (test) {
  var moduleAText = null,
    moduleBText = null;
  test.expect(6);
  test.ok(builder, "build module exists");
  // there are 2 files (moduleA.js and moduleB.js)
  // module A requires module B
  function getModuleA(callback) {
    readFile('moduleA.js', function (err, data) {
      if (err) {
        throw err;
      }
      moduleAText = data.toString();
      test.ok(moduleAText, "module A exists");
      callback();
    });
  }
  function getModuleB(callback) {
    readFile('moduleB.js', function (err, data) {
      moduleBText = data.toString();
      test.ok(moduleBText, "module B exists");
      callback();
    });
  }
  // check that the dependencies were resolved correctly
  function checkBuildSuccess() {
    readFile('compiledModuleA.js', function (err, data) {
      var compiledText = data.toString();
      // check that the compiled module contains all of module A
      test.ok(compiledText.indexOf(moduleAText) !== -1, "moduleA is in the compiled output");
      // check that the compiled module contains all of module B
      // as module B is a dependency of module A make sure that module B 
      // is defined before moduleA in the file
      test.ok(compiledText.indexOf(moduleBText) !== -1, "moduleB is in the output");
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
        target: 'moduleA.js',
        output: 'compiledModuleA.js'
      },
      checkBuildSuccess
    );
  }
  getModuleA(function () {
    getModuleB(runBuild);
  });
};
