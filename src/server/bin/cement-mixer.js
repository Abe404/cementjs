#!/usr/bin/env node
/*jslint indent: 2, node: true*/
"use strict";
var fs = require('fs'),
  args = process.argv,
  siteRoot = null,
  jsRoot = null,
  mode = null,
  path = require('path'),
  mixer = require('../mixer.js'),
  argv = require('optimist')
    .usage('Usage: site=[directory] js=[directory] mode=[string]')
    .demand(['site', 'js'])['default']('mode', 'production').argv;

jsRoot = path.resolve(argv.js);
siteRoot = path.resolve(argv.site);
mode = argv.mode;

mixer.runOnSite({siteRoot: siteRoot, jsRoot: jsRoot, mode: mode}, function (err) {
  if (err) {
    console.warn(err);
  }
});
