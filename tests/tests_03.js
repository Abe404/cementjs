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

exports["getDependencyTree Check the correct tree is returned"] = function (test) {
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
};

exports["treeToModuleList check the depency tree is correctly transformed into a list"] = function (test) {
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
};

