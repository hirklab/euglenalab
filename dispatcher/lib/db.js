/**
 * Created by shirish.goyal on 2/26/17.
 */
import mongoose from 'mongoose';

class Database {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }

    get(key) {
        return this.config[key];
    }

    connect(callback) {
        this.db = mongoose.createConnection(this.config.dbUrl);
        this.db.on('error', (err) => {
            if (err) {
                this.logger.error(err);
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
        this.db.models.ListExperiment.getNewExperiments((err, queues) => {
            if (err) {
                return callback(err);
            }

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

    updateBPUExperiment(id, updates, callback) {
        this.db.models.BpuExperiment.findByIdAndUpdate(id, updates, (err, saved) => {
            if (err) {
                return callback(err);
            } else {
                return callback(null, saved);
            }
        });
    }

    submitProfilingExperiment(bpu, filters, updates, callback) {
        this.db.models.Bpu.submitTextExpWithUser(filters, updates, (err, tag) => {
            if (err) {
                return callback(err);
            }

            bpu.doc.performanceScores.bc_lastSendDate = startDate.getTime();
            bpu.doc.save(function (err, newDoc) {
                if (err) {
                    return callback(err);
                }
                return callback(null, newDoc);
            });
        });
    }
}

export {Database};
