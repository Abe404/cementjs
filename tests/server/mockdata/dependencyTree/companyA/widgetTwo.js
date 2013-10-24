/*jslint unparam:true, indent:2*/
/*globals cement*/
cement.define("companyA.widgetTwo", function (base, exports) {
  "use strict";
  exports.specialWidget = cement.require("companyB.specialWidget");
});
