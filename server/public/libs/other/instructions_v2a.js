var gInstructions= {
	instructionIndex:-1,
	taskIndex:-1,
	subtaskIndex:0,
	
	topHeadingId:'',
	topTextAreaId:'',
	topHeadingPrevId:'',
	topHeadingNextId:'',
	
	midHeadingId:'',
	midTextAreaId:'',
	
	botHeadingId:'',
	botTextAreaId:'',
	
	initialize: function(properties, callback) {
		var keys=Object.keys(properties);
		for(var i=0;i<keys.length;i++) {this[keys[i]]=properties[keys[i]];}
		this.setTextArea(0, 0);
		callback();
	},
	nextSubtask: function() {
		//Get Note
		var answer=document.getElementById(this.midTextAreaId).value;
		//Save Notes
		var task=this.instructions[this.instructionIndex].tasks[this.taskIndex];
		var subnote={suborder:this.subtaskIndex, subDescription:answer};
		task.subnotes.push(subnote);
		//Set Bottom Body
		var botOutputString=document.getElementById(this.botTextAreaId).value;
		botOutputString+='\n\n\t';
		botOutputString+='Question: ';
		botOutputString+=task.subtasks[this.subtaskIndex].subDescription;
		botOutputString+='\n\t';
		botOutputString+='Answer: ';
		botOutputString+=task.subnotes[this.subtaskIndex].subDescription;
		document.getElementById(this.botTextAreaId).innerHTML=botOutputString;
		//Clear Note
		document.getElementById(this.midTextAreaId).innerHTML='';
		document.getElementById(this.midTextAreaId).value='';
		//Next Subtask	
		var subTasksLength=this.instructions[this.instructionIndex].tasks[this.taskIndex].subtasks.length;
		this.subtaskIndex++;
		if(this.subtaskIndex>=subTasksLength) {
			this.subtaskIndex=0;
			this.nextTextArea();
		} else {this.setTextArea(this.instructionIndex, this.taskIndex);}
	},
	nextTextArea: function() {
		var tasksLength=this.instructions[this.instructionIndex].tasks.length;
		var nextInstructionIndex=this.instructionIndex;
		var nextTaskIndex=this.taskIndex+1;
		if(nextTaskIndex>=tasksLength) {
			nextTaskIndex=0;
			nextInstructionIndex=nextInstructionIndex+1;
			if(nextInstructionIndex>=this.instructions.length) {
				nextInstructionIndex=this.instructions.length-1;
				nextTaskIndex=this.instructions[nextInstructionIndex].tasks.length-1;
			}
		}
		this.setTextArea(nextInstructionIndex, nextTaskIndex);
	},
	prevTextArea: function() {
		var tasksLength=this.instructions[this.instructionIndex].tasks.length;
		var nextInstructionIndex=this.instructionIndex;
		var nextTaskIndex=this.taskIndex-1;
		if(nextTaskIndex<0) {
			nextTaskIndex=0;
			nextInstructionIndex=nextInstructionIndex-1;

			if(nextInstructionIndex<0) {nextInstructionIndex=0;}
			else {
				tasksLength=this.instructions[nextInstructionIndex].tasks.length;
				nextTaskIndex=tasksLength-1;
			}
		}
		this.setTextArea(nextInstructionIndex, nextTaskIndex);
	},	
	toggleTopHeading: function(isDisabled) {
		document.getElementById(this.topHeadingPrevId).disabled=isDisabled;
		document.getElementById(this.topHeadingNextId).disabled=isDisabled;
	},
	toggleMidHeading: function(isDisabled) {
		document.getElementById(this.midHeadingSaveId).disabled=isDisabled;
		document.getElementById(this.midTextAreaId).disabled=isDisabled;
	},
	toggleBotHeading: function(isDisabled) {
		document.getElementById(this.botHeadingPrintId).disabled=isDisabled;
	},
	setTextArea: function(instructionIndx, taskIndx) {
		this.instructionIndex=instructionIndx;
		this.taskIndex=taskIndx;
		var outputString='';
		//Parse Instruction
		var topHeading='Not Set';
		var midHeading='';
		var botHeading='Log Book';
		var topOutputString='Not Set';
		var midOutputString='';
		var botOutputString=document.getElementById(this.botTextAreaId).value;
		if(this.instructionIndex<this.instructions.length && this.instructionIndex>=0) {
			var instruction=this.instructions[this.instructionIndex];
			if(this.taskIndex<instruction.tasks.length && this.taskIndex>=0) {
				var task=instruction.tasks[this.taskIndex];
				//Get Top Heading
				topHeading=instruction.heading +
				       	'  (' + (this.instructionIndex+1) + 
					', task ' + (this.taskIndex+1) + 
					' of ' + instruction.tasks.length + ')';
				//Get Top Body
				topOutputString=task.title;
				topOutputString+='\n\n\t';
				topOutputString+=task.description;
				topOutputString+='\n';
				for(var i=0;i<task.subtasks.length;i++) {
					topOutputString+='\n\t\t';
					topOutputString+=(i+1) + '.  ';
					topOutputString+=task.subtasks[i].subDescription;
				}
				//Check Task Flag	
				var flag=task.flag;
				var isDisabled=true;
				if(flag==0) {
					//Toggle Controls
					this.toggleTopHeading(!isDisabled);
					this.toggleMidHeading(isDisabled);
					this.toggleBotHeading(isDisabled);
					//Get Bottom Body
					botOutputString+='\n\n\n';
					botOutputString+=task.title + ': ';
					botOutputString+=task.description;
				} else if(flag==1) {
					//Get Heading
					midHeading=task.subtasks[this.subtaskIndex].subDescription;
					//Get Body
					var subtaskText=task.subnotes[this.subtaskIndex];	
					//Toggle Controls
					this.toggleTopHeading(isDisabled);
					this.toggleMidHeading(!isDisabled);
					this.toggleBotHeading(isDisabled);
				} else if(flag==2) {
					topHeading='Excersie Over';
					this.toggleTopHeading(isDisabled);
					this.toggleMidHeading(isDisabled);
					this.toggleBotHeading(!isDisabled);
				}

			} else {
				topOutputString='Task Data index ' + this.taskIndex + ' is not valid';
				this.taskIndex=0;
			}
		} else {
			topOutputString='Instruction Data index ' + this.instructionIndex + ' is not valid';
			this.instructionIndex=0;
		}

		//Set Headings
		app.detailsView.$el.find('[name="' + this.topHeadingId + '"]').val(topHeading);
		app.detailsView.$el.find('[name="' + this.midHeadingId + '"]').val(midHeading);
		app.detailsView.$el.find('[name="' + this.botHeadingId + '"]').val(botHeading);
		//Set Text Area
		document.getElementById(this.topTextAreaId).innerHTML=topOutputString;
		document.getElementById(this.midTextAreaId).innerHTML=midOutputString;
		document.getElementById(this.botTextAreaId).innerHTML=botOutputString;
	},

	/* JSON Object for instructions */
	instructions: [
		{
			section: 0, 
			heading: "Introduction", 
			tasks: 
			[
				{
					order:0, title:"Summary", flag:0,
					description: "The goal of the following set of experiments and analysis is to learn about the phototactic behavior of Euglena, and more generally practice how to be a good scientist performing tasks such as forming hypothesis, exploring, making measurements, building models, and compare model and data.", 
					subtasks:
					[
						{suborder:0, subDescription:"Phototactic Behavior of Euglena."},
						{suborder:1, subDescription:"Scientific Practices."},
						{suborder:2, subDescription:"Hypothesis & Exploring"},
						{suborder:3, subDescription:"Measurements, models, and data."},
					],
					subnotes:[],
				},
				{
					order:1, title:"Questions", flag:1,
					description: "Answer Questions in box below.", 
					subtasks:
					[
						{suborder:0, subDescription:"What do you know about Euglena?"},
						{suborder:1, subDescription:"Do you know anything about Scientific Practices?"},
					],
					subnotes:[],

				},
				{
					order: 2, title:"Overview", flag:0, 
					description: "Below is a list of the Major sections for this experiment.", 
					subtasks:
					[
						{suborder:0, subDescription:"Wet Lab"},
						{suborder:1, subDescription:"Tracking Lab"},
						{suborder:2, subDescription:"Modeling Lab"},
						{suborder:3, subDescription:"Discussion & Conclusions"},
					],
					subnotes:[],
				},
				{
					order:3, title:"Questions", flag:1,
					description: "Answer Questions", 
					subtasks:
					[
						{suborder:0, subDescription:"Do you have any prior experience with this system."},
					],
					subnotes:[],
				},
			],
		},
		{
			section: 1, 
			heading: "Wet Lab", 
			tasks: 
			[
				{
					order: 0, title:"Login", flag:0,
					description:"Login Procedures", 
					subtasks:
						[
							{suborder:0, subDescription:"http://171.65.102.132:3000"},
							{suborder:1, subDescription:"Go here"},
							{suborder:2, subDescription:"Click this"},
							{suborder:2, subDescription:"Enter username & pasword"},
						],
					subnotes:[],
				},
				{
					order: 1, title:"Research", flag:0,
					description: "Background Information",
					subtasks:
						[
							{suborder:0, subDescription:"Link to wet lab instructions"},
						],
					subnotes:[],
				},
				{
					order:2, title:"Questions", flag:1,
					description: "Answer Questions", 
					subtasks:
						[
							{suborder:0, subDescription:"Describe in your own words how it works."},
							{suborder:1, subDescription:"What does widget X do?"},
							{suborder:2, subDescription:"How is widget X connected to widget Y?"},
						],
					subnotes:[],
				},
				{
					order:3, title:"Observations", flag:0,
					description:"Observe the Euglena!", 
					subtasks:
						[
							{suborder:0, subDescription:"Watch euglena for about a minute or so."},
							{suborder:1, subDescription:"Make a 30 second movie"},
							{suborder:2, subDescription:"Click button X to save image"},
						],
					subnotes:[],
				},
				{
					order:4, title:"Questions", flag:1,
					description: "Answer Questions", 
					subtasks:
						[
							{suborder:0, subDescription:"What do you see?"},
							{suborder:1, subDescription:"What do you think would happen if you shine light from one side onto the euglena?"},
						],
					subnotes:[],
				},
				{
					order:5, title:"Experiment", flag:0,
					description:"Illuminate the Euglena!", 
					subtasks:
						[
							{suborder:0, subDescription:"Use the joystick to shine light on the euglena."},
							{suborder:1, subDescription:"Test different directions and stregths."},
							{suborder:2, subDescription:"Record a 30 second movie showing how the euglena respond to your light."},
							{suborder:3, subDescription:"Click button X to save image"},
						],
					subnotes:[],
				},
				{
					order:6, title:"Questions", flag:1,
					description: "Compare your hypothesis to your experimental data.", 
					subtasks:
						[
							{suborder:0, subDescription:"How did you hypothesis compare with your results."},
						],
					subnotes:[],
				},
			],
		},
		{
			section: 2, 
			heading: "Tracking Lab", 
			tasks: 
			[
				{
					order: 0, title:"Navigate to Tracking Lab", flag:0,
					description:"Procedures", 
					subtasks:
						[
							{suborder:0, subDescription:"Go here"},
							{suborder:1, subDescription:"Click this"},
						],
					subnotes:[],
				},
				{
					order: 1, title:"Research", flag:0,
					description: "Background Information",
					subtasks:
						[
							{suborder:0, subDescription:"Link to/description of tracking lab instructions."},
						],
					subnotes:[],
				},
				{
					order:2, title:"Questions", flag:1,
					description: "Answer Questions", 
					subtasks:
						[
							{suborder:0, subDescription:"Describe in your own words how it works."},
							{suborder:1, subDescription:"What does widget X do?"},
							{suborder:2, subDescription:"How is widget X connected to widget Y?"},
						],
					subnotes:[],
				},
				{
					order:3, title:"Load your Image Data", flag:0,
					description:"Load the images you just collected form the microscope.", 
					subtasks:
						[
							{suborder:0, subDescription:"Click through the image set and observe the frames."},
							{suborder:1, subDescription:"Pick one Euglena and visually follow it though the frames."},
						],
					subnotes:[],
				},
				{
					order:4, title:"Questions", flag:1,
					description: "Answer Questions", 
					subtasks:
						[
							{suborder:0, subDescription:"How is this different from observing the Euglena live in the microscope?"},
							{suborder:1, subDescription:"How many frames did your Euglena stay visible? When did it disappear?"},
						],
					subnotes:[],
				},
				{
					order:5, title:"Measurement", flag:0,
					description:"Track the Euglena!", 
					subtasks:
						[
							{suborder:0, subDescription:"Using the euglena you watched in the last two steps. Click on it with the mouse."},
							{suborder:1, subDescription:"The frame should advance as after you clicked and a point should appear where you clicked."},
							{suborder:2, subDescription:"Continue tracking the same euglena by clicking on its position until it disappears."},
							{suborder:3, subDescription:"When finished, click save track button."},
							{suborder:4, subDescription:"Repeat this step two more times, saving your data."},
							{suborder:5, subDescription:"When finished save image in log book."},
						],
					subnotes:[],
				},
				{
					order:6, title:"Questions", flag:1,
					description: "", 
					subtasks:
						[
							{suborder:0, subDescription:"How fast did your euglena move?"},
							{suborder:1, subDescription:"Describe you method for determining their speeds."},
						],
					subnotes:[],
				},
			],
		},
		{
			section: 3, 
			heading: "Modeling Lab", 
			tasks: 
			[
				{
					order: 0, title:"Navigate to Modeling Lab", flag:0,
					description:"Procedures", 
					subtasks:
						[
							{suborder:0, subDescription:"Go here"},
							{suborder:1, subDescription:"Click this"},
						],
					subnotes:[],
				},
				{
					order: 1, title:"Research", flag:0,
					description: "Background Information",
					subtasks:
						[
							{suborder:0, subDescription:"Link to/description of modeling lab instructions."},
						],
					subnotes:[],
				},
				{
					order:2, title:"Questions", flag:1,
					description: "Answer Questions", 
					subtasks:
						[
							{suborder:0, subDescription:"Describe in your own words how it works."},
							{suborder:1, subDescription:"What does widget X do?"},
							{suborder:2, subDescription:"How is widget X connected to widget Y?"},
						],
					subnotes:[],
				},
				{
					order:3, title:"Load Tracking Data", flag:0,
					description:"Load the images and data you just created in the Tracking Lab.", 
					subtasks:
						[
							{suborder:0, subDescription:"Click through the image set and observe"},
							{suborder:1, subDescription:"Your tracking data should be displayed on the image."},
						],
					subnotes:[],
				},
				{
					order:5, title:"Setup your Model", flag:0,
					description: "Resize and Oriente the model euglena.", 
					subtasks:
						[
							{suborder:0, subDescription:"Use these controls to change the size of the model. Length, width and height."},
							{suborder:1, subDescription:"Use these controls to move the euglena position."},
							{suborder:2, subDescription:"Use these controls to rotate the euglena."},
						],
					subnotes:[],
				},
				{
					order:5, title:"Surge Experiment", flag:0,
					description:"Set the forward speed and run a simulation.", 
					subtasks:
						[
							{suborder:0, subDescription:"Enter a surge value."},
							{suborder:1, subDescription:"Click save parameters."},
							{suborder:2, subDescription:"Click Run and observe the motion of your euglena over your tracking data."},
							{suborder:3, subDescription:"Click stop when finish to reset the euglena."},
							{suborder:4, subDescription:"Repeat this step a few times with different values for the surge.  When finished click save."},
						],
					subnotes:[],
				},
				{
					order:6, title:"Questions", flag:1,
					description: "Compare Data", 
					subtasks:
						[
							{suborder:0, subDescription:"How does the surge in your model compare to what you have measured from your tracked data?"},
							{suborder:1, subDescription:"Where do you think the discrepancies are coming from?"},
							{suborder:2, subDescription:"Describe qualitative differences between your model and the real data."},
						],
					subnotes:[],
				},
				{
					order:5, title:"Pitch and Roll Experiment", flag:0,
					description:"Set the forward speed, pitch and roll and run a simulation.", 
					subtasks:
						[
							{suborder:0, subDescription:"Set the surge value to 0.1 and pick values for pitch and roll."},
							{suborder:1, subDescription:"Click save parameters."},
							{suborder:2, subDescription:"Click Run and observe the motion of your euglena over your tracking data."},
							{suborder:3, subDescription:"Click stop when finish to reset the euglena."},
							{suborder:4, subDescription:"Repeat this step a few times with different values for the pitch and roll.  When finished click save."},
						],
					subnotes:[],
				},
				{
					order:6, title:"Questions", flag:1,
					description: "Compare Data", 
					subtasks:
						[
							{suborder:0, subDescription:"What did you see in this model"},
							{suborder:1, subDescription:"How did it compare to the surge experiment."},
						],
					subnotes:[],
				},
				{
					order:7, title:"Light response", flag:0,
					description:"Now we will try to make a model that can follow the light. Go to the modeling tab and change the 'light sensitivity parameters.", 
					subtasks:
						[
							{suborder:0, subDescription:"Set the surge value to 0.1 and pick values for pitch and roll."},
							{suborder:0, subDescription:"Turn on one light with the light buttons."},
							{suborder:1, subDescription:"Click save parameters."},
							{suborder:2, subDescription:"Click Run and observe the motion of your euglena over your tracking data."},
							{suborder:3, subDescription:"Click stop when finish to reset the euglena."},
							{suborder:4, subDescription:"Repeat this step a few times with different lights turned on."},
						],
					subnotes:[],
				},
				{
					order:8, title:"Questions", flag:1,
					description: "Compare Data", 
					subtasks:
						[
							{suborder:0, subDescription:"Do you see effects when you turn on and off he virtual light?"},
						],
					subnotes:[],
				},
			],
		},
		{
			section:4, 
			heading:"Disc/Conclusions", 
			tasks: 
			[
				{
					order: 0, title:"Modeling results", flag:1,
					description:"Analyzing the modeling results", 
					subtasks:
						[
							{suborder:0, subDescription:"Summarize your modeling results"},
							{suborder:1, subDescription:"s there anything you would like to improve on your model – and how would you do that?"},
						],
					subnotes:[],
				},
				{
					order: 1, title:"Conclusions", flag:0,
					description: "Overall expereince and Feedback.",
					subtasks:
						[
							{suborder:0, subDescription:"Please conclude on your overall experience / what did you learn?."},
						],
					subnotes:[],
				},
			],
		},
	]
};
