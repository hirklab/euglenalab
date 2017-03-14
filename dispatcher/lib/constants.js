/**
 * Created by shirish.goyal on 2/28/17.
 */

let EXPERIMENT_STATUS = {
    CREATED: 'created',
    SUBMITTED:'submited',
    QUEUED:'queued',
    SERVING:'addingtobpu',
    FINISHED:'servercleared',
};

let BPU_STATUS = {
    READY: 'resetingDone',
    OFFLINE: 'offline'
};

let PROFILERS = {
    POPULATION: 'scripterPopulation',
    ACTIVITY: 'scripterActivity',
    RESPONSE: 'scripterResponse'
};

let GROUPS = {
    PROFILER: 'scripter'
};

export {EXPERIMENT_STATUS, PROFILERS, GROUPS, BPU_STATUS};