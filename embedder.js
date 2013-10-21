/*jslint node:true, regexp:true, indent:2, stupid: true*/
"use strict";
var fs = require('fs'),
  assert = require('assert');
// The embedder script will handle modifying existing html pages to reference Cement JavaScript modules.

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
