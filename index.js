/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var htmlMinifier = require("html-minifier");
var attrParse = require("./lib/attributesParser");
var SourceNode = require("source-map").SourceNode;
var loaderUtils = require("loader-utils");
var url = require("url");

function randomIdent() {
	return "xxxHTMLLINKxxx" + Math.random() + Math.random() + "xxx";
};


module.exports = function(content) {
	this.cacheable && this.cacheable();
	var query = loaderUtils.parseQuery(this.query);
	var attributes = ["img:src", "*:style"];
	if(query.attrs !== undefined) {
		if(typeof query.attrs === "string")
			attributes = query.attrs.split(" ");
		else if(Array.isArray(query.attrs))
			attributes = query.attrs;
		else if(query.attrs === false)
			attributes = [];
		else
			throw new Error("Invalid value to query parameter attrs");
	}
	var root = query.root;
	var links = attrParse(content, function(tag, attr) {
		return attributes.indexOf(tag + ":" + attr) >= 0 || attributes.indexOf("*:" + attr) >= 0;
	}).sort(function(a, b) {
		if (a.start === b.start) return 0;
		return a.start > b.start ? -1 : 1;
	});
	var data = {};
	content = [content];
	links.forEach(function(link) {
		if(!loaderUtils.isUrlRequest(link.value, root)) return;

		var uri = url.parse(link.value);
		if (uri.hash !== null && uri.hash !== undefined) {
				uri.hash = null;
				link.value = uri.format();
				link.length = link.value.length;
		}

		do {
			var ident = randomIdent();
		} while(data[ident]);
		data[ident] = link.value;
		var x = content.pop();
		content.push(x.substr(link.start + link.length));
		content.push(ident);
		content.push(x.substr(0, link.start));
	});
	content.reverse();
	content = content.join("");
	if(typeof query.minimize === "boolean" ? query.minimize : this.minimize) {
		content = htmlMinifier.minify(content, {
			removeComments: query.removeComments !== false,
			collapseWhitespace: query.collapseWhitespace !== false,
			collapseBooleanAttributes: query.collapseBooleanAttributes !== false,
			removeAttributeQuotes: query.removeAttributeQuotes !== false,
			removeRedundantAttributes: query.removeRedundantAttributes !== false,
			useShortDoctype: query.useShortDoctype !== false,
			removeEmptyAttributes: query.removeEmptyAttributes !== false,
			removeOptionalTags: query.removeOptionalTags !== false
		});
	}
	return "module.exports = " + JSON.stringify(content).replace(/xxxHTMLLINKxxx[0-9\.]+xxx/g, function(match) {
		if(!data[match]) return match;
		return '" + require(' + JSON.stringify(loaderUtils.urlToRequest(data[match], root)) + ') + "';
	}) + ";";
}
