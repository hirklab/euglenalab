/**
 * Created by shirish.goyal on 2/23/17.
 */

// var app={
//     runParams:{
//         mongooseObjID:mongoose.Types.ObjectId,
//         doClearConsole:false,
//
//         runCounter:0,
//         SocketTimeoutTillReset:30,

//         //doPrintMemHeader:true,
//         doPrintMemHeader:true,
//         doPrintExpErrors:true,
//         doPrintCheckBpusErrors:true,
//         doPrintLiveActivateErrors:true,

//         errorRemoveMs:60000,
//         maxErrorPrint:5,
//         runLoopInterval:1000,
//         liveUserConfirmTimeout:15000,

//         lastScripterSendDate:new Date(),

//         ScripterSendInterval: 30*60*1000,
//         nextToSendBpuName:null,
//     },
//     runData:{
//         firstMemObj:null,
//         currMemObj:null,
//         addExpToBpuErrors:[],
//         activateLiveUserErrors:[],
//         checkBpusErrors:[],
//         runningQueueTimesPerBpuName:{},
//     },
//
//     //Files
//     funcs:require('../shared/myFunctions.js'),
//     //Socket Functions
//     submitExperimentRequestHandler:require('./contScripts/submitExperimentRequestHandler.js'),
//
//     //Sub Objects
//     bpuObjects:{},
//     socketConnections:[],
//
//     listExperimentDoc:null,
//     newExpTagObj:{},
//     keeperExpDocs:[],
//
//     bpuLedsSetFuncs:{},
//     bpuLedsSetMatch:{},
//};