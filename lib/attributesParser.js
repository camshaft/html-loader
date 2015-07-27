/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
var Parser = require("fastparse");

function processUrl(match, strUntilUrl, url, index) {
	var result = {
		start: this.index + strUntilUrl.length + index,
		length: url.length,
		value: url
	}
	this.results.push(result);
}

var cssParser = new Parser({
	url: {
		"(url\\s*\\(\\s*\"\\s*)([^\"]+)": processUrl,
		"(url\\s*\\(\\s*\'\\s*)([^\']+)": processUrl,
		"(url\\s*\\(\\s*)([^\\)]+)": processUrl,
	}
});

var processStyle = function(match, strUntilCss, css, index) {
	if(!this.isRelevantTagAttr(this.currentTag, 'style')) return;
	cssParser.parse('url', css, {
		results: this.results,
		index: index + strUntilCss.length
	});
};

var processMatch = function(match, strUntilValue, name, value, index) {
		if(!this.isRelevantTagAttr(this.currentTag, name)) return;
		this.results.push({
				start: index + strUntilValue.length,
				length: value.length,
				value: value
		});
};

var parser = new Parser({
	outside: {
		"<!--.*?-->": true,
		"<![CDATA[.*?]]>": true,
		"<[!\\?].*?>": true,
		"<\/[^>]+>": true,
		"<([a-zA-Z\\-:]+)\\s*": function(match, tagName) {
			this.currentTag = tagName;
			return "inside";
		}
	},
	inside: {
		"\\s+": true, // eat up whitespace
		">": "outside", // end of attributes
		"(style\\s*=\\s*\")([^\"]*)\"": processStyle,
		"(style\\s*=\\s*\')([^\']*)\'": processStyle,
		"(style\\s*=\\s*)([^\\s>]+)": processStyle,
		"(([a-zA-Z\\-]+)\\s*=\\s*\")([^\"]*)\"": processMatch,
		"(([a-zA-Z\\-]+)\\s*=\\s*\')([^\']*)\'": processMatch,
		"(([a-zA-Z\\-]+)\\s*=\\s*)([^\\s>]+)": processMatch
	}
});


module.exports = function parse(html, isRelevantTagAttr) {
	return parser.parse("outside", html, {
		currentTag: null,
		results: [],
		isRelevantTagAttr: isRelevantTagAttr
	}).results;
};
