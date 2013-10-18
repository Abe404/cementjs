/*jslint indent: 2*/
/*globals cement, alert*/
cement.define("moduleOne", function (base, exports) {
  "use strict";
  exports.alert = function () {
    alert('inside module one');
  };
});

/*jslint indent: 2, browser:true*/
/*globals cement, alert*/
(function () {
  "use strict";
  var moduleOne = cement.require('moduleOne');
  alert('inside core');
  moduleOne.alert();
}());
