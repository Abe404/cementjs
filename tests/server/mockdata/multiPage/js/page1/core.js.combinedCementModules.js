/*jslint indent:2*/
/*globals cement*/
cement.define("companyB.specialWidget", function (base, exports) {
  "use strict";
  // special widget
});

/*jslint indent: 2*/
/*globals cement*/
cement.define("companyA.widgetTwo", function (base, exports) {
  "use strict";
  var specialWidget = cement.require("companyB.specialWidget");
  specialWidget.doStuff();
});

/*jslint indent: 2, unparam: true*/
/*global cement*/
cement.define("modal", function (base, exports) {
  "use strict";
  // this is the modal module
});

/*jslint indent:2*/
/*globals cement*/
cement.define("companyA.widgetOne", function (base, exports) {
  "use strict";
  var widgetTwo = cement.require("companyA.widgetTwo"),
    modal = cement.require("modal");
});
