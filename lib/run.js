
// build a simple list of parser vs versions
// build for template use
function getList( parsers, versions ){
	var out = [];
	parsers.forEach(function(parser){
		var parserObj = {name: parser.name, items:  []}
		versions.forEach(function(version){
			parserObj.items.push({name: parser.name, version: version.name})
		})
		out.push(parserObj)
	})
	return out;
}

exports.getList = getList;