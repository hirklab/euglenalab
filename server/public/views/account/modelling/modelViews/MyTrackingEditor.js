MyTrackingEditor = function(app) {
  app.EditorView = Backbone.View.extend({
    el: '#trackingeditor',
    template: _.template($('#tmpl-trackingeditor').html()),
    events: {
      'click .btn-editParameter': 'editParametersClick',
      'click .btn-resetParameter': 'resetParametersClick',
    },
    updateView: true,
    doRun: false,
    didResetParametersClick: false,
    didEditParametersClickOn: false,
    didEditParametersClickOff: false,
    didVideoJustEnded: false,
    resetParametersClick: function() {
      //LOG
      app.mainView.isClientActive = true;
      app.mainView.lastClientActivityTime = new Date().getTime();
      app.mainView.lastSaveTime = new Date().getTime();
      var obj = {
        name: 'EditorView:' + app.mainView.serverTab + ':resetParametersClick',
        time: new Date().getTime(),
        didResetParametersClick: this.didResetParametersClick,
        didEditParametersClickOn: this.didEditParametersClickOn,
        didEditParametersClickOff: this.didEditParametersClickOff,
        didVideoJustEnded: this.didVideoJustEnded,
      };

      this.didEditParametersClickOn = false;
      this.didEditParametersClickOff = false;
      this.didResetParametersClick = true;
      this.didVideoJustEnded = false;
      this.render();
    },
    editParametersClick: function() {
      //LOG
      app.mainView.isClientActive = true;
      app.mainView.lastClientActivityTime = new Date().getTime();
      app.mainView.lastSaveTime = new Date().getTime();
      var obj = {
        name: 'EditorView:' + app.mainView.serverTab + ':editParametersClick',
        time: new Date().getTime(),
        didResetParametersClick: this.didResetParametersClick,
        didEditParametersClickOn: this.didEditParametersClickOn,
        didEditParametersClickOff: this.didEditParametersClickOff,
        didVideoJustEnded: this.didVideoJustEnded,
      };

      this.didVideoJustEnded = false;

      this.disableEditor(true);
      if (!this.didEditParametersClickOn) {
        this.didEditParametersClickOn = true;
        this.didEditParametersClickOff = false;
      } else {
        this.didEditParametersClickOn = false;
        this.didEditParametersClickOff = true;
      }
      this.saveParameters();
    },
    videoEnded: function(runData) {
      //LOG
      app.mainView.isClientActive = true;
      app.mainView.lastClientActivityTime = new Date().getTime();
      app.mainView.lastSaveTime = new Date().getTime();
      this.model.attributes.std = runData.standardDev;
      this.didEditParametersClickOn = false;
      this.didEditParametersClickOff = false;
      //this.saveParameters();
      //this.resetParametersClick();
    },
    saveParameters: function() {
      var me = this;
      var setObj = {
        _id: me.model.id
      };
      setObj.actualUser = app.mainView.user.attributes;

      Object.keys(me.model.attributes).forEach(function(name) {
        var textbox = me.$el.find('[name="' + name + '"]')['0'];
        console.log('Setting value of: ' + name);
        if (textbox) {
          if (name === 'std' || name === 'x' || name === 'y' ||
            name === 'length' || name === 'diameter' || name === 'modelCase') {
            setObj[name] = textbox.value;
            console.log('Value: ' + setObj[name]);
          } else {
            setObj[name] = textbox.value;
            console.log('Value: ' + setObj[name]);
          }
        }
      });
      console.log('MyTrackingEditor.js saveParameters', setObj._id, setObj);
      console.log('MyTrackingEditor.js saveParameters', setObj._id);
      console.log('surge', setObj.surgeName[0], setObj.surge[0]);
      console.log('coupling', setObj.couplingName[0], setObj.coupling);
      console.log('roll', setObj.rollName[0], setObj.roll[0]);
      console.log('saveParameters', Object.keys(setObj));
      //console.log('saveParameters', Object.values(setObj));
      me.model.save(setObj);
    },

    disableEditor: function(toggle) {
      var me = this;
      Object.keys(me.model.attributes).forEach(function(name) {
        var textbox = me.$el.find('[name="' + name + '"]')['0'];
        //if(textbox) {textbox.disabled=toggle;}
        var slider = $('#' + name + 'Slider')['0'];
        //DEBUG
        //DEBUG
        //DEBUG
        //slider=null;
        if (slider) {
          if (toggle) {
            $('#' + name + 'Slider').slider('disable');
          } else {
            $('#' + name + 'Slider').slider('enable');
          }
        }
      });
      var button = me.$el.find('[name="' + 'btnEditParameter' + '"]')['0'];
      if (button) {
        button.disabled = toggle;
      }
      //me.toggleSliderForModelCase(Number(me.model.attributes.modelCase))
    },
    toggleSliderForModelCase: function(modelCase) {
      var me = this;
      toggle = true;
      if (modelCase === 3) {
        toggle = false;
      }
      var toggleName = 'roll';
      var textbox = me.$el.find('[name="' + toggleName + '"]')['0'];
      if (textbox) {
        textbox.disabled = toggle;
      }
      var textbox = me.$el.find('[name="' + toggleName + 'Name' + '"]')['0'];
      if (textbox) {
        textbox.disabled = toggle;
      }
      var slider = $('#' + toggleName + 'Slider')['0'];
      //DEBUG
      //DEBUG
      //DEBUG
      //slider=null;
      if (slider) {
        if (toggle) {
          $('#' + toggleName + 'Slider').slider('disable');
        } else {
          $('#' + toggleName + 'Slider').slider('enable');
        }
      }
    },
    initialize: function() {
      this.model = new app.ModelParameters();
      this.syncUp();

      this.listenTo(app.mainView.modelParameters, 'change', this.syncUp);
      this.listenTo(this.model, 'sync', this.render);

      this.render();
    },
    syncUp: function() {
      this.model.set(app.mainView.modelParameters.attributes);
    },
    render: function() {
      this.$el.html(this.template(this.model.attributes));
      var name = null;
      var textbox = null;
      var me = this;

      function handleChange(e, sliderValue) {
        var changeObj = {};
        if (sliderValue != null) {
          changeObj.newValue = sliderValue;
          var textbox = me.$el.find('[name="' + e.target.myId + '"]')['0'];
          if (textbox) {
            textbox.value = sliderValue;
          }
        }
        //Update Model
        me.model.attributes[e.target.myId] = changeObj.newValue;
        // if(changeObj.name==='modelCase') {
        //   var color='#00ff00';
        //   var modelCase=Number(me.model.attributes.modelCase);
        //   if(modelCase===1) {color='#5bc0de';
        //   } else if(modelCase===2) {color='#5cb85c';
        //   } else if(modelCase===3) {color='#f4877d';}
        //   me.el.style.backgroundColor=color;
        //   //me.toggleSliderForModelCase(Number(me.model.attributes.modelCase));
        // }
        //Check Slider/Label
        var slider = $('#' + e.target.myId + 'Slider')['0'];
        //DEBUG
        //DEBUG
        //DEBUG
        //slider=null;
        var label = me.$el.find('[name="' + e.target.myId + 'Label' + '"]')['0'];
        if (slider && label) {
          $("#" + name + "Slider").slider.value = Number(changeObj.newValue);
          var preText = label.textContent.split(':')[0];
          //label.textContent=preText+': '+changeObj.newValue;
        };

        // Zahid Turnign this off for now.
        // if(changeObj.oldValue+''!==changeObj.newValue+'') {
        //   app.mainView.updateFromEditorCallback(
        //       me.model,
        //       me.el.style.backgroundColor,
        //       me.didResetParametersClick,
        //       me.didEditParametersClickOn,
        //       me.didEditParametersClickOff,
        //       me.didVideoJustEnded
        //   );
        // }
      };

      Object.keys(me.model.attributes).forEach(function(name) {
        var textbox = me.$el.find('[name="' + name + '"]')['0'];
        if (textbox) {
          var value;
          if (name === 'couplingName') {
            value = 'Light Sensitivity';
          } else if (name === 'rollName') {
            value = 'Roll [rotation/sec]';
          } else if (name === 'surgeName') {
            value = 'Speed [um/sec]'
          } else {
            value = me.model.attributes[name];
          }
          if ((value !== "undefined") && (value !== null) && (value.constructor === Array)) {
            if (me.model.attributes[name].length > 0) {
              value = me.model.attributes[name][0];
            }
          }

          textbox.myId = name;
          textbox.value = value;
          textbox.onchange = handleChange;
          // //start 20160629 - casey - fix inputs
          // textbox.focusout=function() {
          //   console.log(textbox);
          //   //Clamp and make integer
          //   var newValue = Math.floor(Math.min(Number(textbox.value), Number(textbox.max)));
          //   newValue = Math.floor(Math.max(Number(textbox.min), newValue));
          //   textbox.value=newValue;
          // };
          // //end 20160629 - casey - fix inputs

          //Check Slider/Label
          var slider = $('#' + name + 'Slider')['0'];
          var label = me.$el.find('[name="' + name + 'Label' + '"]')['0'];
          //DEBUG
          //DEBUG
          //DEBUG
          //slider=null;
          if (slider && label) {
            $("#" + name + "Slider").slider({
              value: value,
              min: Number(textbox.min),
              max: Number(textbox.max),
              step: Number(textbox.step),
              slide: function(event, ui) {
                handleChange({
                  target: {
                    myId: name
                  }
                }, ui.value);
              },
              stop: function(event, ui) {
                handleChange({
                  target: {
                    myId: name
                  }
                }, ui.value);
              },
              start: function(event, ui) {}
            });
            var preText = label.textContent.split(':')[0];
            //label.textContent=preText+': '+value;
          }
        };
      });

      //Check Run
      if (me.didEditParametersClickOn) {
        me.disableEditor(true);
      } else {
        me.disableEditor(false);
      }

      //Check For Model Case Update
      var modelCase = me.model.attributes.modelCase;
      // var color = '#00ff00';
      // if (modelCase == 1) {
      //   color = '#5bc0de';
      // } else if (modelCase == 2) {
      //   color = '#5cb85c';
      // } else if (modelCase == 3) {
      //   color = '#f4877d';
      // }
      // me.el.style.backgroundColor = color;
      app.mainView.updateFromEditorCallback(
        me.model,
        me.el.style.backgroundColor,
        me.didResetParametersClick,
        me.didEditParametersClickOn,
        me.didEditParametersClickOff,
        me.didVideoJustEnded
      );
    },
  });
  return new app.EditorView();
}
MyTrackingEditor.prototype = Object.create(Object.prototype);