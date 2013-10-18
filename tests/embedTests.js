/*jslint node:true, indent: 2, node:true, nomen:true*/
/*globals describe, it*/
// these test are for the htmlEmbed functions.
// These functions allow cement to replace a comment in a html page with the 
// development scripts in the correct order
"use strict";
var builder,
  fs = require('fs'),
  readFile = fs.readFile,
  embedder = require('../embedder.js'),
  assert = require('assert');

describe("embedder", function () {
  describe("createScriptTag", function () {
    it("converts a file path into a script tag", function (done) {
      var filePath = 'js/cement/moduleName.js',
        tag = embedder.createScriptTag(filePath),
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
      embedder.createMultipleScriptTags(inputScripts, function (err, output) {
        assert(!err, err);
        assert.equal(output, expectedOutput);
        done();
      });
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
      input += '    <!-- InsertCementJS -->';
      input += '  </head>';
      input += '  <body>';
      input += '    <div id="container"></div>';
      input += '  </body>';
      input += '</html>';

      expectedOutput += '<html>';
      expectedOutput += '  <head>';
      expectedOutput += '    <script type="text/javascript" src="js/cement/moduleOne.js"></script>';
      expectedOutput += '<script type="text/javascript" src="js/cement/moduleTwo.js"></script>';
      expectedOutput += '  </head>';
      expectedOutput += '  <body>';
      expectedOutput += '    <div id="container"></div>';
      expectedOutput += '  </body>';
      expectedOutput += '</html>';
      embedder.addCementScripts({
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
