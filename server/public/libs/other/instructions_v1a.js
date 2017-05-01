var gInstructions= {
	setTextArea: function(index) {
		//Get Text Area
		var textarea = document.getElementById('InfoDisplay');
		//Set/Format Text Area
		for (var i=0;i<this.instructions.length;i++) {	
			//Find instruction by step name
			var instruction=this.instructions[i];
			if (instruction.step==index) {
				var str=instruction.task.explanation + "\n";
				for (var j = 0; j < instruction.task.substeps.length; j++) {
					str += "\tStep " + (j + 1) + ": " + instruction.task.substeps[j].description + "\n";
					for (var k=0;k<instruction.task.substeps[j].tasks.length; k++) {
						str += "\t\t" + instruction.task.substeps[j].tasks[k] + "\n";
					}
				}
				textarea.innerHTML=str;
				break;
			} else {textarea.innerHTML='None Found for step: ' + index;}
		}
	},
	getHeading: function(index) {
		for (var i=0;i<this.instructions.length;i++) {	
			//Find instruction by step name
			var instruction=this.instructions[i];
			if (instruction.step==index) {return instruction.heading; break;}
		}
		return 'not found'; 
	},

	/* JSON Object for instructions */
	instructions: [

		{
			"step": 1, "heading": "Introduction", "task":
			{
				"explanation": "The goal of the following set of experiments and analysis is to learn about the phototactic behavior of Euglena, and more generally practice how to be a good scientist performing tasks such as forming hypothesis, exploring, making measurements, building models, and compare model and data.", 
				
				"substeps": 
				[
					{
						"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
							],
						"questions":[
								"What do you know about Euglena?",
							],
					},
				]
			}
		},
	
		{"step": 2, "heading": "Setup", "task":
			{"explanation": "Log onto the following information page and read about the whole setup. Describe in your own words how it works.", 
				"substeps": 
				[
					{"nTask": 0, "description": "Info Link", 
						"tasks":
							[
								'a) Go to www.euglenainfo.edu',
								'b) Read the info.',
							],
						"questions":[
							],
					},
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
							],
						"questions":[
								"Describe in your own words how it works.",
							],
					},
				]
			}
		},

		{"step": 4, "heading": "Experiment 1 - WetLab", "task":
			{"explanation": "Log onto the wetlab and observe the Euglena for about 1 minute. What do you see? Also record a 30 sec movie and paste a representative image here.",
			"substeps": 
				[
					{"nTask": 0, "description": "Log in to WetLab",
						"tasks":
							[
								'a) Go To Link.',
								'b) Log in steps.',
								'c) how to get to live viewing.',
							],
					},
					{"nTask": 0, "description":"Viewing Description",
						"tasks":
							[	
								'a) live window.',
								'a) other things?.',
							],
					}, 
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
							],
						"questions":[
								"Describe in your own words how it works.",
								"What do you think would happen if you shine light from one side onto the euglena? Form a hypothesis you can test.",
							],
					},
				]
			}
		},
		
		{"step": 4, "heading": "Experiment 2 - WetLab", "task":
			{"explanation": "Log again into the wetlab. There is joystick on the side. Test different directions and strengths of light and describe what you see – compare to your hypothesis. Also record one 30sec long movie showing this light response. Paste a representative image here.",
			"substeps": 
				[
					{"nTask": 0, "description": "Log in to WetLab",
						"tasks":
							[
								'a) Go To Link.',
								'b) Log in steps.',
								'c) how to get to live viewing.',
							],
					},
					{"ntask": 0, "description":"using the controls description",
						"tasks":
							[	
								'a) joy stick.',
								'a) other window elements.',
							],
					}, 
					{"nTask": 0, "description":"Play with controls",
						"tasks":
							[	
								'a) Joy stick.',
								'a) Other window elements.',
							],
					}, 
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
							],
						"questions":[
								"describe what you see – compare to your hypothesis.",
							],
					},
				]
			}
		},
		
		{"step": 5, "heading": "Data Analysis", "task":
			{"explanation": "Go the measurement tab and load in the movie from experiment 1. Scroll back and forth – and then pick three representative euglena and track them. Then save these tracks and copy a representative image with these tracks. Write down anything you note regarding tracking.",
				"substeps": 
				[
					{"nTask": 0, "description": "Go to Tracking Tab.",
						"tasks":
							[
								'a) Go To Link.',
								'b) Log in steps.',
								'c) how to get to tracking.',
							],
					},
					{"nTask": 0, "description":"Basic description of window/controls.",
						"tasks":
							[	
								'a) Mouse click.',
								'b) buttons.',
								'b) images.',
								'b) buttons.',
							],
					}, 
					{"nTask": 0, "description":"Tracking Tutorial",
						"tasks":
							[	
								'a) Short step through of procedures.',
								'b) ...',
							],
					}, 
					{"nTask": 0, "description": "Click through images and pick three euglena.",
						"tasks":
							[
								"a) Flip through images with these buttons",
								"b) Pick euglena based on some criteria.",
								"c) notes the frames for start and finish.",
							],
					},
					{"nTask": 2, "description":"Track the euglena one at a time", 
						"tasks": 
							[
								"a) go to start frame",
								"b) click new path",
								"c) click on euglena as it moves.",
								"d) click done when finished or at the end of images.",
							],
					},
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
							],
						"questions":[
								"Write down anything you note regarding tracking.",
							],
					},
					{"nTask": 0, "description": "Repeat last two steps for other euglena.",
						"tasks":
							[
							]
					}
				]
			}
		},

		{"step": 5, "heading": "Measurement", "task":
			{"explanation": "Use this tracked data and determine the swimming speed of these three cells. Explain your method and state the results.",
				"substeps": 
				[
					{"nTask": 0, "description": "Decscription of tools available for measurements.",
						"tasks":
							[
								'a) Size, scale',
								'b) Times.',
							],
					},
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
							],
						"questions":
							[
								"Explain your method and state the results.",
							],
					},
				]
			}
		}, 
		
		{"step": 5, "heading": "Modeling 1", "task":
			{"explanation": "ow go to the modeling tab and make a model that corresponds to one of the three cells you had tracked. You need to fix length, width as well as starting orientation and x,y position of your model. Then choose a value for the “surge” and let both model and data run over each other. Iterate your model value for “surge” until both visually agree. Make a snap shot also from your model and include the modeling parameters and starting conditions in your note book.",
				"substeps": 
				[
					{"nTask": 0, "description": "Go to Modeling Tab.",
						"tasks":
							[
								'a) Go To Link.',
								'b) Log in steps.',
								'c) how to get to modeling.',
							],
					},
					{"nTask": 0, "description":"Basic description of window/controls.",
						"tasks":
							[	
								'a) Mouse click.',
								'b) buttons.',
								'b) images.',
								'b) buttons.',
							],
					}, 
					{"nTask": 0, "description":"Short Tutorial Tutorial",
						"tasks":
							[	
								'a) Short step through of procedures.',
							],
					},
					{"nTask": 0, "description": "Resize Euglena",
						"tasks":
							[
								"a) l",
								"b) w",
								"c) h",
							],
					},
					{"nTask": 2, "description":"Position Euglena", 
						"tasks": 
							[	
								"a) x",
								"b) y",
								"c) z",
							],
					},
					{"nTask": 2, "description":"Make test runs to tweak surge", 
						"tasks": 
							[	
								"a) x",
								"b) y",
								"c) z",
							],
					},
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
								'd) save initial parameters by clicking save button',
							],
						"questions":[
							],
					},
					{"nTask": 0, "description": "Run the model", 
						"tasks":
							[	
								"a) start run",
								"b) reset run",
								"c) end run",
							],
						"questions":[
							],
					},
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
								'd) save initial parameters by clicking save button',
							],
						"questions":[
								"How does the surge in your model compare to what you have measured from your tracked data? Where do you think the discrepancies are coming from?",
								"Describe qualitative differences between your model and the real data.",
							],
					},
				],
			}
		},

		{"step": 6, "heading": "Modeling 2", "task":
			{"explanation": "Now we include into modeling the possibility of a roll and a pitch motion. Go to the modeling tab and set “Roll” to 0.1 and then use different values for “pitch”. What do you see in your model? Save the model and take a snap shot of the trace.",
				"substeps": 
				[
					{"nTask": 0, "description":"Basic description New of window/controls.",
						"tasks":
							[	
								'a) pitch.',
								'b) yaw.',
							],
					}, 
					{"nTask": 0, "description": "Set Up",
						"tasks":
							[
								"a) resize euglena",
								"b) reposition",
							],
					},
					{"nTask": 2, "description":"Make test runs while changing pitch.", 
						"tasks": 
							[	
								"a) change pitch",
								"b) save",
								"c) run",
							],
					},
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
								'd) save initial parameters by clicking save button',
							],
						"questions":[
								"What do you see in your model?",
							],
					},
				],
			}
		},

		{"step": 7, "heading": "Modeling 3", "task":
			{"explanation": "Now we will try to make a model that can follow the light. Go to the modeling tab and change the “light sensitivity parameters”. Do you see effects when you turn on and off he virtual light?",
				"substeps": 
				[
					{"nTask": 0, "description":"Basic description New of window/controls.",
						"tasks":
							[	
								'a) light.',
							],
					}, 
					{"nTask": 0, "description": "Set Up",
						"tasks":
							[
								"a) resize euglena",
								"b) reposition",
								"c) repitch", 
							],
					},
					{"nTask": 2, "description":"Make test runs.", 
						"tasks": 
							[	
								"a) change pitch",
								"b) save parameters",
								"c) run",
								"d) repeat",
							],
					},
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
								'd) save initial parameters by clicking save button',
							],
						"questions":[
								"Do you see effects when you turn on and off he virtual light?",
							],
					},
				],
			}
		},

		{"step": 8, "heading": "Discussion", "task":
			{"explanation": "Summarize your modeling results",
				"substeps": 
				[
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
							],
						"questions":[
								"Summarize your modeling results",
								"Is there anything you would like to improve on your model – and how would you do that?",
							],
					},
				],
			}
		},

		{"step": 8, "heading": "Colclusion", "task":
			{"explanation": "Please conclude on your overall experience / what did you learn?",
				"substeps": 
				[
					{"nTask": 0, "description": "Complete the Excercise Below", 
						"tasks":
							[
								'a) Type into text box.',
								'b) Click save.',
								'c) The Log Book will update.',
							],
						"questions":[
								"Please conclude on your overall experience / what did you learn?",
							],
					},
				],
			},
		},
	]};
