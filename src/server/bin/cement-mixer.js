#!/usr/bin/env node
/*jslint indent: 2, node: true*/
"use strict";
var fs = require('fs'),
  args = process.argv,
  siteRoot = null,
  jsRoot = null,
  mode = null,
  minify = null,
  path = require('path'),
  mixer = require('../mixer.js'),
  argv = require('optimist')
    .usage('Usage: site=[directory](required) js=[directory](required) mode=[string](defaults to production) minify=[bool](defaults to true)')
    .demand(['site', 'js'])['default']('mode', 'production')['default']('minify', true).argv;

jsRoot = path.resolve(argv.js);
siteRoot = path.resolve(argv.site);
mode = argv.mode;

if (argv.minify) {
  if (argv.minify === true) {
    minify = true;
  } else if (argv.minify === false) {
    minify = false;
  } else {
    throw new Error('Unhandled value for minify: ' + argv.minify + ', minify should be either true of false');
  }
}

mixer.runOnSite({siteRoot: siteRoot, jsRoot: jsRoot, mode: mode, minify: minify}, function (err) {
  if (err) {
    console.warn(err);
  }
});
