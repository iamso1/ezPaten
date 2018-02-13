import { publicNums } from './info';
const puppeteer = require('puppeteer');

export default class PatentCore {
    browser: any;
    page: any;

    constructor() {

    }

    public static async create() {
        return new PatentCore().init();
    }

    //初始化網頁
    protected async init() {
        this.browser = await puppeteer.launch({
            headless: false,
        });
        this.page = await this.browser.newPage();
        return this;
    }

    //取得IPC號碼清單
    public async getIPCNumByPublicNum() {
        // //根據info的專利公開號清單 把所有的專利分類號都查到
        const arr_ipc_default: string[] = [];//預設值
        const arr_ipc = await publicNums.reduce(async (pre: Promise<string[]>, current_publicNum: string) => {
            //用專利公開號碼查專利分類號    
            const currentArr = await pre; //確實等到有資料才會往下 所以這裡可以卡住流程
            currentArr.push(...await this.getIPCNums(this.page, current_publicNum));
            return currentArr;
        }, Promise.resolve(arr_ipc_default)); //Question: 這裡可以怎樣不要多帶一個default的變數
        return arr_ipc;
    }


    //根據專利分類號清單, 查詢所有專利類別名稱
    public async getIPCNameByIPCNum(arr_ipc: string[]) {
        const arr_ipcName_default: string[] = [];//預設值
        const arr_ipcName = await arr_ipc.reduce(async (pre: Promise<string[]>, current_ipcNum: string) => {
            const currentArr = await pre; //確實等到有資料才會往下 所以這裡可以卡住流程
            currentArr.push(await this.getIPCName(this.page, current_ipcNum));
            return currentArr;
        }, Promise.resolve(arr_ipcName_default));
        return arr_ipcName;
    }

    //用專利公開號碼查專利分類號
    private async getIPCNums(page: any, publicNum: string) {
        await page.goto('http://twpat1.tipo.gov.tw/tipotwoc/tipotwkm');

        await page.waitForFunction(() => {
            return (Array.from(document.querySelectorAll('a')).filter(e => e.innerHTML == '簡易檢索').length > 0);
        });

        await page.evaluate(() => {
            (<HTMLElement>Array.from(document.querySelectorAll('.topmenu a'))[2]).click();
        });

        //等到這頁正確load完
        await page.waitForSelector('[name="_1_0_n_2"]');

        //輸入公開索引號
        await page.evaluate((publicNum: string) => {
            const inputFiled = document.querySelector('[name="_1_0_n_2"]');
            if (inputFiled) {
                (<HTMLInputElement>inputFiled).value = ''; //先清掉 再重新給一次避免有重複的
                (<HTMLInputElement>inputFiled).value = publicNum;
            }
            const sendBtn = document.querySelector('[name="_IMG_檢索@s"');
            if (sendBtn)
                (<HTMLButtonElement>sendBtn).click();
        }, publicNum);

        //等到查到資料
        await page.waitForSelector('.rectr');
        //取得專利號碼
        let arr_ipc: Array<string> = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('b')).map(node => node.innerText.substring(0, 4));
        });

        //過濾重複的
        arr_ipc = [...new Set(arr_ipc)];
        return arr_ipc;
    }

    //用專利分類號查專利類別名稱
    private async  getIPCName(page: any, ipcNum: string) {
        await page.goto('https://www.tipo.gov.tw/sp.asp?xdurl=mp/lpipcFull.asp&ctNode=7231&mp=1');

        //等到真的出現 輸入專利分類號
        await page.waitForSelector('#symbol');
        await page.type('#symbol', ipcNum);

        //按下送出查詢
        const inputElement = await page.$('[name="send"');
        await inputElement.click();

        await page.waitForFunction((ipcNum: string) => {
            return (Array.from(document.querySelectorAll('#ipcTable tr')).filter(e => (<HTMLElement>e).innerText.includes(ipcNum)).length > 0);
        }, {}, ipcNum);

        const result = await page.evaluate((ipcNum: string) => {
            const firstResult = Array.from(document.querySelectorAll('#ipcTable tr')).filter(e => (<HTMLElement>e).innerText.includes(ipcNum))[0];
            const lastChild = <HTMLElement>(<HTMLElement>firstResult).lastElementChild;
            if (lastChild)
                return lastChild.innerText;
        }, ipcNum);

        return `${ipcNum},${result}`;
    }


}