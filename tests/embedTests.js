/*jslint node:true, indent: 2, node:true, nomen:true*/
/*globals describe, it*/
// these test are for the htmlEmbed functions.
// These functions allow cement to replace a comment in a html page with the 
// development scripts in the correct order
"use strict";
var builder,
  fs = require('fs'),
  readFile = fs.readFile,
  builder = require('../builder.js'),
  assert = require('assert');

describe("module", function () {


  // need a
  describe("function ", function () {
    it("does something", function (done) {
      done();
    });
  });
});
