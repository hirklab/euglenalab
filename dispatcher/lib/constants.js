/**
 * Created by shirish.goyal on 2/28/17.
 */

let EXPERIMENT_STATUS = {
  CREATED: 'created',
  SUBMITTED: 'submited',
  QUEUED: 'queued',
  SERVING: 'addingtobpu',
  FINISHED: 'servercleared',
};

let BPU_STATUS = {
  INITIALIZING: 'initializing',
  IN_QUEUE: 'pendingRun',
  IN_PROGRESS: 'running',
  PROCESSING: 'finalizing',
  PROCESSING_OVER: 'finalizingDone',
  READY: 'resetingDone',
  OFFLINE: 'offline'
};

let BPU_STATUS_DISPLAY = {
  'initializing': 'initializing',
  'pendingRun': 'in queue',
  'running': 'running',
  'finalizing': 'processing',
  'finalizingDone': 'processing over',
  'resetingDone': 'ready',
  'offline': 'offline'
};

let PROFILERS = {
  POPULATION: 'scripterPopulation',
  ACTIVITY: 'scripterActivity',
  RESPONSE: 'scripterResponse'
};

let GROUPS = {
  PROFILER: 'scripter'
};

let ROUTES = {
  WEBSERVER: {
    CONNECT: 'connection',
    AUTHORIZE: 'setConnection',
    GET_QUEUE: 'getJoinQueueDataObj',
    GET_EXPERIMENT: 'getExp',
    SET_LEDS: '/bpu/runExp/#ledsSet',
    SUBMIT_EXPERIMENT: '/bpuCont/#submitExperimentRequest',
    GET_STATUS: 'update',
    DISCONNECT: 'disconnect'
  },
  DISPATCHER: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    SUBMIT_EXPERIMENT: '/bpuCont/#submitExperimentRequest',
  },
  BPU: {
    PING: '/bpu/#ping',
    ADD_EXPERIMENT: '/bpu/#setExp',
    RUN_EXPERIMENT: '/bpu/#runExp',
    SET_LEDS: '/bpu/runExp/#ledsSet',
    GET_STATUS: '/bpu/#getStatus',
    RESET: '/bpu/#resetBpu',
  }
};

export {
  EXPERIMENT_STATUS,
  PROFILERS,
  GROUPS,
  BPU_STATUS,
  BPU_STATUS_DISPLAY,
  ROUTES
};
