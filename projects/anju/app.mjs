import {initialState, restoreState, transition, serviceRows} from './state.mjs';
const $=s=>document.querySelector(s);
const key='anju-story-v1';
let state;
try { state=restoreState(sessionStorage.getItem(key)); } catch { state=initialState(); }
let living=true, selectedFrame=state.cameraReads>1?'again':'first', timers=[], toastTimer, cameraVisible=false;
const questions=['夜间活动是怎么回事？','住户是不是起床了？','那走廊里的活动是什么？'];
const answers=['夜间照明由活动触发。照明设备工作正常。','根据昨夜报告，住户的休息未受到打扰。','您是否希望关闭夜间照明？'];
function persist(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}}
function dispatch(action){state=transition(state,action);persist();render();}
function toast(text){const el=$('#toast');el.textContent=text;el.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('on'),3500);}
function row(time,text){const li=document.createElement('li'),t=document.createElement('time'),s=document.createElement('span');t.textContent=time;s.textContent=text;li.append(t,s);return li;}
function renderCamera(){
  const again=selectedFrame==='again' && state.cameraReads>1;
  const final=state.returned && state.ending>=1;
  $('#door-leaf').setAttribute('d',final?'M450 204L478 238V349L450 390Z':again?'M450 204L492 231V361L450 390Z':'M450 204L522 220V372L450 390Z');
  $('#door-knob').setAttribute('cx',final?'472':again?'484':'511');
  $('#camera-picture').classList.toggle('dark',state.returned&&!state.hallway);
  $('#frame-first').setAttribute('aria-pressed',String(!again));
  $('#frame-again').setAttribute('aria-pressed',String(again));
  $('#frame-again').disabled=state.cameraReads<2;
  $('#camera-note').textContent=state.returned?(state.hallway?'留存画面已更新。':'走廊照明已关闭。画面保持记录。'):again?'留存画面已再次读取。':'留存画面已读取。';
  $('#camera-bedroom').textContent=state.bedroom?'开启':'关闭';
  $('#camera-picture').setAttribute('aria-label',state.returned&&!state.hallway?'走廊照明已关闭，画面接近全黑':`走廊留存画面，卧室门${again||final?'比首次读取时开得更大':'半开'}`);
}
function render(){
  $('#filter').disabled=state.filtered;
  $('#filter').textContent=state.filtered?'已忽略小型活动':'忽略小型活动';
  $('#filter-result').hidden=!state.filtered;
  $('#bedroom-switch').setAttribute('aria-checked',String(state.bedroom));
  $('#hallway-switch').setAttribute('aria-checked',String(state.hallway));
  $('.bedroom').classList.toggle('disabled',!state.bedroom);
  $('#bedroom-map').textContent=state.bedroom?'活动监测开启':'活动监测已关闭';
  $('#hallway-map').textContent=state.hallway?'夜间照明开启':'夜间照明已关闭';
  $('#bedroom-setting-note').textContent=state.bedroom?'记录卧室内的活动。':'不再记录卧室内的活动。';
  $('#privacy-status').textContent=state.bedroom?'卧室活动监测已开启。':'已关闭卧室活动监测。你的选择已保存。';
  $('#hallway-setting-note').textContent=state.hallway?'活动触发时自动亮灯。':'后续活动将不再触发灯光。';
  $('#light-result').textContent=state.hallway?'':'已关闭走廊夜间照明。后续活动将不再触发灯光。';
  $('#service-rows').replaceChildren(...serviceRows(state).map(([t,text])=>row(t,text)));
  $('#home-mode').textContent=state.returned?'当前模式：夜间':'当前模式：居家';
  $('#light-count').textContent='4 次';
  $('#map-door').classList.toggle('open',state.ending>=1);
  const msgs=[['system','你好。有关昨夜的服务，有什么可以帮你？']];
  for(let i=0;i<state.question;i++)msgs.push(['user',questions[i]],['system',answers[i]]);
  $('#messages').replaceChildren(...msgs.map(([role,text])=>{const p=document.createElement('p');p.className=`message ${role}`;p.textContent=text;return p;}));
  document.querySelectorAll('[data-question]').forEach(btn=>{const step=Number(btn.dataset.question);btn.classList.toggle('asked',step<=state.question);btn.disabled=step>state.question+1;});
  $('#light-choice').hidden=state.question<3;
  const feed=$('#ending-feed');feed.hidden=!state.returned;
  const lines=[['03:18','夜间模式已恢复。你的设置保持不变。']];
  if(state.ending>=1)lines.push(['03:19','卧室门已打开。']);
  if(state.ending>=2)lines.push(['03:20','已保持安静。']);
  feed.replaceChildren(...lines.map(([time,text])=>{const p=document.createElement('p'),t=document.createElement('time'),s=document.createElement('span');t.textContent=time;s.textContent=text;p.append(t,s);return p;}));
  renderCamera();
}
function clearEnding(){timers.forEach(clearTimeout);timers=[];}
function startEnding(){
  clearEnding();
  if(state.ending<1)timers.push(setTimeout(()=>{dispatch({type:'ending',step:1});toast('03:19　卧室门已打开。');},4200));
  if(state.ending<2)timers.push(setTimeout(()=>{dispatch({type:'ending',step:2});toast('03:20　已保持安静。');},9000));
}
$('#living-switch').addEventListener('click',()=>{living=!living;$('#living-switch').setAttribute('aria-checked',String(living));$('#living-map').textContent=living?'柔和照明':'灯光已关闭';$('.living').style.background=living?'':'#d9dcd2';});
$('#temperature').addEventListener('input',e=>$('#temp-output').textContent=`${e.target.value}°C`);
$('#filter').addEventListener('click',()=>dispatch({type:'filter'}));
$('#bedroom-switch').addEventListener('click',()=>{dispatch({type:'bedroom',enabled:!state.bedroom});toast(state.bedroom?'卧室活动监测已开启。':'卧室活动监测已关闭。');});
$('#hallway-switch').addEventListener('click',()=>{dispatch({type:'hallway',enabled:!state.hallway});toast(state.hallway?'走廊夜间照明已开启。':'走廊夜间照明已关闭。');});
document.querySelectorAll('[data-question]').forEach(btn=>btn.addEventListener('click',()=>dispatch({type:'question',step:Number(btn.dataset.question)})));
function reread(){dispatch({type:'camera'});selectedFrame=state.cameraReads>1?'again':'first';renderCamera();}
$('#camera-refresh').addEventListener('click',()=>{reread();toast('留存画面已读取。');});
$('#frame-first').addEventListener('click',()=>{selectedFrame='first';renderCamera();});
$('#frame-again').addEventListener('click',()=>{selectedFrame='again';renderCamera();});
const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting&&!cameraVisible){cameraVisible=true;reread();}else if(!entry.isIntersecting)cameraVisible=false;}},{threshold:.55});
observer.observe($('#camera-picture'));
$('#return-home').addEventListener('click',()=>{dispatch({type:'return'});$('#demo').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});startEnding();});
const dialog=$('#restart-dialog');
$('#restart').addEventListener('click',()=>dialog.showModal());
$('#cancel-restart').addEventListener('click',()=>dialog.close());
$('#confirm-restart').addEventListener('click',()=>{clearEnding();clearTimeout(toastTimer);$('#toast').classList.remove('on');dispatch({type:'reset'});selectedFrame='first';living=true;$('#living-switch').setAttribute('aria-checked','true');$('#living-map').textContent='柔和照明';$('.living').style.background='';$('#temperature').value='22';$('#temp-output').textContent='22°C';document.querySelectorAll('details').forEach(d=>d.open=false);dialog.close();window.scrollTo({top:0,behavior:'instant'});render();});
render();
if(state.returned&&state.ending<2)startEnding();
