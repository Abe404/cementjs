/*jslint node:true, regexp:true, indent:2*/
var fs = require('fs');
// This is a builder module designed to be ran with nodejs
// The build script will handle dependency resolution and minification.

exports.treeToModuleList = function treeToList(tree) {
  // make sure the modules whileout any dependencies are included at the top.
  var i = 0,
    moduleList = [];
  for (i = 0; i < tree.length; i += 1) {
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
        throw new Error("Could not read dependency: " + nextFile);
      }
      combinedText += data;
      exports.combineFiles(filePaths, callback, combinedText);
    });
  } else {
    callback(combinedText);
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

exports.getDependencyTree = function getTree(scriptsRootDir, filePath, callback) {
  var tree = [],
    moduleContents = fs.readFileSync(scriptsRootDir + '/' + filePath).toString(),
    dependencyList = null,
    nextDependency = null;
    
  // Check that the module is valid before doing anything else (fail early defensive programming)
  // Only check if it isnt the core as the core is not a module
  if(filePath.slice(filePath.length - "core.js".length, filePath.length) !== "core.js"){
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
      dependencies: getTree(scriptsRootDir,  moduleNameToFilePath(nextDependency))
    });
    nextDependency = dependencyList.shift();
  }
  if (callback) {
    callback(tree);
  } else {
    return tree;
  }
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
exports.validateModule = function (script, callback) {
  var defineRegex = /cement.define\(['"](.*?)['"]/g,
    match = null,
    moduleName = null,
    error = null;
  if (!script.content) {
    error = "script.content must be defined";
  }
  if (!script.path) {
	error = "script.path must be defined";
  }
  if (!script.root) {
    error = "script.root the root of the scripts must be defined";
  }
  match = defineRegex.exec(script.content);
  if (match) {
    moduleName = match[1];
    match = defineRegex.exec(script.content);
    // if there is another match then that means there is multiple definitions in the file
    if (match) {
      error = "multiple module definitions found in file.";
    }
  } else {
    error = "could not find a module defined in the file, file = " + script.path;
  }
  if (!error) {
	  // remove the root from the beginning of the script.path
    script.path = script.path.replace(script.root + '/', "");
    if (!moduleNameMatchesPath(moduleName, script.path)) {
      error = "module name does not match its location";
    }
  }
  if (error) {
    throw new Error(error);
  }
};

exports.build = function (options, callback) {
  if (!options.root) {
    throw new Error("scripts root must be specified");
  }
  if (!options.path) {
    throw new Error("script path must be specified");
  }
  exports.getDependencyTree(options.root, options.path, function (tree) {
    var moduleList = exports.treeToModuleList(tree),
      fileList = [],
      i = 0;
    for (i = 0; i < moduleList.length; i += 1) {
      fileList.push(options.root + '/' + moduleNameToFilePath(moduleList[i]));
    }
    fileList.push(options.root + '/' + options.path);
    exports.combineFiles(fileList, function (data) {
      callback(data);
    });
  });
};
