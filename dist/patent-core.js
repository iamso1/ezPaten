"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const info_1 = require("./info");
const puppeteer = require('puppeteer');
class PatentCore {
    constructor() {
    }
    static create() {
        return __awaiter(this, void 0, void 0, function* () {
            return new PatentCore().init();
        });
    }
    //初始化網頁
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.browser = yield puppeteer.launch({
                headless: false,
            });
            this.page = yield this.browser.newPage();
            return this;
        });
    }
    //取得IPC號碼清單
    getIPCNumByPublicNum() {
        return __awaiter(this, void 0, void 0, function* () {
            // //根據info的專利公開號清單 把所有的專利分類號都查到
            const arr_ipc_default = []; //預設值
            const arr_ipc = yield info_1.publicNums.reduce((pre, current_publicNum) => __awaiter(this, void 0, void 0, function* () {
                //用專利公開號碼查專利分類號    
                const currentArr = yield pre; //確實等到有資料才會往下 所以這裡可以卡住流程
                currentArr.push(...yield this.getIPCNums(this.page, current_publicNum));
                return currentArr;
            }), Promise.resolve(arr_ipc_default)); //Question: 這裡可以怎樣不要多帶一個default的變數
            return arr_ipc;
        });
    }
    //根據專利分類號清單, 查詢所有專利類別名稱
    getIPCNameByIPCNum(arr_ipc) {
        return __awaiter(this, void 0, void 0, function* () {
            const arr_ipcName_default = []; //預設值
            const arr_ipcName = yield arr_ipc.reduce((pre, current_ipcNum) => __awaiter(this, void 0, void 0, function* () {
                const currentArr = yield pre; //確實等到有資料才會往下 所以這裡可以卡住流程
                currentArr.push(yield this.getIPCName(this.page, current_ipcNum));
                return currentArr;
            }), Promise.resolve(arr_ipcName_default));
            return arr_ipcName;
        });
    }
    //用專利公開號碼查專利分類號
    getIPCNums(page, publicNum) {
        return __awaiter(this, void 0, void 0, function* () {
            yield page.goto('http://twpat1.tipo.gov.tw/tipotwoc/tipotwkm');
            yield page.waitForFunction(() => {
                return (Array.from(document.querySelectorAll('a')).filter(e => e.innerHTML == '簡易檢索').length > 0);
            });
            yield page.evaluate(() => {
                Array.from(document.querySelectorAll('.topmenu a'))[2].click();
            });
            //等到這頁正確load完
            yield page.waitForSelector('[name="_1_0_n_2"]');
            //輸入公開索引號
            yield page.evaluate((publicNum) => {
                const inputFiled = document.querySelector('[name="_1_0_n_2"]');
                if (inputFiled) {
                    inputFiled.value = ''; //先清掉 再重新給一次避免有重複的
                    inputFiled.value = publicNum;
                }
                const sendBtn = document.querySelector('[name="_IMG_檢索@s"');
                if (sendBtn)
                    sendBtn.click();
            }, publicNum);
            //等到查到資料
            yield page.waitForSelector('.rectr');
            //取得專利號碼
            let arr_ipc = yield page.evaluate(() => {
                return Array.from(document.querySelectorAll('b')).map(node => node.innerText.substring(0, 4));
            });
            //過濾重複的
            arr_ipc = [...new Set(arr_ipc)];
            return arr_ipc;
        });
    }
    //用專利分類號查專利類別名稱
    getIPCName(page, ipcNum) {
        return __awaiter(this, void 0, void 0, function* () {
            yield page.goto('https://www.tipo.gov.tw/sp.asp?xdurl=mp/lpipcFull.asp&ctNode=7231&mp=1');
            //等到真的出現 輸入專利分類號
            yield page.waitForSelector('#symbol');
            yield page.type('#symbol', ipcNum);
            //按下送出查詢
            const inputElement = yield page.$('[name="send"');
            yield inputElement.click();
            yield page.waitForFunction((ipcNum) => {
                return (Array.from(document.querySelectorAll('#ipcTable tr')).filter(e => e.innerText.includes(ipcNum)).length > 0);
            }, {}, ipcNum);
            const result = yield page.evaluate((ipcNum) => {
                const firstResult = Array.from(document.querySelectorAll('#ipcTable tr')).filter(e => e.innerText.includes(ipcNum))[0];
                const lastChild = firstResult.lastElementChild;
                if (lastChild)
                    return lastChild.innerText;
            }, ipcNum);
            return `${ipcNum},${result}`;
        });
    }
}
exports.default = PatentCore;
