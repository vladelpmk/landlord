import  cron  from "node-cron";
import { lunchConnectToBrowser, getOrAddPageByDomain } from "../controler/chrome.js";
import { startAutoRefresh } from "../controler/page.js";
import { debug } from "../lib/utils.js";
import puppeteer from "puppeteer";
import { addOrUpdateRow } from "./spreadsheets.js";

const domain = "https://www.evnonline.mk/";
let page: puppeteer.Page;

const getData = async () => {
  debug("Get EVN data START");

  const tableArray = await page.$eval("table.table-bordered tbody", (tbody) => {
    const trs = Array.from(tbody.querySelectorAll("tr"));
    return trs.map((tr) => {
      let tds = Array.from(tr.querySelectorAll("td"));
      return tds.map((td) => td.innerText);
    });
  });

  let result = []

  for (let i = 0; i < tableArray.length; i++) {
    result.push({
      amount: parseFloat(tableArray[i][5].replace(".", "").replace(",", ".")),
      month: parseInt(tableArray[i][3].split("-")[1]).toString(),
      year: parseInt(tableArray[i][3].split("-")[2]).toString(),
      paid: tableArray[i][7] === "Платена",
    });
  }

  for (let i = 0; i < result.length; i++) {
    await addOrUpdateRow(result[i], "EVN");
  }

  debug("Get EVN data END");
};

var task = cron.schedule(
  "0 0 * * *",
  () => {
    debug("Run chon")
    getData()
  },
  {
    scheduled: false,
  },
);

export const run = async () => {
  try {
    const browser = await lunchConnectToBrowser();
    page = await getOrAddPageByDomain(domain, browser);
    startAutoRefresh(page);
    task.start();
  } catch (e) {
    console.error(e);
  }
};