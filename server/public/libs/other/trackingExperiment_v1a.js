var gLogBook= {
	setTextArea: function(index) {
		//Get Text Area
		var textarea = document.getElementById('LogDisplay');
		//Set/Format Text Area
		for (var i=0;i<this.instructions.length;i++) {	
			//Find instruction by step name
			var instruction=this.instructions[i];
			console.log(instruction.step, index);
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

		{"step": 1, "heading": "Experiment 1", "task":
			{"explanation": "The goal of the following set of experiments and analysis is to learn about the phototactic behavior of Euglena, and more generally practice how to be a good scientist performing tasks such as forming hypothesis, exploring, making measurements, building models, and compare model and data.", 
				"substeps": 
				[
					{"nTask": 0, "description": "What do you know about Euglena?", 
						"tasks":
							[
								'a) Enter your answer in the box below and commit to continue.',
							]
					},
					{"nTask": 1, "description":"Observe without joystick", 
						"tasks": 
							[
								"a) take a movie 1"
							]
					},
					{"nTask": 1, "description": "Play around with joystick", 
						"tasks": 
							[
								"a) take a movie 2"
							]
					},
					{"nTask": 0, "description": "Write down your qualitative observations in the notes section below",
						"tasks": 
							[
								"a) topic 1",
								"b) topic 2",
								"c) topic 3",
							]
					},
				]
			}
		},
	
		{"step": 2, "heading": "Tracking", "task":
			{"explanation": "Use the tracking tab to plot Euglena positions.", 
				"substeps": 
				[
					{"nTask": 0, "description":"Load Tracking Image Set",
						"tasks":
							[
								"a) Click on Tracking tab.",
								"b) Go to 'Image Set' heading below display.",
								"c) Pick a name from the 'Image Set' heading.",  
								"d) Enter the name into the 'Image Set Selection' box and click 'Load' buttons.",
								"e) The display above will populate with an image.",
								"f) If there are tracks plots associated with the image they will appear also.  There should be one in red.",
							]
					},
					{"nTask": 2, "description":"Create Tracks('Controls' Heading at the top under the display).", 
						"tasks": 
							[
								"a) Click the left and right button to cycle through the set of images.",
								"b) Return to frame 1, Click on 'New Path' button to create a new track.",
								"c) A new path will show up in the table.",
								"d) Click on the image to add a point to the path.",
								"e) The image will auto advance to the next frame after each click.",
								"f) Continue tracking a euglena until a pop up box appears.",
								"g) New path can be clicked at any time to start a new path.",
								"h) Repeat steps or click save to close the Image Set.",
							]
					},
					{"nTask": 0, "description": "Write down your qualitative observations in the notes section below.",
						"tasks":
							[
							]
					}
				]
			}
		},

		{"step": 4, "heading": "Data Analyzing", "task":
			{"explanation": "Working",
				"substeps": 
				[
					{"nTask": 0, "description": "Load Tracking",
						"tasks":
							[
							]
					},
					{"nTask": 0, "description":"Load Modeling",
						"tasks":
							[
							]
					}, 
					{"nTask": 0, "description": "Write down your qualitative observations",
						"tasks":
							[
							]
					}
				]
			}
		},

		{"step": 3, "heading": "Modeling Data", "task":
			{"explanation": "Compare Tracking Data with a Model",
				"substeps": 
				[
					{"nTask": 0, "description": "Load Tracking Data.",
						"tasks":
							[
								"a) Select image set name from 'Image Sets' heading.",
								"b) Type name in 'Load Image Set' heading and click load.",
								"c) The first image and set of associated track data will populate the display."
							]
					},
					{"nTask": 2, "description":"Resize/Orient Euglena Model", 
						"tasks": 
							[
								"a) Go to the 'Model Set Inits' heading.",
								"b) Use the first row of x,y,z text boxes.  Move the Euglena in the x,y plane. (-180, -170, 0)",
								"c) Rotate the euglena around it's own x axis using the second row of x,y,z text boxes. (-0.3, 0, 0)",
								"d) Set the Surge, Roll, Pitch, and Yaw.  (0.025, 0.05, 0.015, 0.015).",
								"e) Resize the model euglena with the L, W, H text boxes. 22, 8, 8)",
								"f) Set the light with the bottom row of light conrol buttons. (top)",
								"g) Choose a name in the Name text box.", 
								"h) Click save to save initialization values when completed.",
							]
					},
					{"nTask": 3, "description": "Let the model run", 
						"tasks": 
							[
								"a) Click Run to start the model.", 
								"b) Position points will be displayed as the model runs.", 
								"c) Click stop to return the model to the initial positions.",
								"d) Run a few more time, colors will start to be reused after 5 or 6.",
							        "e) data points are not being saved at the moment."	
							]
					},
					{"nTask": 0, "description": "Write down your observation",
						"tasks":
							[
							]
					}
				]
			}
		},

		{"step": 5, "heading": "Discussion", "task":
			{"explanation": "Primary Measurement",
				"substeps": 
				[
					{"nTask": 0, "description": "Summarize your results and thoughts",
						"tasks":
							[
							]
					},
					{"nTask": 0, "description": "(Optional) analyze movie 2 in a similar way",
						"tasks":
							[
							]
					},
					{"nTask": 0, "description": "Write down your qualitative observations",
						"tasks":
							[
							]
					}
				]
			}
		}
	],
}
