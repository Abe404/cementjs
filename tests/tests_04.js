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

// Just test the build runs without errors and the compiled output is returned
exports["buildPage: testing you can build the core.js for a specific page."] = function (test) {
  var options = {
    root: "mockData/dependencyTree",
    path: "core.js"
  };
  test.expect(1);
  builder.buildPageScripts(options, function (compiledOutput) {
    // TODO: Check that the compiled output contains all the modules in the correct order.
    test.ok(compiledOutput.length && typeof compiledOutput === "string", "build with no errors");

    test.done();
  });
};

// Core files represtent the entry point or the "main" file for the scripts for a specific page.
exports["getCoreFiles: finding the core.js files in a multipage site"] = function (test) {
  var pathToScripts = "mockData/multiPage",
    expectedPaths = ['mockData/multiPage/page1/core.js', 'mockData/multiPage/page2/core.js'],
    corePaths = null;

  test.expect(1);
  corePaths = builder.getCoreFiles(pathToScripts);
  test.ok(JSON.stringify(corePaths) === JSON.stringify(expectedPaths), "Core paths should be same as the ones found.");
  test.done();
};

exports["buildSiteScripts: building all the pages in the site (each page should have a core.js)"] = function (test) {
  var options = {
    root: "mockData/multiPage"
  };
  test.expect(1);
  builder.buildSiteScripts(options, function () {
    test.ok(true, "assert site scripts built with no errors.");
    test.done();
  });
};