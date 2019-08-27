"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const TypeScriptBuildEngine_1 = require("../TypeScriptBuildEngine");
const Shout_1 = require("../Shout");
const portfinder = require("portfinder");
module.exports = function (variables, finish) {
    return __awaiter(this, void 0, void 0, function* () {
        if (variables.verbose) {
            Shout_1.Shout.displayVerboseOutput = true;
        }
        if (variables.muteNotification) {
            Shout_1.Shout.enableNotification = false;
        }
        if (variables.hot) {
            let basePort = variables.port1;
            if (!basePort) {
                basePort = 28080;
            }
            let port = yield portfinder.getPortPromise({
                port: basePort
            });
            variables.port1 = port;
        }
        let tool = new TypeScriptBuildEngine_1.TypeScriptBuildEngine(variables);
        try {
            yield tool.build();
            if (!variables.watch) {
                finish(null);
            }
        }
        catch (error) {
            finish(error);
        }
    });
};
