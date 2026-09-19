'use strict';
// Optional Playwright-backed CDP transport for Node releases whose built-in WebSocket stalls with Chrome.
// The smoke suites retain the dependency-free native WebSocket fallback.
const fs=require('fs');
function webSocketImpl(){
  let chromium;try{({chromium}=require('playwright'));}catch(e){return globalThis.WebSocket;}
  return class PlaywrightCdpSocket{
    constructor(wsUrl){
      this.listeners={message:[]};
      const candidates=[process.env.CHROME,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean),executablePath=candidates.find(file=>fs.existsSync(file));
      chromium.launch({executablePath,headless:true,args:['--disable-gpu','--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required']}).then(async browser=>{
        this.browser=browser;const context=await browser.newContext({viewport:{width:1280,height:760}}),page=await context.newPage();
        this.session=await context.newCDPSession(page);
        for(const method of ['Runtime.exceptionThrown','Runtime.consoleAPICalled','Log.entryAdded'])this.session.on(method,params=>this.emit({method,params}));
        if(this.onopen)this.onopen();
      }).catch(error=>{if(this.onerror)this.onerror(error);});
    }
    addEventListener(type,listener){if(type==='message')this.listeners.message.push(listener);}
    emit(message){const event={data:JSON.stringify(message)};for(const listener of this.listeners.message)listener(event);}
    send(raw){const message=JSON.parse(raw);this.session.send(message.method,message.params||{}).then(result=>this.emit({id:message.id,result})).catch(error=>this.emit({id:message.id,error:{message:error.message}}));}
    close(){Promise.resolve(this.session&&this.session.detach()).catch(()=>{}).finally(()=>{if(this.browser)this.browser.close().catch(()=>{});if(this.onclose)this.onclose();});}
  };
}
module.exports={webSocketImpl};
