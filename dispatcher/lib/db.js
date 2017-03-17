import mongoose from 'mongoose';
import {logger} from './logging'

class Database {
    constructor(config) {
        this.config = config;
    }

    get(key) {
        return this.config[key];
    }

    connect(callback) {
        this.db = mongoose.createConnection(this.config.dbUrl);
        this.db.on('error', (err) => {
            if (err) {
                logger.error(err);
                return callback(err);
            }
        });

        this.db.once('open', () => {
            require('./models')(this, mongoose);
            return callback(null);
        });
    }

    getExperimentQueues(callback) {
        this.db.models.ListExperiment.getInstanceDocument((err, queues) => {
            if (err) {
                return callback(err);
            } else {
                return callback(null, queues);
            }
        });
    }

    getNewExperiments(callback) {
        // logger.info('getting new experiments... ');

        this.db.models.ListExperiment.getNewExperiments((err, queues) => {
            if (err) {
                return callback(err);
            }

            // logger.info(queues.newExps);
            return callback(null, queues);
        });
    }

    getBpus(callback) {
        let filters = {
            isOn: true,
        };

        let fields = 'isOn bpuStatus index name magnification allowedGroups localAddr publicAddr bpu_processingTime session liveBpuExperiment performanceScores';

        let query = this.db.models.Bpu
            .find(filters)
            .select(fields);
        query.exec(function (err, docs) {
            if (err) {
                return callback(err);
            }

            return callback(null, docs);

        });
    }

    getBPUExperiment(id, callback) {
        this.db.models.BpuExperiment.findById(id, (err, instance) => {
            if (err) {
                return callback(err);
            } else {
                return callback(null, instance);
            }
        });
    }

    getRawBPUExperiment(){
      return this.db.models.BpuExperiment();
    }

    validateBPUExperiment(experiment){
      return this.db.models.BpuExperiment.validate(experiment);
    }

    addBPUExperimentToQueue(tag, callback){
      return this.db.models.ListExperiment.addNewExpTagToList(tag, callback);
    }

    updateBPUExperiment(id, updates, callback) {
        this.db.models.BpuExperiment.findByIdAndUpdate(id, updates, (err, saved) => {
            if (err) {
                return callback(err);
            } else {
                return callback(null, saved);
            }
        });
    }

    getSession(id, callback){
      this.db.models.Session.findOne({sessionID: id}, {}, callback);
    }

  saveSession(sessionID,username, groups, callback){
    let session = this.db.models.Session();
    session.sessionID = sessionID;

    session.user.name = username;
    session.user.groups = groups;

    return session.save(callback);
  }

    submitProfilingExperiment(bpu, filters, updates, callback) {

        //todo
        // this.db.models.Bpu.submitTextExpWithUser(filters, updates, (err, tag) => {
        //     if (err) {
        //         return callback(err);
        //     }
        //
        //     bpu.doc.performanceScores.bc_lastSendDate = startDate.getTime();
        //     bpu.doc.save(function (err, newDoc) {
        //         if (err) {
        //             return callback(err);
        //         }
        //         return callback(null, newDoc);
        //     });
        // });

        return callback(null);
    }

    getExperimentJoinQueueDefaults(config){
      var joinQueueData={
        user:{
          id:null,
          name:null,
          groups:null,
        },
        session:{
          id:null,
          sessionID:null,
          socketID:null,
        },
        group_experimentType:null,
        exp_wantsBpuName:null,

        exp_eventsToRun:[],
        exp_metaData:{},

        liveUserLabTime:config.experimentSessionMaxTime,
        zeroLedEvent:{time:0, topValue:0, rightValue:0, bottomValue:0, leftValue:0}
      };
      return joinQueueData;
    }

}

export {Database};
