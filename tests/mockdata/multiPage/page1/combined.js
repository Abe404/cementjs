/*jslint indent:2*/
/*globals cement*/
cement.define("companyB.specialWidget", function (base, exports) {
  "use strict";
  // special widget
});

cement.define("companyA.widgetTwo", function (base, exports) {
  "use strict";
  var specialWidget = cement.require("companyB.specialWidget");
});
/*jslint indent: 2, unparam: true*/
/*global cement*/
cement.define("modal", function (base, exports) {
  "use strict";
  // this is the modal module
});

cement.define("companyA.widgetOne", function (base, exports) {
  "use strict";
  var widgetTwo = cement.require("companyA.widgetTwo"),
    modal = cement.require("modal");
  modal.doSomething();
});
/*jslint indent: 2*/
/*globals $, cement*/
$(function () {
  "use strict";
  var widget = cement.require("companyA.widgetOne");
  // This is the core
});
