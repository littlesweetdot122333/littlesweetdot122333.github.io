export const initialState = () => ({filtered:false, bedroom:true, hallway:true, cameraReads:0, question:0, returned:false, ending:0});
export function restoreState(raw) {
  const next=initialState();
  try { const value=JSON.parse(raw); if(!value || typeof value!=='object') return next;
    for(const key of ['filtered','bedroom','hallway','returned']) if(typeof value[key]==='boolean') next[key]=value[key];
    for(const [key,max] of [['cameraReads',2],['question',3],['ending',2]]) if(Number.isInteger(value[key])) next[key]=Math.max(0,Math.min(max,value[key]));
  } catch {} return next;
}
export function transition(state, action) {
  const next={...state};
  switch(action.type) {
    case 'filter': next.filtered=true; break;
    case 'bedroom': next.bedroom=Boolean(action.enabled); break;
    case 'hallway': next.hallway=Boolean(action.enabled); break;
    case 'camera': next.cameraReads=Math.min(2,state.cameraReads+1); break;
    case 'question': next.question=Math.max(state.question,Math.min(3,action.step)); break;
    case 'return': next.returned=true; break;
    case 'ending': if(state.returned) next.ending=Math.max(state.ending,Math.min(2,action.step)); break;
    case 'reset': return initialState();
  }
  return next;
}
export function serviceRows(state) {
  const rows=[['02:51',`卧室活动监测：${state.bedroom?'开启':'关闭'}`],['03:14','走廊照明开启'],['03:15','卧室门口照明开启'],['03:18',state.hallway?'恢复夜间模式':'恢复夜间模式；后续活动不再触发照明']];
  if(state.ending>=1) rows.push(['03:19','卧室门已打开']);
  if(state.ending>=2) rows.push(['03:20','已保持安静。']);
  return rows;
}
