/****************************************************


 Une surcouche à sequelize
	var schematize = require("schematize")(db,schema [,db3]);
	
	if (!schematize) throw ERROR;
    schematize.fields(); // retourne la liste des champs
    schematize.table( [con] ); // ouvre la table. Retourne null si schema introuvable
	//** schematize.schema(); // retourne le schema (deprecated)
	
 *****************************************************/
// TODO :  rajouter une sécurité par rapport a db & schema !!


module.exports = function(db, schema, db3) {
	var oSchema, oTable, oFields, oFieldsNoHidden, oFieldsKey;
	var jSchema;
	var path;
	var onSuccess=new Function(), onError=new Function();

		switch (db){
			case "a":
			case "admin" : db = "admin"; path = require("path").join(__dirname , "../../schemas/admin/", schema); break;
			case "m":
			case "modele" : db = "modele"; path = "../../schemas/modele/"+schema; break;
			default : db = "user"; path = "../../schemas/user/"+schema;
		}
		try {
			oSchema = require(path);
	 	}
		catch(e){
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
			oTable.sync().then( function(){ onSuccess(sentObj); }, function(e){onError(e);} );
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
				then:function(success,error){error();return this;}
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
			success:function(e){return this;},
			error:function(e){e();return this;},
			then:function(success,error){error();return this;}
		}

		oTable.create(values , {fields:fields}).then( function(result){onSuccess(data2func(result));}, function(){onError();} );
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
		 if (!data) return function(){};
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

	// avec 'key' on a un objet
	// sans 'key' on a un tableau
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