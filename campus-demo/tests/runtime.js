// Minimal DOM doubles for JavaScriptCore logic checks. This is NOT a browser/render test.
var testNodes = {}, testLists = {}, testStorage = {}, storageBlocked = false;
function testNode(key) {
  if (!testNodes[key]) testNodes[key] = {innerHTML:'',textContent:'',value:'',dataset:{},style:{},disabled:false,hidden:true,listeners:{},offsetWidth:1440,offsetHeight:960,clientWidth:1440,clientHeight:800,
    classList:{add:function(){},remove:function(){},toggle:function(){}},
    setAttribute:function(){},focus:function(){},close:function(){},showModal:function(){},setPointerCapture:function(){},
    addEventListener:function(type,fn){this.listeners[type]=fn;},
    closest:function(){return this;}
  };
  return testNodes[key];
}
testNode('#world').parentElement=testNode('.campus');
var document={querySelector:testNode,querySelectorAll:function(key){return testLists[key]||[];}};
var location={hash:'#campus'};
var window={scrollTo:function(){},addEventListener:function(){}};
var localStorage={getItem:function(key){if(storageBlocked)throw Error('disabled');return testStorage[key]||null;},setItem:function(key,value){if(storageBlocked)throw Error('disabled');testStorage[key]=value;},removeItem:function(key){delete testStorage[key];}};
var setTimeout=function(){return 0;},clearTimeout=function(){},confirm=function(){return true;};
