/*jslint indent:2*/
/*globals cement*/
cement.define("companyB.specialWidget", function (base, exports) {
  "use strict";
  // special widget
  exports.doStuff = function () {
    console.log('companyB specialWidget doStuff invoked');
  };
});

/*jslint indent: 2*/
/*globals cement*/
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

/*jslint indent:2*/
/*globals cement*/
cement.define("companyA.widgetOne", function (base, exports) {
  "use strict";
  var widgetTwo = cement.require("companyA.widgetTwo"),
    modal = cement.require("modal"),
    widgetTwoB = cement.require("companyB.specialWidget");
});

/*jslint indent: 2*/
/*globals cement*/
cement.define("page2.uniqueWidget", function (base, exports) {
  "use strict";
  // this is a unique Widget for page 2
});
