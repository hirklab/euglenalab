import * as mainConfig from './../../../shared/mainConfig.js';

const logLevel = 'DEBUG';
const name = 'dispatcher';
const ip = 'localhost';
const port = mainConfig.adminFlags.getControllerPort();
const dbUrl = mainConfig.adminFlags.getMongoUri();
const confirmTimeout = 100;
const loopTimeout = 1000;
const socketTimeout = 30;
const userConfirmationTimeout = 15000;
const experimentSessionMaxTime = 60 * 1000;
const profiling = false;
const profilingInterval = 30 * 60 * 1000;

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

const config = {
  name: name,
  ip: ip,
  port: port,
  logLevel: logLevel,
  dbUrl: dbUrl,
  profiling: profiling,
  profilingInterval: profilingInterval,
  confirmTimeout: confirmTimeout,
  userConfirmationTimeout: userConfirmationTimeout,
  experimentSessionMaxTime: experimentSessionMaxTime,
  loopTimeout: loopTimeout,
  socketTimeout: socketTimeout,
  authenticClients: authenticClients
};

export default config;
