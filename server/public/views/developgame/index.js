/* global app:true */
(function() {
    'use strict';

    var textarea = document.getElementById('code');
	var starterCode = "class BioticGame {\n\n" +
			   "\t\tprivate final int LEVEL = 0;\n\n" +
			   "}";
	var editor = new CodeMirror(document.getElementById('codediv'), {
		height: "350px",
		content: starterCode,
		parserfile: ["http://codemirror.net/1/contrib/java/js/tokenizejava.js", "http://codemirror.net/1/contrib/java/js/parsejava.js"],
		stylesheet: "http://codemirror.net/1/contrib/java/css/javacolors.css",
		path: "http://codemirror.net/1/js/",
		autoMatchParens: true
	});
    

} ());