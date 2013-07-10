/*jslint node:true, indent: 2, node:true, nomen:true*/
/*globals describe, it*/
// these test are for the build script
// the build script should resolve dependencies
// and perform minification
"use strict";
var builder,
  fs = require('fs'),
  readFile = fs.readFile,
  builder = require('../builder.js'),
  assert = require('assert');

describe("builder", function () {

  describe("validateModule", function () {
    it.only("validates module: no error when name correct", function (done) {
      var content = "";
      content += "cement.define('dashboard.mediaPanel', function (base, exports) {";
      content += "// this is the mediaPanel module";
      content += "});";
      builder.validateModule({
        root: "scripts",
        path: "scripts/dashboard/mediaPanel.js",
        content: content
      }, function (err) {
        assert(!err, "there should be no error, error found: " + err);
        done();
      });
    });

    it.only("validates module: error when name incorrect", function (done) {
      var content = "";
      content += "cement.define('dashboard.mediaPanel', function (base, exports) {";
      content += "// this is the mediaPanel module";
      content += "});";

      builder.validateModule({
        root: "scripts",
        path: "scripts/dashboard/notMediaPanel.js",
        content: content
      }, function (err) {
        assert.equal(
          err,
          "Module name(dashboard.mediaPanel) does not match its location(dashboard/notMediaPanel.js)",
          "no error found, There should be an error due to the invalid module name."
        );
        done();
      });
    });

    // error when there is no defined module found.
    it("error when no module found in file", function (test) {
      var content = "var foo = 42;",
        desiredErrorMessage = "Could not find a module defined in scripts/dashboard/mediaPanel.js";
      test.expect(1);
      try {
        builder.validateModule({
          root: "scripts",
          path: "scripts/dashboard/mediaPanel.js",
          content: content
        });
      } catch (error) {
        // "There should be an error when no module is found.
        test.ok(error.message === desiredErrorMessage, "should show multiple modules error");
        test.done();
      }
    });

    // error when there are multiple modules defined (only one must be defined in a file)
    it("error when multiple modules defined in one file", function (test) {
      var desiredErrorMessage = "Multiple module definitions found in scripts/dashboard/mediaPanel.js",
        content = "cement.define('dashboard.mediaPanel', function (base, exports) {";
      content += "// this is the module";
      content += "});";
      content += "cement.define('dashboard.mediaPanelTwo', function (base, exports) {";
      content += "// this is the module";
      content += "});";
      test.expect(1);
      try {
        builder.validateModule({
          root: "scripts",
          path: "scripts/dashboard/mediaPanel.js",
          content: content
        });
      } catch (error) {
        test.ok(error.message === desiredErrorMessage, "should show multiple modules error");
        test.done();
      }
    });
  });



  it("getRequiredModules: returns the required modules for a module", function (test) {
    var content = "",
      expectedRequiredModules = ["dashboard.menuBar", "kensei.modal", "dashboard.collectionExplorer"],
      detectedRequiredModules = null;
    content += "cement.define('dashboard.mediaPanel', function (base, exports) {";
    content += "  var menuBar = cement.require('dashboard.menuBar'),";
    content += '    modalWindow = cement.require("kensei.modal"),';
    content += "    collectionExplorer = cement.require('dashboard.collectionExplorer');";
    content += "  // this is the mediaPanel module";
    content += "});";
    test.expect(1);
    detectedRequiredModules = builder.getRequiredModules(content);
    test.ok(detectedRequiredModules.toString() === expectedRequiredModules.toString(),
      "did not detect the required modules, detected = " + detectedRequiredModules + " expected = " + expectedRequiredModules);
    test.done();
  });

  function writeTestFiles(callback) {
    fs.writeFile("fileOne", "fileOneContents", function () {
      fs.writeFile("fileTwo", "fileTwoContents", function () {
        fs.writeFile("fileThree", "fileThreeContents", function () {
          callback();
        });
      });
    });
  }
  function removeTestFiles(callback) {
    fs.unlink('fileOne', function () {
      fs.unlink('fileTwo', function () {
        fs.unlink('fileThree', function () {
          callback();
        });
      });
    });
  }
  it("combineFiles: files exist in correct order in the output", function (test) {
    var fileNames = ['fileOne', 'fileTwo', 'fileThree'];
    test.expect(3);
    // write three files to disk.
    writeTestFiles(function () {
      // once written to disk tell the builder to combine the files.
      builder.combineFiles(fileNames, function (combined) {
        // check that the builder callback has all three files in it(in order)
        test.ok(combined.indexOf("fileOneContents") !== -1, "fileOne is in the compiled output");
        test.ok(combined.indexOf("fileTwoContents") > combined.indexOf("fileOneContents"), "file two is after file one");
        test.ok(combined.indexOf("fileThreeContents") > combined.indexOf("fileTwoContents"), "file three is after file two");
        // remove the three files.
        removeTestFiles(function () {
          test.done();
        });
      });
    });
  });

  describe("getDependencyTree", function () {
    it("returns the correct depency tree",  function (test) {
      // in the tree each module is represented as an object.
      // The object has a dependencies property which is an array.
      // Each item in array is another module.  
      // This test relies on some files on the file system
      var expectedTree = [{
        name: "companyA.widgetOne",
        dependencies:
          [
            {
              name: "companyA.widgetTwo",
              dependencies: [{ name: "companyB.specialWidget", dependencies: []}]
            },
            { name: "modal", dependencies: [] }
          ]
      }],
        scriptRoot = "mockData/dependencyTree",
        modulePath = "core.js";

      test.expect(1);
      builder.getDependencyTree(scriptRoot, modulePath, function (dependencyTree) {
        test.ok(JSON.stringify(expectedTree) === JSON.stringify(dependencyTree),
          "tree was not the same, tree = " + JSON.stringify(dependencyTree) + " expected = " + JSON.stringify(expectedTree));
        test.done();
      });
    });
  });
  describe("treeToModuleList", function () {
    it("transforms the depency tree into a lint", function (test) {
      // The tree shows which modules are dependent on each other.
      // The file list will show the order in which the modules will need to be written to a file.
      // The modules at the top should be ones that dont rely on anything else (because nothing is before them)
      var dependencyTree = [{
        name: "companyA.widgetOne",
        dependencies:
          [
            {
              name: "companyA.widgetTwo",
              dependencies:
                [{ name: "companyB.specialWidget", dependencies: []}]
            },
            { name: "modal", dependencies: [] }
          ]
      }],
        expectedModuleList = [
          "companyB.specialWidget",
          "companyA.widgetTwo",
          "modal",
          "companyA.widgetOne"
        ],
        list = builder.treeToModuleList(dependencyTree);
      test.expect(1);
      test.ok(JSON.stringify(expectedModuleList) === JSON.stringify(list), "list is correct");
      test.done();
    });
  });

  // Just test the build runs without errors and the compiled output is returned
  describe("buildPageScripts", function () {
    it("builds the scripts from a core.js file without throwing an error", function (done) {
      var options = {
        root: "mockData/dependencyTree",
        path: "core.js"
      };
      builder.buildPageScripts(options, function (compiledOutput) {
        assert(compiledOutput.length && typeof compiledOutput === "string", "build with no errors");
        done();
      });
    });
    it("produces compiled output that contains all the modules in the correct order.");
  });

// Core files represtent the entry point or the "main" file for the scripts for a specific page.
  describe("getCoreFiles", function () {
    it("findes the core.js files in a multipage site", function (done) {
      var pathToScripts = "mockData/multiPage",
        expectedPaths = ['mockData/multiPage/page1/core.js', 'mockData/multiPage/page2/core.js'],
        corePaths = null;

      corePaths = builder.getCoreFiles(pathToScripts);
      assert(JSON.stringify(corePaths) === JSON.stringify(expectedPaths), "Core paths should be same as the ones found.");
      done();
    });
  });
  describe("buildSiteScripts", function () {
    it("builds all the pages in the site (each page should have a core.js)", function (done) {
      var options = {
        root: __dirname + "/mockData/multiPage"
      };
      console.log(options);
      builder.buildSiteScripts(options, function (err) {
        assert(!err, "assert site scripts built with no errors.");
        done();
      });
    });
  });
});