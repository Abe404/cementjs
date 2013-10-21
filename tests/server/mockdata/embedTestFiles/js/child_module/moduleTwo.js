/*jslint indent: 2*/
/*globals cement, alert*/
cement.define("child_module.moduleTwo", function (base, exports) {
  "use strict";
  exports.alert = function () {
    alert('inside module two');
  };
});
