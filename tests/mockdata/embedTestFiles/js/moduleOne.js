/*jslint indent: 2*/
/*globals cement, alert*/
cement.define("smoe.moduleOne", function (base, exports) {
  "use strict";
  exports.alert = function () {
    alert('inside module one');
  };
});
