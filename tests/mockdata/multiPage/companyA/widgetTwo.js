/*jslint indent: 2*/
/*globals cement*/
cement.define("companyA.widgetTwo", function (base, exports) {
  "use strict";
  var specialWidget = cement.require("companyB.specialWidget");
  specialWidget.doStuff();
});
