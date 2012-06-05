cement.define('moduleA', function(base, exports) {
  exports.returnTrue = cement.require('moduleB').returnTrue;
});
