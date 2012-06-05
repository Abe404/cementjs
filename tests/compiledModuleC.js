cement.define('moduleD', function(base, exports) {
  exports.returnTrue = function () {
    return true;
  };
});
cement.define('moduleC', function(base, exports) {
  var moduleD = cement.require('moduleD'),
    moduleE = cement.require('moduleE');
  // this is module C
});
