/*jslint indent: 2, browser:true*/
/*globals cement, alert*/
(function () {
  "use strict";
  var moduleOne = cement.require('moduleOne'),
    moduleTwo = cement.require('child_module.moduleTwo');
  moduleOne.alert();
  moduleTwo.alert();
}());
