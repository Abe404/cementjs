(function () {
    // Modularize your applications with cement.js
    var cement = {},
        modules = {},
        moduleInitialisers = {}; // functions that create modules
    // all modules can dispatch events with base.dispatch("eventName") and listened to with module.on("eventname")  
    function addDispatchAndOnMethods(moduleBase, moduleExports, moduleEventHandlers) {
        moduleBase.dispatch = function (eventName, data1, data2, data3, data4) {
            if (moduleEventHandlers[eventName]) {
                moduleEventHandlers[eventName](data1, data2, data3, data4);
            }
        };
        moduleExports.on = function (eventName, eventHandler) {
            moduleEventHandlers[eventName] = eventHandler;
        };
    }
    cement.define = function (moduleName, moduleInitialiser) {
        var moduleBase = {},
            moduleExports = {},
            moduleEventHandlers = {};
        moduleInitialisers[moduleName] = moduleInitialiser;
        addDispatchAndOnMethods(moduleBase, moduleExports, moduleEventHandlers);
        moduleInitialiser(moduleBase, moduleExports);
        modules[moduleName] = moduleExports;
    };
    cement.createInstance = function (moduleName) {
        var moduleBase = {},
            moduleExports = {},
            moduleEventHandlers = {};
        addDispatchAndOnMethods(moduleBase, moduleExports, moduleEventHandlers);
        moduleInitialisers[moduleName](moduleBase, moduleExports);
        return moduleExports;
    };
    cement.require = function (moduleName) {
        if (modules[moduleName]) {
            return modules[moduleName];
        } else {
            throw new Error("module : " + moduleName + " is not defined.\n ");
        }
    };
    window.cmt = window.cement = cement;
}());