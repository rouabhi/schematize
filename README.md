# Schematize #

**schematize** is a node.js package that is an encapsulation of **Sequelize** and **treble** packages to handle 3 databases using *external schema files*. 

Having access to 3 databases simultaneously and using external schemas and promise-like syntax permit to write business apps lot more easily.

To use **schematize** you should add **schematize**, **sequelize**, **mysql** and **treble** packages to your project.

## How does it work? ##
```javascript
    var db3 = require("treble")( Sequelize ,"mysql://login:password@host:port/webase");
    var schematize = require("schematize");

    schematize("admin","users",db3)
        .then( function(tUsers){ // success
             ...
            },
            function(){ // failor
                console.log("An error occured");
            }
        );
```

schematize is called with 3 parameters:
* db : database admin|modele|user.
* schema : Is the table name, described by a schema file situated in "***schemas/[db]/[schema].js***"

Example of content for _users.js_:
```javascript
module.exports = function(DataTypes) {
  return ['users',{
     userID:{type:DataTypes.INTEGER, autoIncrement: true, allowNull: false, primaryKey:true},
     login:{type:DataTypes.STRING(25),  allowNull:false, unique:true},
     email:{type:DataTypes.STRING(150), allowNull:true,  unique:true, validate:{isEmail:true}},
     password:{type:DataTypes.STRING(50),allowNull:false},
    },
    {
     charset: 'utf8',
     collate: 'utf8_general_ci',
     comment:"Comprehensive list of all users"
    }];
}
```

The object given by the success handler offers the following methods:
 * tUsers.find( {*options*}) -> promise,function
 * tUsers.findAll( {*options*})
 * tUsers.update(values , where , fields)
 * tUsers.destroy({*where*:{*filter*}})
 * tUsers.create({*values*},[*fields*])

These methods are almost the same methods offered by **sequelize**. They can be managed using handlers:
 * .success(handler)
 * .error(handler)
 * or a promise-like syntaxe .then( successHandler , errorHandler )
The success handler has a argument that is a _function_. Calling it permits to have the result data in an array or in an object irectly.

## Example ##
```javascript
    var db3 = require("treble")( Sequelize ,"mysql://login:password@host:port/webase");
    var schematize = require("schematize");

    schematize("admin","users",db3)
        .then( function(tUsers){
            tUsers.findAll({limit:10}).then(
                    function(data){console.log("Users list:",data(["login","email"]));
                        console.log("Users list as an object:",data(["login","email"],"login"));
                        tUsers.create({login:'mylogin',password:'mypassword',email:'me@domain.com'},['login','password','email']).then(
                            function(e){ 
                                console.log("New user inserted: ",e(['userID','login','password','email']));
                            },
                            function(){
                                console.log("User insertion failed..");
                            }
                        );
                    },
                    function(err){
                        console.log("Error reading data.");
                    });
            },
            function(e){
                console.log("Error when opening table.")
            }
        );

```
An other example with **destroy**:
```javascript
    var db3 = require("treble")( Sequelize ,"mysql://login:password@host:port/webase");

    require("schematize")("admin","users",db3)
        .then( function(tUsers){
            tUsers.destroy({where:{userID:6}}).then(
                function(e){
                    console.log("destroy success.."));
                },
                function(e){
                    console.log("destroy fail!");
                });
            })

    }
}

```
