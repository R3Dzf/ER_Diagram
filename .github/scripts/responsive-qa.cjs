const { chromium } = require('/tmp/bosha-browser-qa/node_modules/playwright');
const { mkdirSync } = require('node:fs');
const assert = require('node:assert/strict');
const base = 'https://er-diagram.r3dzf-studio.workers.dev/studio/';
const sizes = [
  {name:'phone-small', width:320, height:700},
  {name:'phone', width:390, height:844},
  {name:'tablet', width:768, height:1024},
  {name:'desktop', width:1440, height:900},
];
(async()=>{
  mkdirSync('qa-artifacts',{recursive:true});
  const browser=await chromium.launch({headless:true});
  const failures=[];
  for(const device of sizes){
    const context=await browser.newContext({viewport:{width:device.width,height:device.height},deviceScaleFactor:1,hasTouch:device.width<=768,isMobile:device.width<=390});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    try {
      const response=await page.goto(base,{waitUntil:'domcontentloaded',timeout:40000});
      assert.equal(response?.status(),200,'Editor HTML was not available');
      await page.locator('#accountLoading').waitFor({state:'hidden',timeout:20000});
      if(await page.locator('#headerGoogleSignIn').isVisible()){
        await page.locator('#headerGoogleSignIn').waitFor({state:'visible'});
      }
      await page.screenshot({path:`qa-artifacts/${device.name}-dashboard.png`,fullPage:true});
      const create=page.locator('#welcomeCreate');
      if(await create.isVisible()) await create.click();
      else if(await page.locator('#newCard').isVisible())await page.locator('#newCard').click();
      else if(await page.locator('#headerNewBtn').isVisible())await page.locator('#headerNewBtn').click();
      await page.locator('#editor').waitFor({state:'visible',timeout:10000});
      const chen=page.locator('[data-notation="chen"]');
      const crow=page.locator('[data-notation="crowfoot"]');
      assert.equal(await chen.getAttribute('aria-pressed'),'true','Chen must be initially active');
      await crow.click();
      assert.equal(await crow.getAttribute('aria-pressed'),'true','Crow foot switch must activate');
      await chen.click();
      assert.equal(await chen.getAttribute('aria-pressed'),'true','Chen switch must activate');
      if(device.width<=760){
        const more=page.locator('#mobileMoreBtn');
        assert.equal(await more.isVisible(),true,'Mobile more-actions button missing');
        await more.click();
        assert.equal(await page.locator('#mobileMoreMenu').isVisible(),true,'Mobile more-actions menu hidden');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#mobileMoreMenu').isVisible(),false,'Escape did not close mobile menu');
      }
      await page.screenshot({path:`qa-artifacts/${device.name}-editor.png`,fullPage:true});
      const info=await page.evaluate(()=>({
        documentWidth:document.documentElement.scrollWidth,
        viewport:window.innerWidth,
        notation:document.querySelector('.notation-strip')?.getBoundingClientRect().toJSON(),
        signIn:document.querySelector('#headerGoogleSignIn')?.getBoundingClientRect().toJSON(),
        bodyWidth:document.body.scrollWidth
      }));
      if(info.documentWidth>device.width+3 || info.bodyWidth>device.width+3)throw Error('Horizontal page overflow: '+JSON.stringify(info));
      if(errors.length)throw Error('Unexpected runtime errors: '+errors.join(' | '));
      console.log(device.name+' PASS at '+device.width+'x'+device.height);
    } catch (error) {
      failures.push(device.name+': '+error.message);
      console.error(device.name+' FAIL: '+error.stack);
      try{await page.screenshot({path:`qa-artifacts/${device.name}-failure.png`,fullPage:true})}catch{}
    }finally{await context.close();}
  }
  await browser.close();
  if(failures.length){console.error(failures.join('\n'));process.exitCode=1;}
})().catch(error=>{console.error(error);process.exitCode=1;});
