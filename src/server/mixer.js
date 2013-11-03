/*jslint node:true, regexp:true, indent:2, stupid: true*/
"use strict";
var fs = require('fs'),
  assert = require('assert'),
  jsmin = require('jsmin').jsmin;
// This is a builder module designed to be ran with nodejs
// The build script will handle dependency resolution and minification.

exports.treeToModuleList = function treeToList(tree) {
  // make sure the modules whileout any dependencies are included at the top.
  var i = 0,
    moduleList = [];

  for (i = 0; i < tree.length; i += 1) {
    if (!tree[i].dependencies) {
      throw new Error('tree must specify dependencies as an array, tree : ' + JSON.stringify(tree[i]));
    }

    if (tree[i].dependencies.length) {
      moduleList = moduleList.concat(treeToList(tree[i].dependencies));
    }
    moduleList.push(tree[i].name);
  }
  return moduleList;
};
exports.combineFiles = function (filePaths, callback, prevData) {
  var combinedText = prevData || "",
    nextFile = filePaths.shift();
  // the last one should be added first
  if (nextFile) {
    fs.readFile(nextFile, function (err, data) {
      if (err) {
        callback("combineFiles: Could not read dependency: " + nextFile);
        return;
      }
      if (combinedText.length) {
        combinedText += '\n'; // Add a line break between files.
      }
      combinedText += data;
      exports.combineFiles(filePaths, callback, combinedText);
    });
  } else {
    callback(null, combinedText);
  }
};

// get the modules required by a specific module (module contents should be supplied)
exports.getRequiredModules = function (scriptContent) {
  var requireRegex = /cement.require\(['"](.*?)['"]\)/g,
    requiredModules = [],
    match = "";
  while (match !== null) {
    match = requireRegex.exec(scriptContent);
    if (match) {
      requiredModules.push(match[1]);
    }
  }
  return requiredModules;
};

function moduleNameToFilePath(moduleName) {
  // companyA.widgetOne shoud be converted to companyA/widgetOne.js
  return moduleName.replace('.', '/') + ".js";
}

exports.getDependencyTree = function getTree(jsRootDir, filePath) {
  var tree = [],
    moduleContents = fs.readFileSync(jsRootDir + '/' + filePath).toString(),
    dependencyList = null,
    nextDependency = null;
  // Check that the module is valid before doing anything else (fail early defensive programming)
  // Only check if it isnt the core as the core is not a module
  if (filePath.slice(filePath.length - "core.js".length, filePath.length) !== "core.js") {
    exports.validateModule({
      content: moduleContents,
      path: jsRootDir + '/' + filePath,
      root: jsRootDir
    });
  }
  dependencyList = exports.getRequiredModules(moduleContents);
  nextDependency = dependencyList.shift();
  // add each one of the dependencies as a module
  while (nextDependency) {
    tree.push({
      name: nextDependency,
      dependencies: getTree(jsRootDir, moduleNameToFilePath(nextDependency))
    });
    nextDependency = dependencyList.shift();
  }
  return tree;
};

function moduleNameMatchesPath(moduleName, path) {
  // check that the modules name matches its path.
  // remove the .js on the end of the path
  path = path.replace('.js', '');
  // change all the /'s in the path to .'s
  path = path.replace('/', '.');
  // check if they are the same.
  return path === moduleName;
}

// Check that the module has a name which matches its location
exports.validateModule = function (options, callback) {
  var defineRegex = /cement.define\(['"](.*?)['"]/g,
    match = null,
    moduleName = null;
  if (!options.content) {
    throw new Error("script.content must be defined");
  }
  if (!options.path) {
    throw new Error("script.path must be defined");
  }
  if (!options.root) {
    throw new Error("script.root the root of the scripts must be defined");
  }
  match = defineRegex.exec(options.content);
  if (match) {
    moduleName = match[1];
    match = defineRegex.exec(options.content);
    // if there is another match then that means there is multiple definitions in the file
    if (match) {
      throw new Error("Multiple module definitions found in " + options.path);
    }
  } else {
    throw new Error("Could not find a module defined in " + options.path);
  }
  // remove the root from the beginning of the script.path
  options.path = options.path.replace(options.root + '/', "");
  if (!moduleNameMatchesPath(moduleName, options.path)) {
    throw new Error("Module name(" + moduleName + ") does not match its location(" + options.path + ")");
  }
};

// Find all the core files in the scriptsDirectory
exports.getCoreFiles = function (scriptsDirectory) {
  var corePaths = [],
    i = 0,
    stats = null,
    files = fs.readdirSync(scriptsDirectory), // Read the list of files in the scriptsDirectory.
    fullPath = null;
  for (i = 0; i < files.length; i += 1) {
    fullPath = scriptsDirectory + "/" + files[i];
    // if its ending matches with core.js then add it to the corePaths array.
    if (fullPath.slice(fullPath.length - "core.js".length, fullPath.length) === "core.js") {
      corePaths.push(fullPath);
    }
    // if its a directory then get the corePaths from that directory and add them to the corePaths
    stats = fs.lstatSync(fullPath);
    if (stats.isDirectory()) {
      corePaths = corePaths.concat(exports.getCoreFiles(fullPath));
    }
  }
  return corePaths;
};

function replaceCementModuleEmbedCodeForPage(options, callback) {
  // read the html file in
  var originalHtml = String(fs.readFileSync(options.pathToHtmlFile));
  // replace the cement comment with the combined script
  exports.addCementScripts({
    scriptsFilePaths: options.scriptPaths,
    html: originalHtml
  }, function (err, htmlOutput) {
    if (err) {
      callback(err);
      return;
    }
    // write the file out again 
    fs.writeFileSync(options.pathToHtmlFile, htmlOutput);
    callback(null);
  });
}

exports.getCementForAttributeFromComment = function (cementComment, callback) {
  var regex = /<!-- Start:InsertCementModules for=["'](.*?)['"] -->(.|\n)*<!-- End:InsertCementModules -->/g;
  return regex.exec(cementComment)[1];
};

exports.getCementCommentFromFile = function (htmlFilePath) {
  var cementCommentPattern = /<!-- Start:InsertCementModules for=["'](.|\n)*['"] -->(.|\n)*<!-- End:InsertCementModules -->/g,
    fileData = fs.readFileSync(htmlFilePath);
  fileData = String(fileData);
  // use a regular expression to extract the comment
  return fileData.match(cementCommentPattern)[0];
};


exports.getCementForAttributeFromFile = function (htmlFilePath) {
  var comment = exports.getCementCommentFromFile(htmlFilePath);
  return exports.getCementForAttributeFromComment(comment);
};

// return files as objects with two properties
// { path: , insertCementModulesFor: }
exports.findCementHtmlFiles = function (siteRoot, callback) {
  var cementHtmlFiles = [];

  function searchDir(dirPath) {
    // get all the files in the directory.
    var allFilesAndDirectories = fs.readdirSync(dirPath),
      filePath,
      forAttr;

    // for each of the files
    while (allFilesAndDirectories.length) {
      filePath = dirPath + '/' + allFilesAndDirectories.shift();
      // if the file is a directory
      if (fs.lstatSync(filePath).isDirectory()) {
        // then search it for cement html files
        searchDir(filePath);
      } else {
        // other wise if it is a file
        // if it contains the cement tag
        // get the cement comment for attr
        try {
          forAttr = exports.getCementForAttributeFromFile(filePath);
            // then add it to the list of cementHtmlFiles
          cementHtmlFiles.push({
            path: filePath.replace(siteRoot + '/', ''),
            insertCementModulesFor: forAttr
          });
        } catch (e) {
        }
      }
    }
  }
  searchDir(siteRoot);
  callback(null, cementHtmlFiles);
};

exports.createScriptTag = function (filePath) {
  if (!filePath) {
    throw new Error('file path must be specified');
  }
  return '<script type="text/javascript" src="' + filePath + '"></script>';
};

exports.createMultipleScriptTags = function (filePaths, callback) {
  var output = '',
    i = 0;
  for (i = 0; i < filePaths.length; i += 1) {
    output += exports.createScriptTag(filePaths[i]);
  }
  callback(null, output);
};


//replace the <!-- InsertCementModules --> with the script tags referencing the modules
exports.addCementScripts = function (options, callback) {
  var cementCommentRegex = /<!-- Start:InsertCementModules for=["'](.*?)['"] -->(.|\n)*<!-- End:InsertCementModules -->/g,
    forAttr = '';
  assert(options.html, 'html input must be specified');
  assert(options.scriptsFilePaths, 'scriptsFilePaths must be specified');
  if (!options.html.match(cementCommentRegex)) {
    callback('could not find cement block in the input file: ' + options.html);
  }
  forAttr = cementCommentRegex.exec(options.html)[1];
  function gotScriptsHtml(err, scriptsHtml) {
    var output = '';
    if (err) {
      callback(err);
      return;
    }
    scriptsHtml = '<!-- Start:InsertCementModules for="' + forAttr + '" -->' + scriptsHtml + '<!-- End:InsertCementModules -->';
    output = options.html.replace(cementCommentRegex, scriptsHtml);
    callback(null, output);
  }
  exports.createMultipleScriptTags(options.scriptsFilePaths, gotScriptsHtml);
};



function getCombinedOutputFilePath(jsRoot, dependencyPath) {
  var outputPath = '';
  // if dependencyPath resolves to a directory then
  if (fs.lstatSync(jsRoot + '/' + dependencyPath).isDirectory()) {
    outputPath = dependencyPath + '/combinedCementModules.js';
  } else {
    // else if it is a file then 
    outputPath = dependencyPath + '.combinedCementModules.js';
  }
  return outputPath;
}

exports.removeDuplicateDependencies = function (dependencyList) {
  var uniqueDependencies = [],
    i = 0;
  for (i = 0; i < dependencyList.length; i += 1) {
    // if it is not in the list
    if (uniqueDependencies.indexOf(dependencyList[i]) === -1) {
      uniqueDependencies.push(dependencyList[i]);
    }
  }
  return uniqueDependencies;
};


// options = { siteRoot: , jsRoot, path: (either dir or core.js file) }
exports.getDependencies = function (options) {
  if (!options.siteRoot) {
    throw new Error("getDependencies: siteRoot (dir) must be specified");
  }
  if (!options.jsRoot) {
    throw new Error("getDependencies: jsRoot (dir) must be specified");
  }
  if (!options.path) {
    throw new Error("getDependencies: path (dir or core.js file) must be specified");
  }
  var coreFilePaths = [],
    i = 0,
    j = 0,
    tree = null,
    moduleList = null,
    fileList = null,
    filePath = null,
    allDependencies = []; // all dependencies for all core files

  if (fs.lstatSync(options.siteRoot + options.path).isDirectory()) {
    coreFilePaths = exports.getCoreFiles(options.siteRoot + options.path);
  } else {
    coreFilePaths = [options.siteRoot + options.path];
  }
  // for each of the core files
  for (i = 0; i < coreFilePaths.length; i += 1) {
    // get the dependency list in order.
    tree = exports.getDependencyTree(options.jsRoot, String(coreFilePaths[i]).replace(options.jsRoot, ''));
    moduleList = exports.treeToModuleList(tree);
    fileList = [];
    for (j = 0; j < moduleList.length; j += 1) {
      filePath = moduleNameToFilePath(moduleList[j]);
      filePath = options.jsRoot.replace(options.siteRoot, '') + '/' + filePath;
      fileList.push(filePath);
    }
    allDependencies = allDependencies.concat(fileList);
  }
  allDependencies = exports.removeDuplicateDependencies(allDependencies);
  return allDependencies;
};


function getCombinedFileOutputPath(dependenciesFor, minify) {
  var outputPath;
  // if dependencyPath resolves to a directory then
  if (fs.lstatSync(dependenciesFor).isDirectory()) {
    outputPath = dependenciesFor + '/combinedCementModules';
  } else {
    // if it is a file
    outputPath = dependenciesFor + '.combinedCementModules';
  }
  if (minify) {
    outputPath += '.min';
  }
  outputPath += '.js';
  return outputPath;
}

function runCementForHtmlFile(options, fileWithPath, callback) {
  // get the depency list based on the files dependencies 'for' attr
  var i = 0,
    dependencyList = exports.getDependencies({
      siteRoot: options.siteRoot,
      jsRoot: options.jsRoot,
      path: fileWithPath.insertCementModulesFor
    }),
    jsPaths = [];

  function replaceCementComment() {
    replaceCementModuleEmbedCodeForPage({
      siteRoot: options.siteRoot,
      pathToHtmlFile: options.siteRoot + '/' + fileWithPath.path,
      scriptPaths: jsPaths
    }, function (err) {
      if (err) {
        callback(err);
        return;
      }
      callback();
    });
  }

  // If mode is production
  if (options.mode === 'production') {
    for (i = 0; i < dependencyList.length; i += 1) {
      dependencyList[i] = options.siteRoot + dependencyList[i];
    }
    // Then combine all the files in the dependency list into one file
    exports.combineFiles(dependencyList, function (err, combinedScripts) {
      if (err) {
        callback(err);
        return;
      }
      var outputPath = getCombinedFileOutputPath(options.siteRoot + '/' + fileWithPath.insertCementModulesFor, options.minify);
      if (options.minify) {
        combinedScripts = jsmin(combinedScripts);
      }
      // save this file to an output path
      fs.writeFileSync(outputPath, combinedScripts); // write the final output file
      // Then insert an embed link to the outputted file in the html file
      jsPaths = [outputPath.replace(options.siteRoot + '/', '')];
      replaceCementComment();
    });
  } else if (options.mode === 'development') {
    // if its development mode then insert embed code for each one of the item in the full dependency list
    // these directly reference the original files in the jsRoot folder.
    jsPaths = dependencyList;
    replaceCementComment();
  }
}

exports.runOnSite = function (options, callback) {
  assert(options.jsRoot, 'folder containing the cement scripts for the page required');
  assert(options.siteRoot, 'path to site root required');
  assert(options.minify === true || options.minify === false, 'minify should be specified as true or false');
  // production means scripts are combined and minified
  assert(
    options.mode === 'development' || options.mode === 'production',
    'mode should be specified as either development or production'
  );

  function gotCementHtmlFiles(err, filesWithDependencyPaths) {
    if (err) {
      callback(err);
    }
    // Then for each file 
    function runCementForNextFile() {
      if (!filesWithDependencyPaths.length) {
        callback();
        return;
      }
      runCementForHtmlFile(options, filesWithDependencyPaths.pop(), function (err) {
        if (err) {
          callback(err);
          return;
        }
        runCementForNextFile();
      });
    }
    runCementForNextFile();
  }
  // First find all the html files in the site root 
  // with the cement modules include comment
  // Whilst getting this list of files also parse their dependency path
  // This is what they want to include the cement modules 'for'
  // it is specified in the comment for="{dependencyPath"
  // (either a core.js file or a directory containing one or more core.js files)
  exports.findCementHtmlFiles(options.siteRoot, gotCementHtmlFiles);
};
