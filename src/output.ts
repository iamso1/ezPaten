import * as fs from 'fs';

export default class OutPut {
    constructor() { }

    //直接印結果
    public static async writeToCSV(arr_result: string[]): Promise<void>;
    //每個結果再加入另一個值
    public static async writeToCSV(arr_result: string[], ...arr_src: string[]): Promise<void>;
    public static async writeToCSV(arr_result: string[], ...arr_src: string[]) {
        await checkFile('./result/result.csv');
        const arr_extraInfo = Array.from(arr_src);
        const writer = fs.createWriteStream('./result/result.csv', {
            flags: 'a', // 'a' means appending (old data will be preserved)
            encoding: 'utf8'
        });

        if (arr_src) {
            arr_result.forEach((elm, index) => {
                const extraInfo = getExtraInfo(index);
                writer.write('\ufeff' + elm + ',' + extraInfo + '\r');
            });
        } else {
            arr_result.forEach((elm) => {
                writer.write('\ufeff' + elm + '\r');
            });
        }

        function getExtraInfo(index: number) {
            return arr_extraInfo.map((extraInfoArr: string[]) => {
                return extraInfoArr[index];
            }).join(',');
        }

    }
}

//if file exist then remove the file
function checkFile(filePath: string) {
    return new Promise((resolve, reject) => {
        fs.exists(filePath, (exists) => {
            if (exists) {
                fs.unlink(filePath, () => {
                    resolve('')
                });
            } else {
                resolve('');
            }

        });
    });
}
