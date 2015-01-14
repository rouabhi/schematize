function fSTRING(length){return "string("+length+")";}
fSTRING.valueOf = function(){return "string";};
fSTRING.BINARY = "string";

function fFLOAT(length,decimal){return "float";}
fFLOAT.valueOf = function(){return "float";};

function fINT(){return "int";}
fINT.valueOf = function(){return "int";};

function fENUM(){return "enum";}
fENUM.valueOf = function(){return "enum";};

exports.STRING = fSTRING;
exports.INTEGER=fINT;
exports.BIGINT=fINT;
exports.BOOLEAN="boolean";
exports.DATE="date";
exports.ENUM="enum";
exports.TEXT="text";
exports.BINARY = "binary";
exports.FLOAT = fFLOAT;
exports.DECIMAL = fFLOAT;
exports.HSTORE = "hstore";
exports.ARRAY = "array";
exports.ENUM = fENUM;
exports.UUID = "uuid";