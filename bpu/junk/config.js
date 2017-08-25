var home_dir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

var config = {
	//Other Constant Scripts/Data
	MainConfig:       require('../shared/mainConfig.js'),
	BpuAutoLightData: require('../shared/autoUserData.json'),
	BpuTestLightData: require('../shared/testLightUserData.json'),
	myFunctions:      require('../shared/myFunctions.js'),

	//Scripts for longer seequences
	script_socketBpu:     require('./socketBpu.js'),
	script_resetBpu:      require('./resetBpu.js'),
	script_runExperiment: require('./runExperiment.js'),
	script_fakeMongo:     require('./fakeMongo.js'),
};