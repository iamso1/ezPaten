import PatentCore from './patent-core';

(async () => {
  //create a patentCore instance 
  const patentCore = await PatentCore.create();

  //get IPCNums by PublicNums
  const arr_ipcNums = await patentCore.getIPCNumByPublicNum();

  //get IPCNames by IPCNums
  const arr_ipcNames = await patentCore.getIPCNameByIPCNum(arr_ipcNums);
  console.log(arr_ipcNames);

})();

