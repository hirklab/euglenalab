/* global app:true */

(function() {
    'use strict';

    app = app || {};

    app.BPUExperiment = Backbone.Model.extend({
        idAttribute: '_id',
        url: function() {
            return '/account/joinlabwithdata/' + this.id + '/';
        },
        downloadTrack: function(trackId) {
            return '/account/joinlabwithdata/details/downloadtrack/' + this.id + '/' + trackId;
        },
    });

    app.Delete = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: {
            success: false,
            errors: [],
            errfor: {}
        },
        url: function() {
            return '/account/joinlabwithdata/' + app.mainView.model.id + '/';
        }
    });

    app.Identity = Backbone.Model.extend({
        idAttribute: '_id',
        defaults: {
            success: false,
            errors: [],
            errfor: {},
            username: '',
            isRunOver: '',
            usergroups: '',
            note: '',
            survey: {
                activity: 0,
                population: 0,
                response: 0,
                rating: 0,
                notes: ""
            }
        },
        url: function() {
            return '/account/joinlabwithdata/' + app.mainView.model.id + '/';
        },
        parse: function(response) {
            if (response.user) {
                app.mainView.model.set(response.user);
                delete response.user;
            }

            return response;
        }
    });

    app.HeaderView = Backbone.View.extend({
        el: '#header',
        template: _.template($('#tmpl-header').html()),
        events: {
            'click .btn-downloadTrack': 'downloadTrack'
        },
        initialize: function() {
            this.model = app.mainView.model;
            this.listenTo(this.model, 'change', this.render);
            this.render();
        },
        downloadTrack: function() {
            var trackId = this.$el.find('[name="trackId"]').val();
            if (trackId.trim().length > 0) {
                window.location = this.model.downloadTrack(trackId);
            }
        },
        render: function() {

            this.$el.html(this.template(this.model.attributes));

        }
    });

    // app.FeedbackView = Backbone.View.extend({
    //     el: '#feedback',
    //     template: _.template($('#tmpl-feedback').html()),
    //     events: {
    //         'click .btn-submit': 'update'
    //     },
    //     initialize: function() {
    //         this.model = app.mainView.model;

    //         this.syncUp();
    //         this.listenTo(app.mainView.model, 'change', this.syncUp);
    //         this.listenTo(this.model, 'sync', this.render);
    //         this.render();
    //     },
    //     syncUp: function() {
    //         this.model.set({
    //             _id: app.mainView.model.id,
    //             survey: app.mainView.model.get('survey')
    //         });
    //     },
    //     render: function() {
    //         console.log(this.model.attributes.survey);

    //         this.$el.html(this.template(this.model.attributes.survey));

    //         for (var key in this.model.attributes.survey) {
    //             if (this.model.attributes.hasOwnProperty(key)) {
    //                 this.$el.find('[name="' + key + '"]').val(this.model.attributes.survey[key]);
    //             }
    //         }

    //         this.$('input.rating').rating({
    //             filled: 'fa fa-star',
    //             filledSelected: 'fa fa-star',
    //             empty: 'fa fa-star-o'
    //         });
    //     },
    //     update: function() {
    //         this.model.save({
    //             survey: {
    //                 rating: this.$el.find('[name="rating"]').val(),
    //                 notes: this.$el.find('[name="notes"]').val(),
    //             }
    //         });
    //     }
    // });

    app.IdentityView = Backbone.View.extend({
        el: '#identity',
        template: _.template($('#tmpl-identity').html()),
        events: {
            'click .btn-update': 'update'
        },
        initialize: function() {
            this.model = new app.Identity();
            this.syncUp();
            this.listenTo(app.mainView.model, 'change', this.syncUp);
            this.listenTo(this.model, 'sync', this.render);
            this.render();
        },
        syncUp: function() {
            this.model.set({
                _id: app.mainView.model.id,
                username: app.mainView.model.get('username'),
                isRunOver: app.mainView.model.get('isRunOver'),
                usergroups: app.mainView.model.get('usergroups'),
                note: app.mainView.model.get('note'),
            });
        },
        render: function() {

            this.$el.html(this.template(this.model.attributes));

            for (var key in this.model.attributes) {
                if (this.model.attributes.hasOwnProperty(key)) {
                    this.$el.find('[name="' + key + '"]').val(this.model.attributes[key]);
                }
            }

        },
        update: function() {
            this.model.save({
                note: this.$el.find('[name="note"]').val(),
            });
        }
    });

    app.DeleteView = Backbone.View.extend({
        el: '#delete',
        template: _.template($('#tmpl-delete').html()),
        events: {
            'click .btn-delete': 'delete',
        },
        initialize: function() {
            this.model = new app.Delete({
                _id: app.mainView.model.id
            });
            this.listenTo(this.model, 'sync', this.render);
            this.render();
        },
        render: function() {
            this.$el.html(this.template(this.model.attributes));
        },
        delete: function() {
            if (confirm('Are you sure?')) {
                this.model.destroy({
                    success: function(model, response) {
                        if (response.success) {
                            location.href = '/account/joinlabwithdata/';
                        } else {
                            app.deleteView.model.set(response);
                        }
                    }
                });
            }
        }
    });

    app.MainView = Backbone.View.extend({
        el: '.page .container',
        initialize: function() {
            app.mainView = this;
            this.model = new app.BPUExperiment(JSON.parse(unescape($('#data-record').html())));
            app.headerView = new app.HeaderView();
            app.identityView = new app.IdentityView();
            app.deleteView = new app.DeleteView();
            // app.feedbackView = new app.FeedbackView();
        }
    });

    $(document).ready(function() {
        app.mainView = new app.MainView();
    });
}());
