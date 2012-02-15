//   Copyright 2012 Abraham Smith
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.


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
    // testing putting something on develop branch 
    window.cmt = window.cement = cement;
    // test adding line on build_script feature branch
}());
