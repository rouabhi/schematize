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
* schema : Is the table name, described by a schema file
* db3 is a connection object created with *treble* package.

## Where to put schemas ? ##
To configure the path where to find schema files, you should use one of the two syntaxes:


**syntax 1:**
```javascript
    var schematize = require("schematize").config({path:__dirname+"/schemas/"})
```
In this case, schemas are in 3 subdirectories named "admin/","modele/","user/" from the specified path.

**syntax 2:**
```javascript
    var schematize = schematize.config({path:{admin:__dirname+"/schemas/admin/", modele:__dirname+"/schemas/modele/",user:__dirname+"/schemas/user/"})
```

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
 * tUsers.count( {*options*} )
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
## Batch processing ##
When you have to open more than ONE table to do a task, you have to use the batch style of the command by giving an array as 'schema' argument. The succes event is fired when ALL the tables are opened. If ONE schema at least does not exist, an error is fired:
```javascript
schematize("admin",["users","companies","databases"],db3)
    .then( function( tables ){
        tables.users.find( {login,"myLogin"}).then(
            function( oneLogin ){
                console.log( "User credencials: ",oneLogin(['login','password','email']) );
            },
            function(  ){
                console.log( "User not found!" );
            },
        )
    },
    function(tables){
        console.log("An error occured..");
    });
```
## Force table drop ##
If you want to open one or more **new** tables, and drop them is they exist already, you can add a 4th argument (force) for ```schematize(...)``` :

```javascript
// tables dropped if exist
schematize("user",["products","custumers","bills"],db3,true)
    .then( function( tables ){
    }
```
