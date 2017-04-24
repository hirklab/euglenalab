/* global app:true */
(function() {
    'use strict';

    var textarea = document.getElementById('code');
	var starterCode = "public class MyBioticGame extends BioticGame {\n\n" +
			   "\t\t /* Game constants. */ \n" +
			   "\t\tprivate final int SCREEN_WIDTH = 640;\n" +
			   "\t\tprivate final int SCREEN_HEIGHT = 480;\n\n" +
			   "\t\t /* Game variables. */ \n" +
			   "\t\tprivate OrganismCounter globalCounter;\n" +
			   "\t\tprivate int euglenaCount;\n" +
			   "\t\tprivate int level = 0;\n\n" +
			   "\t\t /* Game constructor. */ \n" +
			   "\t\tMyBioticGame() {\n" +
			   "\t\t\t\t super(); */ \n" +
			   "\t\t\t\t /* Your code here... */ \n" +
			   "\t\t\t\t startGame(); \n" +
			   "\t\t}\n\n" +
			   "\t\t /* Main game loop. */ \n" +
			   "\t\tpublic void run() {\n" +
			   "\t\t\t\t super.run(); */ \n" +
			   "\t\t\t\t /* Your code here... */ \n" +
			   "\t\t\t\t if (euglenaCount < 2) \n" +
			   "\t\t\t\t\t\t endGame(\"Out of Euglena. Game over!\"); \n" +
			   "\t\t\t\t } \n" +
			   "\t\t}\n\n" +
			   "\t\t /* This code runs when the game first starts. */ \n" +
			   "\t\tpublic void startGame() {\n" +
			   "\t\t\t\t super.startGame(); */ \n" +
			   "\t\t\t\t /* Your code here... */ \n" +
			   "\t\t\t\t globalCounter = new EuglenaCounter(SCREEN_WIDTH, SCREEN_HEIGHT); \n" +
			   "\t\t\t\t euglenaCount = globalCounter.getEuglenaCount(); \n" +
			   "\t\t}\n\n" +
			   "\t\t /* This code runs when the game first starts. */ \n" +
			   "\t\tpublic void endGame(String endGameMessage) {\n" +
			   "\t\t\t\t super.endGame(endGameMessage); */ \n" +
			   "\t\t\t\t /* Your code here... */ \n" +
			   "\t\t}\n\n" +
			   "" +
			   "}";
	var editor = new CodeMirror(document.getElementById('codediv'), {
		height: "750px",
		content: starterCode,
		parserfile: ["http://codemirror.net/1/contrib/java/js/tokenizejava.js", "http://codemirror.net/1/contrib/java/js/parsejava.js"],
		stylesheet: "http://codemirror.net/1/contrib/java/css/javacolors.css",
		path: "http://codemirror.net/1/js/",
		autoMatchParens: true
	});
    

} ());