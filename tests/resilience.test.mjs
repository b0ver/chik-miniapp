import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../dist/app.js',import.meta.url),'utf8');
function app(stored=null,denied=false){
  const element={innerHTML:'',textContent:'',classList:{add(){},remove(){}},addEventListener(){}};
  const context=vm.createContext({
    console,Intl,Date,location:{hash:''},
    document:{querySelector:()=>element,addEventListener(){}},
    window:{addEventListener(){}},
    localStorage:{getItem(){if(denied)throw Error('denied');return stored;},setItem(){if(denied)throw Error('quota');}},
    setTimeout:()=>1,clearTimeout(){},
  });
  vm.runInContext(source,context);
  return {context,element,run:code=>vm.runInContext(code,context)};
}
for(const stored of ['{broken',JSON.stringify({profile:{},bookings:[],services:[],hours:{},demoDate:'2000-01-01'})]){
  test(`invalid or expired storage restores a usable demo (${stored.slice(0,12)})`,()=>{
    const a=app(stored);assert.equal(a.run('state.services.length'),2);
    assert.equal(a.run('state.demoDate===TODAY'),true);assert.match(a.element.innerHTML,/чик/);
  });
}
test('denied storage still renders and reports a failed save without crashing',()=>{
  const a=app(null,true);assert.equal(a.run('state.services.length'),2);
  a.run('save()');assert.match(a.element.textContent,/до закрытия страницы/);
});
function schedule(){
  const a=app();
  a.run(`state.hours={days:[0,1,2,3,4,5,6],start:'10:00',end:'19:00',breakStart:'14:00',breakEnd:'15:00'};state.bookings=[];`);
  return a;
}
test('slots respect service buffer, break and closing time',()=>{
  const a=schedule(),slots=Array.from(a.run("getSlots('s1',addDays(TODAY,1))"));
  assert.ok(slots.includes('12:00'));assert.ok(!slots.includes('12:30'));
  assert.ok(!slots.includes('14:00'));assert.ok(slots.includes('15:00'));
  assert.ok(slots.includes('17:00'));assert.ok(!slots.includes('17:30'));
});
test('booking blocks a slot, rescheduling can exclude itself and cancellation releases it',()=>{
  const a=schedule();a.run("state.bookings=[{id:'x',serviceId:'s1',day:addDays(TODAY,1),time:'10:00',duration:90,buffer:15,status:'active'}]");
  assert.equal(a.run("getSlots('s1',addDays(TODAY,1)).includes('10:00')"),false);
  assert.equal(a.run("getSlots('s1',addDays(TODAY,1),'x').includes('10:00')"),true);
  a.run("state.bookings[0].status='cancelled'");
  assert.equal(a.run("getSlots('s1',addDays(TODAY,1)).includes('10:00')"),true);
});
test('past days and non-working days never offer slots',()=>{
  const a=schedule();assert.equal(a.run("getSlots('s1',addDays(TODAY,-1)).length"),0);
  a.run('state.hours.days=[]');assert.equal(a.run("getSlots('s1',addDays(TODAY,1)).length"),0);
});
