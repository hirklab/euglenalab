/* global app:true */
(function () {
	'use strict';
	app                = app || {};
	app.TextSubmitView = Backbone.View.extend({

		timeToFinishTextExperiments: 0,

		el:       '#textsubmit',
		template: _.template($('#tmpl-textsubmit').html()),

		events:                       {
			'submit form':                 'preventSubmit',
			'keypress input[type="text"]': 'addNewOnEnter',
			'click .btn-submitTextNext':   'btnClick_submitTextNext',
		},
		//Join Button Action
		btnClick_submitTextNext:      function (evt) {
			var wantsBpuName = null;
			app.mainView.submitExperimentFromViews('text', wantsBpuName, function (err) {
				if (err) {
					console.log('btnClick_submitTextNext text submission err:' + err);
				} else {
					console.log('btnClick_submitTextNext text submission okay');
				}
			});
		},
		//Join Button Enable/Disable
		disablePrintOn:               false,
		disableSubmitTextNextButton:  function (bVal, caller) {
			var me = this;
			if (me.disablePrintOn) console.log('disableSubmitTextNextButton', bVal, caller);
			var btn = me.$el.find('[name="' + 'submitTextNext' + '"]')[0];
			if (btn) btn.disabled = bVal;
		},
		//Join Button Label Update
		setSubmitTextNextButtonLabel: function (msg) {
			var elem = this.$el.find('[name="' + 'submitTextNext' + '"]')[0];
			if (elem) elem.innerHTML = msg;
		},
		//Next Text Exp Label
		setSubmitTextNextLabel:       function (msg) {
			var lbl = this.$el.find('[name="' + 'browseLabel' + '"]')[0];
			if (lbl) lbl.innerHTML = msg;
			if (lbl && msg.indexOf('Wait') > -1) {
				lbl.parentNode.style.backgroundColor = "#AA0000";
				lbl.parentNode.style.color           = "#FFFFFF";
			} else {
				lbl.parentNode.style.backgroundColor = "#acd0ef";
				lbl.parentNode.style.color           = "#000000";
			}
		},
		//Load Status - set entirly from Text Submit
		setLoadTextLabel:             function (msg, type) {
			var lbl = this.$el.find('[name="' + 'loadLabel' + '"]')[0];
			if (lbl) {
				lbl.innerHTML = msg;
				lbl.className = type;
			}
		},

		//Other Button Actions
		preventSubmit: function (event) {
			console.log('btnClick_submitTextNext preventSubmit');
			event.preventDefault();
		},
		addNewOnEnter: function (event) {
			console.log('btnClick_submitTextNext addNewOnEnter');
			if (event.keyCode !== 13) {
				return;
			}
			event.preventDefault();
			this.addNew();
		},


		//Default
		initialize: function () {
			this.model = new app.Record();
			this.listenTo(this.model, 'change', this.render);
			this.render();
		},

		//Update
		render: function () {
			var me = this;
			me.$el.html(me.template(me.model.attributes));

			var submitTextInput = me.$el.find('[name="' + 'submitTextNextInput' + '"]')[0];

			submitTextInput.onchange = function (evt) {
				app.mainView.userExpInfo.loadTextFiles = [];

				me.setLoadTextLabel("Loading " + evt.target.files.length + " file(s)");

				var availableTextExps    = app.mainView.userExpInfo.MaxTextFileLoad - app.mainView.userExpInfo.queueTextFiles;
				var availableTextRunTime = app.mainView.userExpInfo.MaxTextTime - app.mainView.userExpInfo.queueTextRunTime;

				console.log(availableTextExps, availableTextRunTime, app.mainView.userExpInfo.MaxTextFileLoad, app.mainView.userExpInfo.queueTextFiles);

				_loadTextExperiments(availableTextExps, availableTextRunTime, evt.target.files, function (err, loadedTextFilesOutcome) {
					// console.log(err);
					// console.log(loadedTextFilesOutcome);

					if (Math.round(loadedTextFilesOutcome.totalRunTime / 1000) <= 1) {
						err = "Experiment is too short to be executed";
					}

					if (err) {
						me.setLoadTextLabel("Error:" + err, "alert-danger");
						app.mainView.userExpInfo.loadedTextFiles = [];
					} else {
						// console.log("loaded");
						app.mainView.userExpInfo.loadedTextFiles   = loadedTextFilesOutcome.fileObjects;
						app.mainView.userExpInfo.loadedTextRunTime = loadedTextFilesOutcome.totalRunTime;

						var secs = Math.round(loadedTextFilesOutcome.totalRunTime / 1000);
						me.setLoadTextLabel("Loaded " + loadedTextFilesOutcome.filesLoaded + " file(s). RunTime:" + secs + " seconds.", "alert-success");

					}
				});
			};
		},
	});
}());


//Load and Check Text Experiments
var _loadTextExperiments = function (MaxFileLoad, MaxTime, files, callback) {
	var index   = -1;
	var outcome = {
		err:          null,
		filesLoaded:  0,
		totalRunTime: 0,
		fileObjects:  [],
	};
	var next    = function () {
		index++;
		if (index < files.length && outcome.filesLoaded < MaxFileLoad && outcome.totalRunTime <= MaxTime) {
			var fileObj = {
				errTryCatch: null,
				errJson:     null,
				errColumn:   null,
				eventsToRun: [],
				metaData:    null,
			};
			var file    = files[index];
			var fr      = new FileReader();
			fr.onload   = function () {
				try {
					_tryJson(fr.result, 0, function (err, fileData) {
						if (err) {
							fileObj.errJson = "tryJson err:" + err;
							_tryColumn(fr.result, function (err, fileData) {
								if (err) {
									fileObj.errColumn = "tryColumn err:" + err;
								} else {
									if (fileData.metaData.runTime < 1000) {
										fileObj.errColumn = "tryColumn err:" + "time less than 1 second";
									} else {
										fileObj.errJson     = null;
										fileObj.errColumn   = null;
										fileObj.errTryCatch = null;
										fileObj.metaData    = fileData.metaData;
										fileObj.eventsToRun = fileData.eventsToRun;
										outcome.totalRunTime += fileData.metaData.runTime;
										outcome.filesLoaded++;
									}
								}
							});
						} else {
							if (fileData.metaData.runTime < 1000) {
								fileObj.errColumn = "tryJson err:" + "time less than 1 second";
							} else {
								fileObj.metaData    = fileData.metaData;
								fileObj.eventsToRun = fileData.eventsToRun;
								outcome.totalRunTime += fileData.metaData.runTime;
								outcome.filesLoaded++;
							}
						}
					});
				} catch (err) {
					fileObj.errTryCatch = err;
				} finally {
					outcome.err = fileObj.errJson || fileObj.errColumn || fileObj.errTryCatch;
					outcome.fileObjects.push(fileObj);
					next();
				}
			};
			fr.readAsText(file);
		} else {
			outcome.totalRunTimeSec = Math.round(outcome.totalRunTime / 1000);
			outcome.totalRunTimeMin = Math.round(outcome.totalRunTime / 60000);
			callback(outcome.err, outcome);
		}
	};
	next();
};

var _tryJson   = function (data, tries, cb_fn) {

	var tryError   = null;
	var catchError = null;
	var fileData   = null;
	try {
		var jsonData = JSON.parse(data);
		if (typeof jsonData === 'object') {
			//Check for Major Objects
			fileData        = {
				metaData:    {},
				eventsToRun: [],
			};
			var keys        = Object.keys(jsonData);
			var eventsToRun = null;
			keys.forEach(function (key) {
				if (key === 'metaData') fileData.metaData = jsonData.metaData;
				if (key === 'eventsToRun') eventsToRun = jsonData.eventsToRun;
			});
			//Check Events To Run
			if (eventsToRun !== null && typeof eventsToRun.forEach === 'function') {
				if (eventsToRun.length === 0) {
					tryError = "try JSON LightData Err:" + "No light data in eventsToRun";
				} else {
					var errDataCheck = null;

					var lightObjStart = {
						topValue:           0,
						rightValue:         0,
						bottomValue:        0,
						leftValue:          0,
						diffuserValue:      0,
						backlightValue:     0,
						culturelightValue:  0,
						ambientlightValue:  0,
						time:               0
					};

					// Push zero object at beginning of event queue.
					fileData.eventsToRun.push(lightObjStart);

					var highestTime = 2;

					for (var i = 0; i < eventsToRun.length; i++) {
						var dat = eventsToRun[i];
						if (true) { //typeof dat.topValue === 'number' && typeof dat.rightValue === 'number' && typeof dat.bottomValue === 'number' && typeof dat.leftValue === 'number' && typeof dat.diffuserValue === 'number' && typeof dat.backlightValue === 'number' && typeof dat.culturelightValue === 'number' && typeof dat.ambientlightValue === 'number' && typeof dat.time === 'number') {
							var lightDataObj = {
								topValue:          dat['topValue'] || 0,
								rightValue:        dat['rightValue'] || 0,
								bottomValue:       dat['bottomValue'] || 0,
								leftValue:         dat['leftValue'] || 0,
								diffuserValue:     dat['diffuserValue'] || 0,
								backlightValue:    dat['backlightValue'] || 0,
								culturelightValue: dat['culturelightValue'] || 0,
								ambientlightValue: dat['ambientlightValue'] || 0,
								time:              dat['time'] || 0
							};
							// Set first event time to 1 sec instead of 0 to make room for start event.
							if (i === 0) {
								lightDataObj['time'] = dat['time'] || 100;
							}
							if (dat['time'] > highestTime) {
								highestTime = dat['time'];
							}
							fileData.eventsToRun.push(lightDataObj);
						} else {
							errDataCheck = "properties needed: topValue rightValue bottomValue leftValue diffuserValue backlightValue culturelightValue ambientlightValue time";
							break;
						}
					}

					var lightObjEnd = {
						topValue:           0,
						rightValue:         0,
						bottomValue:        0,
						leftValue:          0,
						diffuserValue:      0,
						backlightValue:     0,
						culturelightValue:  0,
						ambientlightValue:  0,
						time:               highestTime+5
					};

					// Push zero object at end of event queue as well.
					fileData.eventsToRun.push(lightObjEnd);

					if (errDataCheck === null) {
						fileData.eventsToRun.sort(function (a, b) {
							return a.time - b.time;
						});

						fileData.metaData.runTime = fileData.eventsToRun[fileData.eventsToRun.length - 1].time - fileData.eventsToRun[0].time;

						if ((fileData.metaData.runTime <= 0) || (fileData.eventsToRun[fileData.eventsToRun.length - 1].time === 0)) {
							tryError = "try JSON LightData Check Err:" + "Zero time length";
						} else {
							if (fileData.eventsToRun.length === 1) {
								var zeroLightDataObj = {
									topValue:          0,
									rightValue:        0,
									bottomValue:       0,
									leftValue:         0,
									diffuserValue:     0,
									backlightValue:    0,
									culturelightValue: 0,
									ambientlightValue: 0,
									time:              0,
								};

								fileData.eventsToRun.push(zeroLightDataObj);
							}

							var timeZero = fileData.eventsToRun[0].time;

							fileData.eventsToRun.forEach(function (dat) {
								dat.time -= timeZero;
							});
						}
					} else {
						tryError = "try JSON LightData Check Err:" + errDataCheck;
					}
				}
			} else {
				tryError = "try JSON Parse Err:" + "eventsToRun not an object";
			}
		} else {
			tryError = "try JSON Parse Err:" + "jsonData not an object";
		}
	} catch (err) {
		catchError = "catch JSON Parse Err:" + err;
	} finally {
		if (tryError) {
			cb_fn(tryError, null);
		} else if (catchError) {
			cb_fn(catchError, null);
		} else {
			cb_fn(null, fileData);
		}
	}
};
var _tryColumn = function (data, cb_fn) {
	var jsonData = {
		metaData:    {},
		eventsToRun: []
	};

	var catchErr = null;

	try {
		var header = {};

		data.split('\n').forEach(function (line) {

			var colonIndex = line.search(':');
			if (colonIndex > -1) {
				var key                = line.substr(0, colonIndex);
				var value              = line.substr(colonIndex + 1, line.length);
				jsonData.metaData[key] = value;

			} else {

				var parts = line.replace(/(\r\n|\n|\r)/gm, "").split(',');

				var doKeep = true;

				if (parts.length >= 2) {

					var check = parts.join('').replace(/\s/g, '');

					if (check == '') {
						doKeep = false;
					} else {
						parts.forEach(function (part) {
							if (part == null) {
								doKeep = false;
							}
						});
					}
				} else {
					doKeep = false;
				}

				var cols = ["time", "topValue", "rightValue", "bottomValue", "leftValue", "diffuserValue", "culturelightValue", "ambientlightValue", "backlightValue"];

				if (doKeep) {

					var check = parts.join('').replace(/\s/g, '');

					if (check.indexOf('time') > -1) {
						parts.forEach(function (part) {
							if (cols.indexOf(part) > -1) {
								header[part] = cols.indexOf(part);
							}
						});
					} else {
						if (JSON.stringify(header) !== '{}') {
							jsonData.eventsToRun.push({
								time:              Number(parts[header['time']]),
								topValue:          Number(parts[header['topValue']] || 0),
								rightValue:        Number(parts[header['rightValue']] || 0),
								bottomValue:       Number(parts[header['bottomValue']] || 0),
								leftValue:         Number(parts[header['leftValue']] || 0),
								diffuserValue:     Number(parts[header['diffuserValue']] || 0),
								backlightValue:    Number(parts[header['backlightValue']] || 0),
								culturelightValue: Number(parts[header['culturelightValue']] || 0),
								ambientlightValue: Number(parts[header['ambientlightValue']] || 0),
							});

							// console.log({
							//   time: Number(parts[header['time']]),
							//   topValue: Number(parts[header['topValue']] || 0),
							//   rightValue: Number(parts[header['rightValue']] || 0),
							//   bottomValue: Number(parts[header['bottomValue']] || 0),
							//   leftValue: Number(parts[header['leftValue']] || 0),
							//   diffuserValue: Number(parts[header['diffuserValue']] || 0),
							//   backlightValue: Number(parts[header['backlightValue']] || 0),
							//   culturelightValue: Number(parts[header['culturelightValue']] || 0),
							//   ambientlightValue: Number(parts[header['ambientlightValue']] || 0),
							// });
						}
					}
				}
			}
		});
	} catch (err) {
		catchErr = err;
	} finally {
		if (catchErr) {
			cb_fn(catchErr, {});
		} else {
			if (jsonData.eventsToRun.length > 0) {
				_tryJson(JSON.stringify(jsonData), 1, cb_fn);
			} else {
				cb_fn("No events to run", {});
			}
		}
	}
};