/*jslint node:true, indent: 2, node:true, nomen:true*/
/*globals describe, it*/
// these test are for the build script
// the build script should resolve dependencies
// and perform minification
"use strict";
var mixer,
  fs = require('fs'),
  readFile = fs.readFile,
  mixer = require('../../src/server/mixer.js'),
  assert = require('assert');

describe("mixer", function () {

  describe("validateModule", function () {
    it("validates module: no error when name correct", function (done) {
      var content = "";
      content += "cement.define('dashboard.mediaPanel', function (base, exports) {";
      content += "// this is the mediaPanel module";
      content += "});";
      try {
        mixer.validateModule({
          root: "scripts",
          path: "scripts/dashboard/mediaPanel.js",
          content: content
        });
      } catch (err) {
        assert(!err, "there should be no error, error found: " + err);
      }
      done();
    });

    it("validates module: error when name incorrect", function (done) {
      var content = "";
      content += "cement.define('dashboard.mediaPanel', function (base, exports) {";
      content += "// this is the mediaPanel module";
      content += "});";
      try {
        mixer.validateModule({
          root: "scripts",
          path: "scripts/dashboard/notMediaPanel.js",
          content: content
        });
      } catch (err) {
        assert.equal(
          err.message,
          "Module name(dashboard.mediaPanel) does not match its location(dashboard/notMediaPanel.js)",
          "no error found, There should be an error due to the invalid module name."
        );
        done();
      }
    });

    // error when there is no defined module found.
    it("error when no module found in file", function (done) {
      var content = "var foo = 42;",
        desiredErrorMessage = "Could not find a module defined in scripts/dashboard/mediaPanel.js";
      try {
        mixer.validateModule({
          root: "scripts",
          path: "scripts/dashboard/mediaPanel.js",
          content: content
        });
      } catch (err) {
        // "There should be an error when no module is found.
        assert.equal(err.message, desiredErrorMessage, "should show multiple modules error");
        done();
      }
    });

    // error when there are multiple modules defined (just one must be defined in a file)
    it("error when multiple modules defined in one file", function (done) {
      var desiredErrorMessage = "Multiple module definitions found in scripts/dashboard/mediaPanel.js",
        content = "cement.define('dashboard.mediaPanel', function (base, exports) {";
      content += "// this is the module";
      content += "});";
      content += "cement.define('dashboard.mediaPanelTwo', function (base, exports) {";
      content += "// this is the module";
      content += "});";
      try {
        mixer.validateModule({
          root: "scripts",
          path: "scripts/dashboard/mediaPanel.js",
          content: content
        });
      } catch (err) {
        assert.equal(err.message, desiredErrorMessage, "should show multiple modules error");
        done();
      }
    });
  });

  describe("getRequiredModules", function () {
    it("returns the required modules for a module", function (done) {
      var content = "",
        expectedRequiredModules = ["dashboard.menuBar", "kensei.modal", "dashboard.collectionExplorer"],
        detectedRequiredModules = null;
      content += "cement.define('dashboard.mediaPanel', function (base, exports) {";
      content += "  var menuBar = cement.require('dashboard.menuBar'),";
      content += '    modalWindow = cement.require("kensei.modal"),';
      content += "    collectionExplorer = cement.require('dashboard.collectionExplorer');";
      content += "  // this is the mediaPanel module";
      content += "});";
      detectedRequiredModules = mixer.getRequiredModules(content);
      assert.equal(
        String(detectedRequiredModules),
        String(expectedRequiredModules),
        "did not detect the required modules, detected = " + detectedRequiredModules + " expected = " + expectedRequiredModules
      );
      done();
    });
  });

  describe("combineFiles", function () {
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

    it("files exist in correct order in the output", function (done) {
      var fileNames = ['fileOne', 'fileTwo', 'fileThree'];
      // write three files to disk.
      writeTestFiles(function () {
        // once written to disk tell the mixer to combine the files.
        mixer.combineFiles(fileNames, function (err, combined) {
          // check that the mixer callback has all three files in it(in order)
          assert(combined.indexOf("fileOneContents") !== -1, "fileOne is in the compiled output");
          assert(combined.indexOf("fileTwoContents") > combined.indexOf("fileOneContents"), "file two is after file one");
          assert(combined.indexOf("fileThreeContents") > combined.indexOf("fileTwoContents"), "file three is after file two");
          // remove the three files.
          removeTestFiles(function () {
            done();
          });
        });
      });
    });
  });

  describe("getDependencyTree", function () {
    it("returns the correct depency tree",  function (done) {
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
        scriptRoot = __dirname + "/mockData/dependencyTree",
        modulePath = "core.js",
        dependencyTree = mixer.getDependencyTree(scriptRoot, modulePath);
      assert.equal(
        JSON.stringify(expectedTree),
        JSON.stringify(dependencyTree),
        "tree was not the same, tree = " + JSON.stringify(dependencyTree) + " expected = " + JSON.stringify(expectedTree)
      );
      done();
    });
  });
  describe("treeToModuleList", function () {
    it("transforms the depency tree into a list", function (done) {
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
        list = mixer.treeToModuleList(dependencyTree);
      assert.equal(JSON.stringify(expectedModuleList), JSON.stringify(list), "list is correct");
      done();
    });
  });

// Core files represtent the entry point or the "main" file for the scripts for a specific page.
  describe("getCoreFiles", function () {
    it("findes the core.js files in a multipage site", function (done) {
      var pathToScripts = __dirname + "/mockData/multiPage",
        expectedPaths = [
          __dirname + '/mockData/multiPage/page1/core.js',
          __dirname + '/mockData/multiPage/page2/core.js'
        ],
        corePaths = null;

      corePaths = mixer.getCoreFiles(pathToScripts);
      assert.equal(JSON.stringify(corePaths), JSON.stringify(expectedPaths), "Core paths should be same as the ones found.");
      done();
    });
  });


  describe('runOnSite', function () {
    it('works on the single page (production mode) without error', function (done) {
      mixer.runOnSite({
        scriptsRoot:  __dirname + "/mockData/embedTestFiles/js",
        siteRoot: __dirname + "/mockData/embedTestFiles",
        mode: 'production'
      }, function (err) {
        assert(!err, err);
        done();
      });
    });
    it.skip('works on the single page (development mode) without error', function (done) {
      mixer.runOnSite({
        scriptsRoot:  __dirname + "/mockData/embedTestFiles/js",
        siteRoot: __dirname + "/mockData/embedTestFiles",
        mode: 'development'
      }, function (err) {
        assert(!err, err);
        done();
      });
    });
  });


  describe('findCementHtmlFiles', function () {
    it('finds files containing the cement include content in a specific folder', function (done) {
      var expected = [
        'child_folder/hasComment2.html',
        'hasComment1.html'
      ];
      mixer.findCementHtmlFiles(__dirname + '/mockdata/findCementHtmlFiles', function (err, files) {
        assert(!err, err);
        assert.equal(JSON.stringify(files), JSON.stringify(expected));
        done();
      });
    });
  });


  describe("createScriptTag", function () {
    it("converts a file path into a script tag", function (done) {
      var filePath = 'js/cement/moduleName.js',
        tag = mixer.createScriptTag(filePath),
        expectedTag = '<script type="text/javascript" src="' + filePath + '"></script>';
      assert.equal(tag, expectedTag);
      done();
    });
  });

  describe("createMultipleScriptTags", function () {
    it("creates multiple script tags", function (done) {
      var inputScripts = [
        'js/cement/moduleOne.js',
        'js/cement/moduleTwo.js'
      ],
        expectedOutput = '';
      expectedOutput += '<script type="text/javascript" src="js/cement/moduleOne.js"></script>';
      expectedOutput += '<script type="text/javascript" src="js/cement/moduleTwo.js"></script>';
      mixer.createMultipleScriptTags(inputScripts, function (err, output) {
        assert(!err, err);
        assert.equal(output, expectedOutput);
        done();
      });
    });
  });


  describe('getSiteDependencies', function () {
    it('gets all the dependencies for a web site (cement js modules)', function (done) {
      var expectedDependencies = [
        "/companyB/specialWidget.js",
        "/companyA/widgetTwo.js",
        "/modal.js",
        "/companyA/widgetOne.js"
      ],
        dependencies = mixer.getSiteDependencies({
          siteRoot: __dirname + '/mockData/dependencyTree',
          scriptsRoot: __dirname + '/mockData/dependencyTree'
        });
      assert.equal(JSON.stringify(dependencies), JSON.stringify(expectedDependencies));
      done();
    });
  });

  describe("addCementScripts", function (done) {
    it("replaces the cement comment tag with embed script tags", function (done) {
      var input = '',
        output = '',
        expectedOutput = '',
        scriptPaths = [
          'js/cement/moduleOne.js',
          'js/cement/moduleTwo.js'
        ];
      input += '<html>';
      input += '  <head>';
      input += '<!-- Start:InsertCementModules -->';
      input += 'does not matter what was here before';
      input += '<!-- End:InsertCementModules -->';
      input += '  </head>';
      input += '  <body>';
      input += '    <div id="container"></div>';
      input += '  </body>';
      input += '</html>';

      expectedOutput += '<html>';
      expectedOutput += '  <head>';
      expectedOutput += '<!-- Start:InsertCementModules -->';
      expectedOutput += '<script type="text/javascript" src="js/cement/moduleOne.js"></script>';
      expectedOutput += '<script type="text/javascript" src="js/cement/moduleTwo.js"></script>';
      expectedOutput += '<!-- End:InsertCementModules -->';
      expectedOutput += '  </head>';
      expectedOutput += '  <body>';
      expectedOutput += '    <div id="container"></div>';
      expectedOutput += '  </body>';
      expectedOutput += '</html>';
      mixer.addCementScripts({
        html: input,
        scriptsFilePaths: scriptPaths
      }, function (err, output) {
        assert(!err, err);
        assert.equal(output, expectedOutput);
        done();
      });
    });
  });

});
