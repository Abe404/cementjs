/*jslint node:true, regexp:true, indent:2, stupid: true*/
"use strict";
var fs = require('fs'),
  assert = require('assert');
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

exports.getDependencyTree = function getTree(scriptsRootDir, filePath) {
  var tree = [],
    moduleContents = fs.readFileSync(scriptsRootDir + '/' + filePath).toString(),
    dependencyList = null,
    nextDependency = null;
  // Check that the module is valid before doing anything else (fail early defensive programming)
  // Only check if it isnt the core as the core is not a module
  if (filePath.slice(filePath.length - "core.js".length, filePath.length) !== "core.js") {
    exports.validateModule({
      content: moduleContents,
      path: scriptsRootDir + '/' + filePath,
      root: scriptsRootDir
    });
  }
  dependencyList = exports.getRequiredModules(moduleContents);
  nextDependency = dependencyList.shift();
  // add each one of the dependencies as a module
  while (nextDependency) {
    tree.push({
      name: nextDependency,
      dependencies: getTree(scriptsRootDir, moduleNameToFilePath(nextDependency))
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
    return;
  }
  if (!options.path) {
    throw new Error("script.path must be defined");
    return;
  }
  if (!options.root) {
    throw new Error("script.root the root of the scripts must be defined");
    return;
  }
  match = defineRegex.exec(options.content);
  if (match) {
    moduleName = match[1];
    match = defineRegex.exec(options.content);
    // if there is another match then that means there is multiple definitions in the file
    if (match) {
      throw new Error("Multiple module definitions found in " + options.path);
      return;
    }
  } else {
    throw new Error("Could not find a module defined in " + options.path);
    return;
  }
  // remove the root from the beginning of the script.path
  options.path = options.path.replace(options.root + '/', "");
  if (!moduleNameMatchesPath(moduleName, options.path)) {
    throw new Error("Module name(" + moduleName + ") does not match its location(" + options.path + ")");
    return;
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

exports.buildSiteScripts = function (options, callback) {
  var coreFilePaths = null;
  if (!options.root) {
    throw new Error("Scripts root must be specified");
  }
  coreFilePaths = exports.getCoreFiles(options.root);
  function compileNext(path) {
    if (path) {
      exports.buildPageScripts({
        root: options.root,
        path: path.replace(options.root, '')
      }, function (compiledOutput) {
        fs.writeFileSync(path.replace('core.js', 'combined.js'), compiledOutput);
        compileNext(coreFilePaths.shift());
      });
    } else {
      callback();
    }
  }
  compileNext(coreFilePaths.shift());
};

exports.buildPageScripts = function (options, callback) {
  if (!options.root) {
    callback("buildPageScripts: scripts root must be specified");
  }
  if (!options.path) {
    callback("buildPathScripts: script path must be specified");
  }

  var tree = exports.getDependencyTree(
    options.root,
    options.path
  ),
    moduleList = exports.treeToModuleList(tree),
    fileList = [],
    i = 0;
  for (i = 0; i < moduleList.length; i += 1) {
    fileList.push(options.root + '/' + moduleNameToFilePath(moduleList[i]));
  }
  exports.combineFiles(fileList, function (err, data) {
    callback(err, data);
  });
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


exports.findCementHtmlFiles = function (siteRoot, callback) {
  var cementHtmlFiles = [];

  function fileContainsCementTag(filePath) {
    var cementComment = /<!-- Start:InsertCementModules -->(.|\n)*<!-- End:InsertCementModules -->/g,
      fileContents = String(fs.readFileSync(filePath));
    return !!fileContents.match(cementComment);
  }

  function searchDir(dirPath) {
    // get all the files in the directory.
    var allFilesAndDirectories = fs.readdirSync(dirPath),
      i = 0,
      filePath;
      // for each of the files
    for (i = 0; i < allFilesAndDirectories.length; i += 1) {
      filePath = dirPath + '/' + allFilesAndDirectories[i];
      // if the file is a directory
      if (fs.lstatSync(filePath).isDirectory()) {
        // then search it for cement html files
        searchDir(filePath);
      } else {
        // other wise if it is a file
        // if it contains the cement tag
        if (fileContainsCementTag(filePath)) {
          // then add it to the list of cementHtmlFiles
          cementHtmlFiles.push(filePath.replace(siteRoot + '/', ''));
        }
      }
    }
  }
  searchDir(siteRoot);
  callback(null, cementHtmlFiles);
};

function runOnSiteForProduction(options, callback) {
  var scriptPath = options.scriptsRoot + '/combinedCementModules.js';

  function replaceAllCementEmbedCode(htmlFiles, callback) {
    var filesToReplace = htmlFiles;

    function doNext(err) {
      var nextPath;
      if (err) {
        callback(err);
        return;
      }
      if (!filesToReplace.length) {
        callback();
        return;
      }
      nextPath = filesToReplace.pop();
      replaceCementModuleEmbedCodeForPage({
        siteRoot: options.siteRoot,
        pathToHtmlFile: options.siteRoot + '/' + nextPath,
        scriptPaths: [scriptPath.replace(options.siteRoot, '')]
      }, doNext);
    }
    doNext();
  }

  function gotCementHtmlFiles(err, cementHtmlFiles) {
    if (err) {
      callback(err);
      return;
    }
    replaceAllCementEmbedCode(cementHtmlFiles, callback);
  }

  function gotCombinedScripts(err, combinedScripts) {
    if (err) {
      callback(err);
      return;
    }
    fs.writeFileSync(scriptPath, combinedScripts); // write the final output file
    exports.findCementHtmlFiles(options.siteRoot, gotCementHtmlFiles);
  }

  exports.buildPageScripts({
    root: options.scriptsRoot,
    path: 'core.js'
  }, gotCombinedScripts);

}

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
  var cementComment = /<!-- Start:InsertCementModules -->(.|\n)*<!-- End:InsertCementModules -->/g;
  assert(options.html, 'html input must be specified');
  assert(options.scriptsFilePaths, 'scriptsFilePaths must be specified');

  if (!options.html.match(cementComment)) {
    callback('could not find cement block in the input file: ' + options.html);
  }
  function gotScriptsHtml(err, scriptsHtml) {
    var output = '';
    if (err) {
      callback(err);
      return;
    }
    scriptsHtml = '<!-- Start:InsertCementModules -->' + scriptsHtml + '<!-- End:InsertCementModules -->';
    output = options.html.replace(cementComment, scriptsHtml);
    callback(null, output);
  }
  exports.createMultipleScriptTags(options.scriptsFilePaths, gotScriptsHtml);
};


exports.runOnSite = function (options, callback) {
  assert(options.scriptsRoot, 'folder containing the cement scripts for the page required');
  assert(options.siteRoot, 'path to site root required');
  // production means scripts are combined and minified
  assert(
    options.mode === 'development' || options.mode === 'production',
    'mode should be specified as either development or production'
  );
  if (options.mode === 'production') {
    runOnSiteForProduction(options, callback);
  } else {
    callback('unhandled mode: ' + options.mode);
  }
};
