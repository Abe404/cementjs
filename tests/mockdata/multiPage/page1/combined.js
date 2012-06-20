cement.define("companyB.specialWidget", function (base, exports) {
  // special widget
});
cement.define("companyA.widgetTwo", function (base, exports) {
  var specialWidget = cement.require("companyB.specialWidget");
});
cement.define("modal", function (base, exports) {
  // this is the modal module
});
cement.define("companyA.widgetOne", function (base, exports) {
  var widgetTwo = cement.require("companyA.widgetTwo"),
    modal = cement.require("modal");
});
$(function() {
  var widget = cement.require("companyA.widgetOne");
  
  // This is the core
});