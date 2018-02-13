import * as fs from 'fs';

export default class OutPut {
    constructor() { }
    public static async writeToCSV(arr_result: string[]) {
        const test = await checkFile('./result/result.csv');
        const writer = fs.createWriteStream('./result/result.csv', {
            flags: 'a', // 'a' means appending (old data will be preserved)
            encoding: 'utf8'
        });
        arr_result.forEach((elm) => {
            writer.write('\ufeff' + elm + '\r');
        });
    }
}

//if file exist then remove the file
function checkFile(filePath: string) {
    return new Promise((resolve, reject) => {
        fs.exists(filePath, (exists) => {
            if (exists) {
                fs.unlink(filePath, () => {
                    resolve('in1')
                });
            } else {
                resolve('in2');
            }

        });
    });
}
