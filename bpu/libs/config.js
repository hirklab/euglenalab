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

	//Init Info
	mainDataDir:    home_dir + '/bpuData',
	expDataDir:     home_dir + '/bpuData/tempExpData',
	mountedDataDir: (isFake ? home_dir + '/bpuEuglenaData/eug100' : '/mnt/bpuEuglenaData/' + os.hostname())
};