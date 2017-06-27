/* global app:true */
(function() {
  'use strict';
  app = app || {};

  app.betterStatus = {
    initializing: 'Initializing...',
    initializingDone: 'Ready',
    initializingFailed: 'Initializing failed',
    pendingRun: 'In queue',
    running: 'Running...',
    runningDone: 'Awaiting processing...',
    runningFailed: 'Running failed',
    finalizing: 'Processing...',
    finalizingDone: 'Processing over',
    finalizingFailed: 'Processing failed',
    reseting: 'Cleaning...',
    resetingDone: 'Ready',
    resetingFailed: 'Cleaning failed',
    offline: 'Offline',
    Unknown: 'Unknown',
  };

  app.BpuImageView = Backbone.View.extend({

    el: '#bpuimage',
    template: _.template($('#tmpl-bpuimage').html()),

    events: {
      'click .btn-joinLiveBpu': 'btnClick_joinLiveBpu',
      'click .btn-joinGameBpu': 'btnClick_joinGameBpu',
      'click .btn-submitTextBpu': 'btnClick_submitTextBpu'
    },
    //Join Button Action
    btnClick_joinLiveBpu: function(evt) {
      console.log('Live Button Pressed!!!!!' + app.gameSession);
      var wantsBpuName = 'eug' + evt.target.value;
      app.mainView.submitExperimentFromViews('live', wantsBpuName, function(err) {
        if (err) {
          console.log('btnClick_joinLiveBpu live submission err:' + err);
        }
      });
    },
    btnClick_joinGameBpu: function(evt) {
      app.gameSession = true;
      console.log('Joining game BPU' + app.gameSession);
      this.btnClick_joinLiveBpu(evt);
    },
    btnClick_submitTextBpu: function(evt) {
      var wantsBpuName = 'eug' + evt.target.value;
      app.mainView.submitExperimentFromViews('text', wantsBpuName, function(err) {
        if (err) {
          console.log('btnClick_joinLiveBpu text submission err:' + err);
        }
      });
    },
    //Join Button Enable/Disable
    disablePrintOn: false,
    disableAll: function(bVal, caller) {
      var me = this;
      if (me.disablePrintOn) console.log('disableAll', bVal, caller);
      app.mainView.bpus.forEach(function(bpu) {
        me.disableLiveButton(bpu.index, bVal, caller + '+' + 'disableAll');
        me.disableTextButton(bpu.index, bVal, caller + '+' + 'disableAll');
      });
    },
    disableLiveButton: function(index, bVal, caller) {
      var me = this;
      if (me.disablePrintOn) console.log('disableLiveButton', index, bVal, caller);
      var btn = me.$el.find('[name="' + 'bpuJoinLiveButton' + index + '"]')[0];
      if (btn) btn.disabled = bVal;
      var btn2 = me.$el.find('[name="' + 'bpuJoinGameButton' + index + '"]')[0];
      if (btn2) btn2.disabled = bVal;
    },
    disableTextButton: function(index, bVal, caller) {
      var me = this;
      if (me.disablePrintOn) console.log('disableTextButton', index, bVal, caller);
      var btn = me.$el.find('[name="' + 'bpuSubmitTextButton' + index + '"]')[0];
      if (btn) btn.disabled = bVal;
    },

    //Labels
    setTitleLabel: function(index, msg) {
      var elem = app.bpuImageView.$el.find('[name="' + 'BpuTitleLabel' + index + '"]')[0];
      if (elem) {
        if (msg.length < 30)
          elem.innerHTML = msg;
        else
          elem.innerHTML = msg.substring(0, 27) + "...";
      }
    },
    setUserLabel: function(index, msg) {
      var elem = app.bpuImageView.$el.find('[name="' + 'BpuUserLabel' + index + '"]')[0];
      if (elem) elem.innerHTML = msg;
    },
    setStatusLabel: function(index, msg) {
      var elem = app.bpuImageView.$el.find('[name="' + 'BpuStatusLabel' + index + '"]')[0];
      if (elem) elem.innerHTML = 'Status: ' + app.betterStatus[msg];
    },


    initialize: function() {
      this.model = new app.Record();
      this.listenTo(this.model, 'change', this.render);
      this.render();
    },
    render: function() {
      var me = this;
      me.$el.html(me.template(me.model.attributes));

      $('input.rating', me.$el).rating({
        filled: 'fa fa-star',
        filledSelected: 'fa fa-star',
        empty: 'fa fa-star-o'
      });
    },
    updateOneBpuUI: function(bpuInfo, expInfo, isJoinLiveDisabled, isTextSubmitDisabled) {
      //Queue Info
      var timeToFinish = app.mainView.roundMsToMins(bpuInfo.timeToFinish);
      var titleLabel = bpuInfo.name;

      if (timeToFinish >= 0) {
        titleLabel += ': Wait time:' + timeToFinish + ' min';
      } else {
        titleLabel += 'Processing...';
      }

      app.bpuImageView.setTitleLabel(bpuInfo.index, titleLabel);
      var statusLabel = 'Status: ' + bpuInfo.bpuStatus;
      app.bpuImageView.setStatusLabel(bpuInfo.index, titleLabel);
      //Live Button
      app.bpuImageView.disableLiveButton(bpuInfo.index, isJoinLiveDisabled);
      //On Bpu
      if (expInfo !== null) {
        var timeLeft = app.mainView.roundMsToSeconds(expInfo.timeLeft);
        var userLabel = expInfo.username;
        if (timeLeft >= 0) {
          userLabel += ' has ' + timeLeft + ' seconds left.';
        } else {
          userLabel += ' taking extra seconds.';
        }
        app.bpuImageView.setUserLabel(bpuInfo.index, userLabel);
      } else {
        app.bpuImageView.setUserLabel(bpuInfo.index, 'No User.');
      }
    },
  });
}());