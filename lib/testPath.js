 var fs            = require('fs'),
     path          = require('path'),
     dir           = require('node-dir');
	 
// returns 
/*
	options{
		"version": "micorfomats-v2",
		"format": "h-card",
		"name": "justaname"	
	}
*/	 	 
function getLocalPath(options, config){
	var out = null;
	
	if(options && config){
		out  = path.resolve(__dirname , config.localPathToTests) +  '/';
		
		// microformat verions directory ie micorfomats-v2
		if(options.version){
			out += options.version + '/';
			
			// format directory ie h-card
			if(options.format){
				out += options.format + '/';
			
				// file name of test ie justaname
				if(options.name){
					
					// fileFormat json or html
					if(options.fileFormat){
						out += options.name + '.' + options.fileFormat;
					}else{
						out += options.name + '.json'; // defaults to .json
					}
				}
				
				if(options.changeLog !== undefined && options.changeLog){
					out += 'change-log.html';
				}	
			}	
		}
	}
	
	
	return out;
}


exports.getLocalPath = getLocalPath;