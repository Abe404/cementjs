/*jslint indent: 2, browser:true*/
/*globals cement, alert*/
(function () {
  "use strict";
  var moduleOne = cement.require('moduleOne');
  alert('inside core');
  moduleOne.alert();
}());
