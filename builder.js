/*jslint node:true, regexp:true*/

var fs = require('fs');
// This is a builder module designed to be ran with nodejs
// The build script will handle dependency resolution and minification.

function getDepPath(filePath, callback) {
  fs.readFile(filePath, function (err, data) {
    var requireRegex = /cement.require\(['"](.*)['"]\)/g,
      depName = null,
      depPath = null,
      result = requireRegex.exec(data.toString());
    if (result) {
      depName = result[1];
    }
    // get the full path to the file with the dependency
    depPath = process.cwd() + '/' + depName + '.js';
    callback(err, depPath);
  });
}

function combineFiles(filePaths, callback, prevData) {
  var combinedText = prevData || "";
  // the last one should be added first 
  if (filePaths.length) {
    fs.readFile(filePaths.pop(), function (err, data) {
      combinedText += data;
      combineFiles(filePaths, callback, combinedText);
    });
  } else {
    callback(combinedText);
  }
}

function resolveDependencies(fileName, callback) {
  // search for any files tha are required in this file
  var requireRegex = /cement.require\(['"](.*)['"]\)/g,
    targetPath = process.cwd() + '/' + fileName,
    result = null,
    fileStack = [];
  // the filestack will maintain the compilation order
  fileStack.push(targetPath);
  getDepPath(targetPath, function (err, depPath) {
    fileStack.push(depPath);
    combineFiles(fileStack, callback);
  });
}

exports.build = function (options, callback) {
  if (!options.target) {
    throw new Error("target must be specified");
  }
  if (!options.output) {
    throw new Error("output must be specified");
  }
  fs.readFile(options.target, function (err, data) {
    if (err) {
      throw err;
    }
    resolveDependencies(options.target, function (data) {
      fs.writeFile(options.output, data.toString(), callback);
    });
  });
};
