const puppeteer = require("puppeteer");
const url = "https://pixai.art/login";
// 因為 window 的 USERNAME 撞名
const username = process.env.LOGINNAME ? process.env.LOGINNAME : undefined;
const password = process.env.PASSWORD ? process.env.PASSWORD : undefined;
// 如果需要在本地運行，請將這裡改成 false
const isDocker = true;
// 如果需要背景執行，請將 headless 設置為 true
const headless = true;
// 重試次數上限
const tryCountMax = 3;
// 重試次數
let tryCount = 0;

function delay(time) {
	return new Promise(function (resolve) {
		setTimeout(resolve, time);
	});
}

async function loginAndScrape(url, username, password, isDocker, headless) {
	console.log("帳號：", username);
	if (username == undefined || password == undefined) {
		throw new Error("請在環境變數設置帳號密碼");
	}

	let config = {
		headless: headless,
	};

	if (isDocker) {
		config = {
			...config,
			executablePath: "/usr/bin/google-chrome",
			args: [
				"--disable-gpu",
				"--disable-setuid-sandbox",
				"--no-sandbox",
				"--no-zygote",
			],
		};
	}

	// 使用 Puppeteer 進行模擬瀏覽器操作
	const browser = await puppeteer.launch(config); //

	const page = await browser.newPage();

	try {
		await page.goto(url);
	} catch (error) {
		console.error("訪問 URL 失敗:", error);
		tryCount++;
		if (tryCount <= tryCountMax) {
			return await loginAndScrape(url, username, password, isDocker, headless);
		} else {
			throw new Error("重試訪問 URL 失敗");
		}
	}

	// 點擊取消初始畫面
	try {
		// 1.1.1 舊版畫面
		// await page.waitForSelector('div[id="root"] > div > div > button');
		// await page.click('div[id="root"] > div > div > button');
		await page.waitForSelector(
			'div[id="root"] > div > div > div > div > div form > div > div button:last-of-type'
		);
		await page.click(
			'div[id="root"] > div > div > div > div > div form > div > div button:last-of-type'
		);
	} catch (error) {
		console.error("點擊取消初始畫面失敗:", error);
		tryCount++;
		if (tryCount <= tryCountMax) {
			return await loginAndScrape(url, username, password, isDocker, headless);
		} else {
			throw new Error("重試點擊取消初始畫面失敗");
		}
	}

	try {
		console.log("登入");
		await login(page, username, password);
	} catch (error) {
		console.error("登入失敗:", error);
		tryCount++;
		if (tryCount <= tryCountMax) {
			return await loginAndScrape(url, username, password, isDocker, headless);
		} else {
			throw new Error("重試登入失敗");
		}
	}

	try {
		console.log("展開使用者列表");
		await selectProfileButton(page);
	} catch (error) {
		console.error("展開使用者列表失敗:", error);
		tryCount++;
		if (tryCount <= tryCountMax) {
			return await loginAndScrape(url, username, password, isDocker, headless);
		} else {
			throw new Error("重試展開使用者列表失敗");
		}
	}

	try {
		console.log("點擊檔案列表");
		await clickProfile(page);
	} catch (error) {
		console.error("點擊檔案列表失敗:", error);
		tryCount++;
		if (tryCount <= tryCountMax) {
			return await loginAndScrape(url, username, password, isDocker, headless);
		} else {
			throw new Error("重試點擊檔案列表失敗");
		}
	}

	try {
		console.log("領取每日獎勵");
		await claimCredit(page);
	} catch (error) {
		console.error("領取每日獎勵失敗:", error);
		tryCount++;
		if (tryCount <= tryCountMax) {
			return await loginAndScrape(url, username, password, isDocker, headless);
		} else {
			throw new Error("重試領取每日獎勵失敗");
		}
	}

	// 爬取完成後，關閉瀏覽器
	await browser.close();
}

//#region 登入
async function login(page, username, password) {
	await page.type("#email-input", username);
	await page.type("#password-input", password);
	await delay(300);
	await page.waitForSelector('button[type="submit"]');
	await page.click('button[type="submit"]');
	await delay(3000);
	try {
		await page.$eval('button[type="submit"]', (button) => button.click());
	} catch {}
}

//#endregion

//#region 點擊彈窗
async function checkPopup(page) {
	try {
		// check for popup
		await page.click('//*[@id="app"]/body/div[4]/div[3]/div/div[2]/div/button');
		return true;
	} catch {
		try {
			// check for popup for browser is fullscreen
			await page.click('//*[@id="app"]/body/div[2]/div[3]/div/div/button');
			return true;
		} catch {
			return false;
		}
	}
}
//#endregion

//#region 點擊頁首圖標
async function selectProfileButton(page) {
	while (true) {
		try {
			// 確認是否已登入
			console.log("確認是否已登入");
			try {
				await page.click('button[type="submit"]');
			} catch {}
			let headerText = await page.$eval(
				"header > div:nth-of-type(2)",
				(el) => el.innerText
			);
			// 適配 UI 版本
			if (headerText == null)
				headerText = await page.$eval(
					"header > div:nth-of-type(1)",
					(el) => el.innerText
				);
			if (
				!headerText ||
				headerText.includes("Sign Up") ||
				headerText.includes("Log in")
			) {
				console.log("未登入");
				continue;
			} else {
				console.log("已登入");
				throw new Error();
			}
		} catch {
			await delay(300);
			const isPopupClosed = await checkPopup(page);
			try {
				// 檢查個人資料頭像並點擊
				console.log("點擊圖片頭像");
				await page.$eval("header > img", (el) => el.click());
				console.log("成功");
				await delay(300);
				break;
			} catch {
				try {
					// 如果沒有頭像的話會是div
					console.log("點擊文字頭像");
					await page.$eval("header > div", (el) => el.click());
					console.log("成功");
					await delay(300);
					break;
				} catch (err) {
					try {
						// 檢查密碼錯誤
						await page.$eval(
							'svg[data-testid="ReportProblemOutlinedIcon"]',
							(el) => el
						);
						throw new Error(username, "登入失敗！");
					} catch {
						if (!isPopupClosed) {
							await checkPopup(page);
						}
					}
				}
			}
		}
		await delay(49);
	}
}
//#endregion

//#region 點擊個人檔案

async function clickProfile(page) {
	await page.waitForSelector(
		"ul[role='menu'] > li[role='menuitem']:nth-of-type(1)"
	);
	while (true) {
		try {
			// 在下拉式選單中找到並點擊個人資料按鈕
			await page.click("ul[role='menu'] > li[role='menuitem']:nth-of-type(1)");
			await delay(300);
			break;
		} catch {
			// 如果有頭像會是img
			try {
				await page.click("header > img");
				await delay(300);
				continue;
			} catch {
				if (!(await checkPopup(page))) {
					await page.click("header > div");
					await delay(300);
					continue;
				} else {
					await delay(300);
					continue;
				}
			}
		}
	}
}

//#endregion

//#region 點擊每日獎勵
async function claimCredit(page) {
	await page.waitForSelector(
		"section > div > div:nth-of-type(2) > div:nth-of-type(2) > button"
	);
	let isClaimed = false;
	checkIsClaimed: while (true) {
		try {
			if (isClaimed) {
				break;
			}
			while (true) {
				// 領取！
				await page.click(
					"section > div > div:nth-of-type(2) > div:nth-of-type(2) > button"
				);
				await delay(300);
				await page.reload();
				await delay(5000);
				const updatedClaimBtnText = await page.$eval(
					"section > div > div:nth-of-type(2) > div:nth-of-type(2) > button > span",
					(el) => el.innerText
				);

				await delay(300);

				// 確認是不是 "Claimed"
				if (
					updatedClaimBtnText.toLowerCase() === "claimed" ||
					updatedClaimBtnText.toLowerCase() === "已認領" ||
					updatedClaimBtnText.toLowerCase() === "已认领" ||
					updatedClaimBtnText.toLowerCase() === "申請済み"
				) {
					console.log("領取成功");
					isClaimed = true;
					continue checkIsClaimed;
				}
			}
		} catch {
			if (!(await checkPopup(page))) {
				await delay(500);
				if (!isClaimed) {
					continue checkIsClaimed;
				} else {
					console.log("已領取獎勵");
					break;
				}
			}
			continue checkIsClaimed;
		}
	}
}
//#endregion

loginAndScrape(url, username, password, isDocker, headless)
	.then(() => {
		console.log("領取完畢");
		process.exit(0);
	})
	.catch((error) => console.error("異常：", error));
