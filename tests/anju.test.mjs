import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState, transition, restoreState, serviceRows} from '../projects/anju/state.mjs';
test('privacy and lighting choices survive the complete story and reload',()=>{
  let s=initialState();
  for(const action of [{type:'filter'},{type:'bedroom',enabled:false},{type:'camera'},{type:'camera'},{type:'question',step:1},{type:'question',step:2},{type:'question',step:3},{type:'hallway',enabled:false},{type:'return'},{type:'ending',step:1},{type:'ending',step:2}])s=transition(s,action);
  s=restoreState(JSON.stringify(s));
  assert.equal(s.bedroom,false);assert.equal(s.hallway,false);assert.equal(s.cameraReads,2);assert.equal(s.ending,2);
  const lines=serviceRows(s).map(x=>x[1]);
  assert.ok(lines.includes('卧室活动监测：关闭'));assert.ok(lines.includes('走廊照明开启'));
  assert.ok(lines.includes('恢复夜间模式；后续活动不再触发照明'));
  assert.ok(lines.includes('卧室门已打开'));assert.ok(lines.includes('已保持安静。'));
  assert.deepEqual(transition(s,{type:'reset'}),initialState());
});
test('story can complete with lights on and ignores malformed saved data',()=>{
  let s=initialState();
  assert.deepEqual(transition(s,{type:'ending',step:2}),s);
  s=transition(transition(s,{type:'return'}),{type:'ending',step:2});
  assert.equal(s.hallway,true);assert.ok(serviceRows(s).some(x=>x[1]==='卧室门已打开'));
  assert.deepEqual(restoreState('{bad'),initialState());
  const restored=restoreState('{"bedroom":"false","hallway":false,"cameraReads":1000,"ending":-2,"question":null}');
  assert.equal(restored.bedroom,true);assert.equal(restored.hallway,false);assert.equal(restored.cameraReads,2);assert.equal(restored.ending,0);assert.equal(restored.question,0);
});
