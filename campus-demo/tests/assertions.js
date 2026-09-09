var assertions=0;
function check(condition,message){assertions++;if(!condition)throw Error('FAIL: '+message);}
function clickTest(dataset,id){var t=testNode('target');t.dataset=dataset||{};t.id=id||'';t.disabled=false;main.listeners.click({target:t});}
function inputTest(node){main.listeners.input({target:node});}
var routes=['campus','classroom','reading-room','course','interviews','amazon','reading','reading-result','exercise','feedback','friend','conversation','reflection','sources'];
for(var n=0;n<3;n++){routes.push('reading-'+n);for(var company of ['google','amazon'])for(var stage of ['interview','followup','review'])routes.push(stage+'-'+company+'-'+n);}
for(var route of routes){location.hash='#'+route;render();check(main.innerHTML.length>400,'renders '+route);check(!/undefined|NaN/.test(main.innerHTML),'valid content '+route);}
check(questions.google.length===3&&questions.amazon.length===3,'six interview prompts');
check(readingQuestions.length===3,'three reading questions');
check(new Set(replies.map(function(r){return r.answer;})).size===3,'distinct conversation branches');
check(escapeHTML('<img onerror="x">')==='&lt;img onerror=&quot;x&quot;&gt;','HTML escaping');
state.drafts['google-0']='<script>alert(1)</script>';
check(interview('google',0).includes('&lt;script&gt;'),'typed draft escaped');
check(!interview('google',0).includes('<script>'),'no draft script injection');
state.drafts={};state.followups={};state.reviewed={};
var story=testNode('#story');story.id='story';story.dataset={company:'google',index:'0',follow:'false'};story.value='I changed our plan after five interviews.';inputTest(story);
check(state.drafts['google-0']===story.value,'draft saved');
check(!testNode('[data-submit-story]').disabled,'valid draft enables submit');
clickTest({submitStory:'google-0',follow:'false'});check(location.hash==='followup-google-0','draft to follow-up');
story.dataset.follow='true';story.value='I tested the assumption with a prototype.';inputTest(story);
clickTest({submitStory:'google-0',follow:'true'});check(location.hash==='review-google-0','follow-up to review');
testLists['[name="review-check"]:checked']=[testNode('check-one')];
clickTest({completeStory:'google-0'});check(state.reviewed['google-0']===true,'review completion');
clickTest({completeStory:'google-0'});check(doneCount()===1,'completion is idempotent');
story.value='I revised my answer with another detail.';inputTest(story);check(state.reviewed['google-0']===false,'editing invalidates completion');
story.value='';inputTest(story);check(testNode('[data-submit-story]').disabled,'empty response blocked');
for(var n=0;n<3;n++){testNode('target').dataset={index:String(n),choice:String(readingQuestions[n].answer)};testNode('target').id='check-reading';main.listeners.click({target:testNode('target')});check(state.reading[n]===readingQuestions[n].answer,'reading answer saved '+n);}
check(reading(0,true).includes('3<span>/ 3 correct'),'reading score');
state.reading[0]=0;check(reading(0).includes('Not quite.'),'incorrect feedback');
clickTest({action:'retry-reading'});check(Object.keys(state.reading).length===0,'reading reset');
for(var n=0;n<3;n++){clickTest({friend:String(n)});check(state.friendChoice===n,'friend branch '+n);check(social(true).includes(replies[n].answer),'correct branch response '+n);}
var friend=testNode('#friend-reply');friend.id='friend-reply';friend.value='I enjoyed finding evidence in the reading.';inputTest(friend);clickTest({},'send-friend');check(state.friendDone,'friend completed');check(reflection().includes(friend.value),'friend reply shown');
storageBlocked=true;check(save()===false,'storage fallback');storageBlocked=false;
testStorage['unrelated-user-data']='preserve me';document.querySelector('#reset').onclick();check(testStorage['unrelated-user-data']==='preserve me','reset preserves unrelated storage');check(!testStorage[KEY],'reset removes own key');check(doneCount()===0,'reset clears progress');
check(!review('google',0).includes('data-complete-story="google-0" >'),'empty deep-link cannot complete');
print('PASS: '+assertions+' assertions; '+routes.length+' route renders. Logic only; no browser layout claims.');
