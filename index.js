/****************************************************
 "schematize"

 An encapsulation sequelize and treble to manage 
 3 mySql databases with external schemas.

	var schematize = require("schematize")(db,schema [,db3]);
	
 *****************************************************/
// TODO :  add extra control on db & schema arguments

var varServer = require("varserver")();
var schemasPath= varServer.get("schematizePath" , {
						admin:"schemas/admin/",
						modele:"schemas/modele/",
						user:"schemas/user/"
					});

module.exports = schematize;


function schemabatch(db , schemas , db3, force) {
 var remain = schemas.length,
	 tables={},
	 err=false,
	 onSuccess = new Function(),
	 onError = new Function(),
	 successSchemaEvt = function(name) {return function(e){tables[ name ] = e; remain--; if (!remain) complete();}},
	 errorSchemaEvt = function(name){return function(e){err=true; tables[ name ] = null; remain--; if (!remain) complete();}},
	 complete = function() {if (err) onError(tables); else onSuccess(tables);};
 
 for(var index=0; index<schemas.length; index++) {
    schematize(db,schemas[index],db3,force).then(successSchemaEvt(schemas[index]),errorSchemaEvt(schemas[index]));
  }
 return {
  success:function(e){onSuccess=e;return this;},
  error:function(e){onError=e;return this;},
  then:function(success,error){onSuccess=success||onSuccess;onError=error||onError;return this;}
 };
}

function schematize(db, schema, db3, force) {
	var oSchema, oTable, oFields, oFieldsNoHidden, oFieldsKey;
	var jSchema;
	var pSchema; // schema file path
	var onSuccess=new Function(), onError=new Function();

	// if schema is an array of strings, call 'schemabatch'
	if (typeof schema =="object" && "length" in schema) return schemabatch(db,schema,db3,force);
	switch (db){
		case "a":
		case "admin" : db = "admin"; pSchema = require("path").join(schemasPath.admin, schema); break;
		case "m":
		case "modele" : db = "modele"; pSchema = require("path").join(schemasPath.modele, schema) ; break;
		default : db = "user"; pSchema = require("path").join(schemasPath.user, schema);
	}
	try {
		oSchema = require(pSchema);
 	}
	catch(err){
		return {success:function(){return this;},error:function(e){e();return this;},then:function(success,error){error();return this;}};
	}
	jSchema = oSchema(require("./myTypes"))[1];
	for(var field in jSchema) {
		delete jSchema[field].validate;
		delete jSchema[field].defaultValue;
		delete jSchema[field].allowNull;
		delete jSchema[field].unique;
		if (jSchema[field].hidden) delete jSchema[field];
	}
	oSchema = oSchema(require('sequelize'));
	oCon = db3?db3.get(db):null;
	oFields = [];
	oFieldsNoHidden = [];
	oFieldsKey = [];
	for(var field in oSchema[1]) {
		oFields.push(field);
		if (oSchema[1][field].primaryKey) oFieldsKey.push(field);
		if (!oSchema[1][field].hidden) oFieldsNoHidden.push(field);
	}
	if (!oFieldsKey.length) {
		oFieldsKey.push("id");
		oFields.push("id");
		oFieldsNoHidden.push("id");
	} // if no primary key given, "id" default primary key added

	oTable = oCon?oCon.define.apply( oCon , oSchema ):null;
	var sentObj={
		fields:getFields,
		schema:function(){return oSchema[1]},
		jSchema:function(){return {s:jSchema,k:oFieldsKey};},
		table:function(con){if (con) oTable = con.define.apply( con , oSchema );return oTable;},
		find:findData,
		findAll:loadData,
		update:updateData,
		destroy:destroyData,
		create:addData
	}
	if (db3) {
		oTable.sync({force:!!force}).then( function(){ onSuccess(sentObj); }, function(e){onError(e);} );
		return {
			success:function(e){onSuccess=e;return this;},
			error:function(e){onError=e;return this;},
			then:function(success,error){onSuccess=success||onSuccess; onError=error||onError;return this;}
		}
	}
	else { // no connection given: operation succeded without syncing database
		return {
			success:function(e){e(sentObj);return this;},
			error:function(e){return this;},
			then:function(success,error){success(sentObj);return this;}
		}
  	}

	function getFields(type){
		 switch(type){
		  case "nohidden": return oFieldsNoHidden;
		  case "primary": return oFieldsKey;
		  default : return oFields;  
		 }
	}

	function loadData( Options ) {
		var onSuccess = new Function(),
			onError = new Function();
		 
		if (!oTable) {
			return {
					success:function(){return this;},
					error:function(e){e();return this;},
					then:function(success,error){error();return this;}
				};
		}
		Options = Options || {};
		if (typeof Options.limit !== "number") Options.limit = 20;
		oTable.findAll(Options).then( function(result){onSuccess(data2func(result));}, function(e){onError();} );
		return {
			success:function(e){onSuccess=e;return this;},
			error:function(e){onError=e;return this;},
			then:function(success,error){onSuccess=success||onSuccess;onError=error||onError;return this;}
		};
	}

	function updateData(values , where , fields) {
		var onSuccess = new Function(),
			onError = new Function();

		if (!oTable) return {
			success:function(){return this;},
			error:function(e){e();return this;},
			then:function(success,error){error();return this;}
		};
		oTable.update(values , where , fields).then( function(result){onSuccess(data2func(result));}, function(){onError();} );
		return {
			 success:function(e){onSuccess=e;return this;},
			 error:function(e){onError=e;return this;},
			 then:function(success,error){onSuccess=success||onSuccess;onError=error||onError;return this;}
		}
	}

	function addData(values , fields) {
		var onSuccess = new Function(),
			onError = new Function();
		 
		if (!oTable) return {
			success:function(){return this;},
			error:function(e){e();return this;},
			then:function(success,error){error();return this;}
		}
		fields = fields || [];
		for(var field in values) if (fields.indexOf(field)<0) fields.push( field );
		
		oTable.create(values , fields).then( function(result){onSuccess(data2func(result));}, function(e){onError(e);} );
		return {
			success:function(e){onSuccess=e;return this;},
			error:function(e){onError=e;return this;},
			then:function(success,error){onSuccess=success||onSuccess;onError=error||onError;return this;}
		}
	}

	function destroyData(where) {
		var onSuccess = new Function(),
			onError = new Function();
	 
		if (!oTable) return {
			success:function(e){return this;},
			error:function(e){e();return this;},
			then:function(success,error){error();return this;}
		}
		oTable.destroy(where).then( function(result){onSuccess(data2func(result));}, function(){onError();} );
		return {
			success:function(e){onSuccess=e;return this;},
			error:function(e){onError=e;return this;},
			then:function(success,error){onSuccess=success||onSuccess;onError=error||onError;return this;}			 
		}
	}

	// receive the result of find or findAll
	// return a function:
	//	 data2func(result)( fields ) is an array
	//	 data2func(result)( fields , key ) is an object
	function data2func(data){
		 if (!data) return new Function();
		 if (typeof data.length == "number") return function(fields,key,methods, noHidden){return array2data( data , fields , key , methods, noHidden);}
		 else return function(fields, methods, noHidden){return modele2data( data, fields, methods, noHidden );}
	}

	function findData( Options ) {
		var onSuccess = new Function(),
			onError = new Function();
	 
		if (!oTable) return {
			success:function(e){return this;},
			error:function(e){e();return this;},
			then:function(success,error){error();return this;}
		}

		oTable.find(Options).then( function(result){onSuccess(data2func(result),result);}, function(err){onError(null);} );
		return {
			success:function(e){onSuccess=e;return this;},
			error:function(e){onError=e;return this;},
			then:function(success,error){onSuccess=success||onSuccess;onError=error||onError;return this;}
		};
	}

	function modele2data(data, fields, methods, noHidden) {
		var result;
		 
		if (!data) result = null; // no data
		else if (typeof fields=="string") {
			result = data[ fields ];
		}
		else {
			result = {}
			fields = fields || (noHidden?oFieldsNoHidden:oFields);
			fields.forEach(function(field){ if (data[ field ] !== null) result[ field ] = data[ field ];})
			if (methods) methods.forEach(function(method){ result[method] = data[ method ].call(data);})
		}
		return result;
	}

	// if you give a 'key', you get an {Object}
	// Without a 'key' you get an [Array]
	function array2data(data, fields, key, methods, noHidden) {
		var result = key ? {} : [];
		data.forEach( function(model){
		var value = modele2data(model , fields , methods, noHidden);
		key ? 
			(((model[key] !== null) && (typeof model[key] !== "undefined")) ? (result[model[key]] = value) : null )
			: 
			(result.push( value )); 
		});
		return result;
	}

}

schematize.config = function( options ){
	if (options){
		if (options.path){
			if (typeof options.path == "string") {
				schemasPath.admin = options.path + "admin/";
				schemasPath.modele = options.path + "modele/";
				schemasPath.user = options.path + "user/";
				varServer.set("schematizePath" , schemasPath);
			}
			else {
				if (options.path.admin) schemasPath.admin = options.path.admin;
				if (options.path.modele) schemasPath.modele = options.path.modele;
				if (options.path.user) schemasPath.user = options.path.user;
				varServer.set("schematizePath" , schemasPath);
			}
		}
	}
	return schematize;
}