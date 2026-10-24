import test from 'node:test';
import assert from 'node:assert/strict';
import { matchScore, policyFor, publicReport, analytics, duplicateCandidates } from '../src/domain.js';
import { clearAll, put, getAll, exportData, importData } from '../src/store.js';

const report=(overrides={})=>({id:'r1',kind:'lost',category:'Books & notebooks',itemType:'Notebook',color:'Blue',brand:'Acme',date:'2026-10-22',locationId:'library',status:'open',createdAt:'2026-10-22T10:00:00Z',...overrides});

test('storage persists report and status changes through the repository API',async()=>{
  await clearAll();const r=report();await put('reports',r);r.status='recovered';await put('reports',r);const restored=await getAll('reports');assert.equal(restored.length,1);assert.equal(restored[0].status,'recovered');
});
test('export and import validate versioned data without inventing reports',async()=>{
  await clearAll();const blank=await exportData();assert.equal(blank.schemaVersion,1);assert.equal(blank.reports.length,0);await importData(blank);assert.equal((await getAll('reports')).length,0);await assert.rejects(importData({schemaVersion:9}),/supported/);
});
test('claims remain linked to their report across stored reads',async()=>{
  await put('reports',report());await put('claims',{id:'c1',reportId:'r1',status:'Submitted'});assert.equal((await getAll('claims'))[0].reportId,(await getAll('reports'))[0].id);
});
test('public found report omits private verification and sensitive image clues',()=>{
  const found=report({kind:'found',category:'ID cards',value:'Expensive',approved:true,privateClue:'Name and number',image:'data:image/png;base64,secret',description:'Student ID with full name',publicDescription:'Sensitive item'});
  const safe=publicReport(found);assert.equal(safe.description,'A sensitive item has been handed to authorized campus staff.');assert.equal('privateClue' in safe,false);assert.equal(safe.image,null);assert.equal(policyFor('ID cards').level,3);
  assert.equal(policyFor('Other','Less expensive','campus access card').level,3);
});
test('valuable found reports remain unpublished until staff approval',()=>{
  assert.equal(publicReport(report({kind:'found',category:'Wallets',approved:false})),null);
  assert.equal(policyFor('Wallets','Expensive').review,true);
});
test('public report does not expose a restricted clue property',()=>{
  const safe=publicReport(report({privateClue:'inside engraving',locationDetail:'seat 4'}));assert.equal('privateClue' in safe,false);assert.equal('locationDetail' in safe,false);
});
test('matching uses known evidence, rewards similarities and penalizes contradictions',()=>{
  const lost=report({});const found=report({id:'f1',kind:'found',approved:true,status:'active'});assert.ok(matchScore(lost,found).score>=80);
  const missing=matchScore(report({brand:'',color:'',locationId:''}),report({id:'f2',kind:'found',brand:'',color:'',locationId:'',status:'active'}));assert.deepEqual(missing.factors,['Same category','Similar item type','Dates within one day']);
  const contradicted=matchScore(lost,report({id:'f3',kind:'found',color:'Red',brand:'Other',status:'active'}));assert.ok(contradicted.score<matchScore(lost,found).score);
});
test('closed and duplicate found reports cannot become matches',()=>{
  const lost=report();assert.equal(matchScore(lost,report({kind:'found',status:'recovered'})).score,0);assert.equal(matchScore(lost,report({kind:'found',duplicateOf:'f0'})).score,0);
});
test('analytics uses records, excludes linked duplicates, and only counts confirmed recovery',()=>{
  const rows=[report({id:'l1'}),report({id:'f1',kind:'found',status:'active'}),report({id:'f2',kind:'found',status:'recovered',createdAt:'2026-10-22T10:00:00Z',updatedAt:'2026-10-24T10:00:00Z'}),report({id:'d1',kind:'lost',duplicateOf:'l1'})];
  const a=analytics(rows,[{id:'c1',status:'Approved for in-person verification'}]);assert.equal(a.lost,1);assert.equal(a.found,2);assert.equal(a.recovered,1);assert.equal(a.recoveryRate,33);assert.equal(a.pendingClaims,0);
  assert.equal(a.averageDays,2);assert.ok(a.weekly.length>0);assert.ok(a.monthly.length>0);
  const empty=analytics([]);assert.equal(empty.recoveryRate,0);assert.deepEqual(empty.byLocation,[]);
});
test('duplicate candidate detection compares item, location, and nearby dates',()=>{
  const a=report({id:'a'}),b=report({id:'b',date:'2026-10-24'}),c=report({id:'c',locationId:'canteen'});assert.deepEqual(duplicateCandidates(a,[a,b,c]).map(x=>x.id),['b']);
});
