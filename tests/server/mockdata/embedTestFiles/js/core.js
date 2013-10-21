/*jslint indent: 2, browser:true*/
/*globals cement, alert*/
(function () {
  "use strict";
  var moduleOne = cement.require('moduleOne'),
    moduleTwo = cement.require('moduleTwo');
  alert('inside core');
  moduleOne.alert();
  moduleTwo.alert();
}());
