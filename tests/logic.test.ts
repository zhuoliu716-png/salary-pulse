import {test} from 'node:test';
import assert from 'node:assert/strict';
import {snapshot} from '../src/lib/accrual';
import {DEFAULT_CONFIG, cumulativeTax, simulateYear} from '../src/lib/tax';
import {parseConfig} from '../src/lib/validate';
const cfg = {...DEFAULT_CONFIG, city:'none', insuranceBase:0};
const near = (a:number,b:number) => assert.ok(Math.abs(a-b)<.001, `${a} != ${b}`);
test('tax brackets and cumulative withheld reconcile',()=>{
  near(cumulativeTax(36000),1080); near(cumulativeTax(144000),11880);
  const months=simulateYear(cfg);
  near(months.reduce((s,m)=>s+m.tax,0),cumulativeTax(12*(cfg.monthlySalary-5000)));
});
test('no earnings before starting employment in either mode',()=>{
  for(const accrualMode of ['work','always'] as const){const s=snapshot({...cfg,startMonth:10,accrualMode},new Date(2026,8,4,12));near(s.todayEarned,0);near(s.yearToDate,0);assert.equal(s.status,'rest-day');}
});
test('whole calendar month reconciles to that month net income in both modes',()=>{
 for(const accrualMode of ['work','always'] as const){
  const c={...cfg,accrualMode}, end=snapshot(c,new Date(2026,8,30,23,59,59,999));
  near(end.monthEarned,end.monthlyTakeHome);
  const start=snapshot(c,new Date(2026,9,1));near(start.monthEarned,0);near(start.yearToDate,end.yearToDate);
 }
});
test('ordinary shift stops before start and after end',()=>{
 const a=snapshot(cfg,new Date(2026,8,4,8));near(a.todayEarned,0);assert.equal(a.status,'before-work');
 const b=snapshot(cfg,new Date(2026,8,4,13));near(b.todayEarned,b.perDay/2);
 const c=snapshot(cfg,new Date(2026,8,4,20));near(c.todayEarned,c.perDay);assert.equal(c.status,'after-work');
});
test('Friday night shift continues on Saturday and across month end',()=>{
 const c={...cfg,workStart:'22:00'};
 const a=snapshot(c,new Date(2026,8,5,2));assert.equal(a.status,'working');near(a.todayEarned,2*a.perHour);
 const b=snapshot(c,new Date(2026,9,1,2));assert.equal(b.status,'working');near(b.todayEarned,2*b.perHour);
 const end=snapshot(c,new Date(2026,8,30,23,59,59,999));near(end.monthEarned,end.monthlyTakeHome);
});
test('leap February and all-day year rollover have no phantom income',()=>{
 const c={...cfg,accrualMode:'always' as const}; const s=snapshot(c,new Date(2028,1,29,12));near(s.perDay,s.monthlyTakeHome/29);
 near(snapshot(c,new Date(2029,0,1)).yearToDate,0);
});
test('reject malformed or impossible configurations',()=>{
 for(const patch of [{monthlySalary:NaN},{monthlySalary:-1},{workDays:[]},{workStart:'25:99'},{workHoursPerDay:25},{rates:{...cfg.rates,pension:2}},{monthlySalary:1,insuranceBase:10000}])assert.throws(()=>parseConfig({...cfg,...patch}));
 assert.deepEqual(parseConfig({...cfg,workDays:[1,1,2]}).workDays,[1,2]);
});
