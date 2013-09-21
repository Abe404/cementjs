/*jslint indent:2, node:true, stupid:true, nomen:true*/
// Get the command line arguments
"use strict";
var fs = require('fs'),
  spawn = require('child_process').spawn,
  ignores = ['node_modules'],
  foldersToLint = [
    '../'
  ],
  previousLintTimes = {},
  newLintTimes = {};

function lintFile(filePath, callback) {
  console.log("Linting " + filePath);
  (function (path) {
    // Call jslint on the specific file
    var jslint = spawn('jslint', [__dirname + '/' + path]),
      errorMessage = "";
    jslint.stdout.on('data', function (data) {
      //console.log('lint for ' + path + ': stdout: ' + data);
      //console.log(String(data));
      errorMessage += String(data);
    });
    jslint.stderr.on('data', function (data) {
      console.log('lint for ' + path + ':stderr: ' + data);
    });
    jslint.on('close', function (code) {
      if (code !== 0) {
        console.log('lint for ' + path + ':process exited with code ' + code);
        console.log("Error", errorMessage);
        newLintTimes[path] = 1; // if there is an error then set lint time to long ago.
        process.exit(code);
      } else {
        callback(null, path);
      }
    });
  }(filePath, callback));
}

function isIgnored(path) {
  var i = 0;
  // for each of the ignores
  for (i = 0; i < ignores.length; i += 1) {
    // if the path contains that ignore string
    if (path.indexOf(ignores[i]) !== -1) {
      // then ignore this file
      return true;
    }
  }
}

function lintFiles(filePaths) {
  var filesToLint = filePaths;
  function lintNext() {
    var next = filesToLint.pop(),
      lintTime = null;
    if (!next) {
      return;
    }
    lintFile(next, function (err, path) {
      if (err) {
        throw err;
      }
      // reset its previous lint time
      lintTime = (new Date()).getTime();
      newLintTimes[path] = lintTime;
      lintNext();
    });
  }
  lintNext();
}

function lintFolder(folderPath) {
  fs.readdir(__dirname + '/' + folderPath, function (err, files) {
    var i = 0,
      fileStats = null,
      filesToLint = [];
    if (err) {
      console.log(err);
      return;
    }
    for (i = 0; i < files.length; i += 1) {
      fileStats = fs.lstatSync(__dirname + '/' + folderPath + '/' + files[i]);
      // if its a directory then lint its contents
      if (fileStats.isDirectory()) {
        lintFolder(folderPath + '/' + files[i]);
      // if its a javascript file (includes .json)
      } else if (files[i].indexOf('.js') !== -1) {
        if (!isIgnored(folderPath + '/' + files[i])) {
          // if there is a previous lint time for this file
          if (previousLintTimes[folderPath + '/' + files[i]]) {
            // if the files last modified time is (bigger than) its previous lint time
            //console.log(files[i] + ', mtime = ', fileStats.mtime.getTime());
            if (fileStats.mtime.getTime() > previousLintTimes[folderPath + '/' + files[i]]) {
              // then lint the file
              filesToLint.push(folderPath + '/' + files[i]);
            }
            if (!fileStats.mtime.getTime() || fileStats.mtime.getTime() < 100) {
              throw new Error("something wrong with file mtime, mtime = " + fileStats.mtime.getTime());
            }
          } else {
            // if no entry then 
            // then lint the file
            filesToLint.push(folderPath + '/' + files[i]);
          }
        }
      }
    }
    lintFiles(filesToLint);
  });
}

function lintFolders() {
  var i = 0;
  for (i = 0; i < foldersToLint.length; i += 1) {
    lintFolder(foldersToLint[i]);
  }
}

try {
  previousLintTimes = JSON.parse(fs.readFileSync(__dirname + '/previousLintTimes.json')) || {};
} catch (err) {
}
lintFolders();

process.on('exit', function () {
  var prop;
  for (prop in previousLintTimes) {
    if (previousLintTimes.hasOwnProperty(prop)) {
      if (!newLintTimes[prop]) {
        newLintTimes[prop] = previousLintTimes[prop];
      }
    }
  }
  fs.writeFileSync(__dirname + '/previousLintTimes.json', JSON.stringify(newLintTimes));
});


