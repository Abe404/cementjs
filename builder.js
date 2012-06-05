/*jslint node:true, regexp:true*/
var fs = require('fs');
// This is a builder module designed to be ran with nodejs
// The build script will handle dependency resolution and minification.

// get the full path to the file with the dependency
function getDepPaths(filePath, callback) {
  fs.readFile(filePath, function (err, data) {
    var requireRegex = /cement.require\(['"](.*)['"]\)/g,
      dirSectionRegex = /(.*)\/.*$/, // the part of the path up to the last slash
      depPaths = [],
      depDirectory = dirSectionRegex.exec(filePath)[1],
      match = true;
    while (match !== null) {
      match = requireRegex.exec(data.toString());
      if (match) {
        depPaths.push(depDirectory + '/' + match[1] + '.js');
      }
    }
    callback(err, depPaths);
  });
}

function combineFiles(filePaths, callback, prevData) {
  var combinedText = prevData || "",
    nextFile = filePaths.pop();
  // the last one should be added first
  if (nextFile) {
    fs.readFile(nextFile, function (err, data) {
      if (err) {
        throw new Error("Could not read dependency: " + nextFile);
      }
      combinedText += data;
      combineFiles(filePaths, callback, combinedText);
    });
  } else {
    callback(combinedText);
  }
}

// pull in all the required modules and returnt them in one sting (including the file)1
function resolveDependencies(fileName, callback) {
  // search for any files tha are required in this file
  var requireRegex = /cement.require\(['"](.*)['"]\)/g,
    targetPath = process.cwd() + '/' + fileName,
    result = null,
    fileStack = [];
  // the filestack will maintain the compilation order
  fileStack.push(targetPath);
  getDepPaths(targetPath, function (err, depPaths) {
    var i = 0;
    for(i = 0; i < depPaths.length; i += 1) {
      fileStack.push(depPaths[i]);
    }
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
