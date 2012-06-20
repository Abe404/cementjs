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
exports.tearDown = function (callback) {
  callback();
};

exports["validates module: no error when name correct"] = function (test) {
  var content = "cement.define('dashboard.mediaPanel', function (base, exports) {",
    error = null;
  content += "// this is the mediaPanel module";
  content += "});";
  test.expect(1);
  try {
    builder.validateModule({ root: "scripts", path: "scripts/dashboard/mediaPanel.js", content: content});
  } catch (err) {
    error = err;
  } finally {
    test.ok(!error, "there should be no error, error found: " + error);
    test.done();
  }
};

exports["validates module: error when name incorrect"] = function (test) {
  var content = "cement.define('dashboard.mediaPanel', function (base, exports) {",
    error = null;
  content += "// this is the mediaPanel module";
  content += "});";
  test.expect(1);
  try {
    builder.validateModule({
      root: "scripts",
      path: "scripts/dashboard/notMediaPanel.js",
      content: content
    });
  } catch (err) {
    error = err;
  } finally {
    test.ok(error.message === "Module name(dashboard.mediaPanel) does not match its location(dashboard/notMediaPanel.js)", "no error found, There should be an error due to the invalid module name.");
    test.done();
  }
};

// error when there is no defined module found.
exports["validates module: error when no module found in file"] = function (test) {
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
};

// error when there are multiple modules defined (only one must be defined in a file)
exports["validates module: error when multiple modules defined in one file"] = function (test) {
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
};

exports["getRequiredModules: returns the required modules for a module"] = function (test) {
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
};

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
exports["combineFiles: files exist in correct order in the output"] = function (test) {
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
};
