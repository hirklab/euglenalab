import * as mainConfig from './../../../shared/mainConfig.js';

const logLevel = 'DEBUG';
const name = 'controller';
const ip = '0.0.0.0';
const port = mainConfig.adminFlags.getControllerPort();
const dbUrl = mainConfig.adminFlags.getMongoUri();
const confirmTimeout = 100;
const loopTimeout = 1000;
const socketTimeout = 30;
const userConfirmationTimeout = 15000;
const profiling = true;
const profilingInterval = 30*60*1000;

const authenticClients = {
    C422691AA38F9A86EC02CB7B55D5F542: {
        Name: 'radiantllama',
        arePassKeysOpen: false,
        PassKeys: ['i4bP9hXwNA3WuH0p6m0TCUIA9Wtz0Ydu']
    },
    b3cagcde2684ebd2cba325555ec2703b: {
        Name: 'InternalWeb1',
        arePassKeysOpen: true,
        PassKeys: []
    },
    b3cagcde2684ebd2cba325555ec2703c: {
        Name: 'InternalWeb2',
        arePassKeysOpen: true,
        PassKeys: []
    }
};

const socketRoutes = {
    bpu: {
        ping:'/bpu/#ping',
        addExperiment: '/bpu/#setExp',
        runExperiment: '/bpu/#runExp',
        setLEDs: '/bpu/runExp/#ledsSet',
        getStatus: '/bpu/#getStatus',
        reset:'/bpu/#resetBpu',
    }
};

const config = {
    name: name,
    port: port,
    logLevel: logLevel,
    dbUrl: dbUrl,
    profiling:profiling,
    profilingInterval:profilingInterval,
    confirmTimeout: confirmTimeout,
    userConfirmationTimeout: userConfirmationTimeout,
    loopTimeout: loopTimeout,
    socketTimeout: socketTimeout,
    socketRoutes: socketRoutes,
    authenticClients: authenticClients
};

export {config};
