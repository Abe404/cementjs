/*jslint indent: 2,unparam: true, sloppy: true*/
/*globals cement*/
cement.define("companyB.specialWidget", function (base, exports) {
  // special widget
});
cement.define("companyA.widgetTwo", function (base, exports) {
  cement.require("companyB.specialWidget");
});
cement.define("modal", function (base, exports) {
  // this is the modal module
});
cement.define("companyA.widgetOne", function (base, exports) {
  cement.require("companyA.widgetTwo");
  cement.require("modal");
});
(function () {
  cement.require("companyA.widgetOne");
  // This is the core
}());
