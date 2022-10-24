var stackTrace = require('../helpers/stackTrace');

function getCaller(func) {
    return func.caller;
}

function getData(func) {
    var trace = stackTrace.get(func || getCaller(getData));
    var caller = trace[0];
    return {
        typeName: caller.getTypeName(),
        functionName: caller.getFunctionName(),
        methodName: caller.getMethodName(),
        filePath: caller.getFileName(),
        lineNumber: caller.getLineNumber(),
        topLevelFlag: caller.isToplevel(),
        nativeFlag: caller.isNative(),
        evalFlag: caller.isEval(),
        evalOrigin: caller.getEvalOrigin()
    };
}

function getString(func) {
    var callerData = getData(func || getCaller(getString));
    if (callerData.evalFlag) {
        return '(eval)' + callerData.functionName;
    } else {
        return callerData.functionName;
    }
}

function getDetailedString(func) {
    var callerData = getData(func || getCaller(getDetailedString));
    if (callerData.evalFlag) {
        return callerData.evalOrigin;
    } else {
        return callerData.functionName + ' at ' + callerData.filePath + ':' + callerData.lineNumber;
    }
}

function getPath(func) {
    var callerData = getData(func || getCaller(getPath));
    return callerData.filePath;
}

module.exports = {
    getData: getData,
    getString: getString,
    getDetailedString: getDetailedString,
    getPath: getPath
};