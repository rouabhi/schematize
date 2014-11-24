#Schematize - What's new#

##v 0.0.5 config## returns schematize
Now, you can write: ```var schematize = require("schematize").config({...});```

##v 0.0.4 config##
Now you have to call .config method to contigure the path where to find schema files.

##v 0.0.3 add batch processing##
You can now open more than ONE table giving an array of string as schema argument.

##v 0.0.2 Removing treble dependency##
Now **treble** is not added as a dependency. It should be added to the project dependencies (with _sequelize_ and _mysql_).

##v 0.0.1 Initial version##
Using 3 databases (**treble**) and external schemas to handle tables.
