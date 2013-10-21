/*jslint indent: 2*/
/*globals cement, alert*/
cement.define("moduleTwo", function (base, exports) {
  "use strict";
  exports.alert = function () {
    alert('inside module two');
  };
});
