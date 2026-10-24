const DB_NAME='campus-findit';
const STORES=['reports','claims','custody','notifications','audit'];
const memory=Object.fromEntries(STORES.map(s=>[s,new Map()]));
let dbPromise;
function openDB(){
  if(!('indexedDB' in globalThis))return Promise.resolve(null);
  if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,1);
    req.onupgradeneeded=()=>{const db=req.result; for(const name of STORES)if(!db.objectStoreNames.contains(name))db.createObjectStore(name,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
  });
  return dbPromise;
}
export async function getAll(store){const db=await openDB();if(!db)return [...memory[store].values()];return new Promise((resolve,reject)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function put(store,record){const db=await openDB();if(!db){memory[store].set(record.id,structuredClone(record));return record;}return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(record);tx.oncomplete=()=>resolve(record);tx.onerror=()=>reject(tx.error);});}
export async function remove(store,id){const db=await openDB();if(!db){memory[store].delete(id);return;}return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
export async function clearAll(){const db=await openDB();if(!db){for(const s of STORES)memory[s].clear();return;}return new Promise((resolve,reject)=>{const tx=db.transaction(STORES,'readwrite');for(const s of STORES)tx.objectStore(s).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
export async function exportData(){const out={schemaVersion:1,exportedAt:new Date().toISOString()};for(const s of STORES)out[s]=await getAll(s);return out;}
export async function importData(data){
  if(!data || data.schemaVersion!==1 || !STORES.every(s=>Array.isArray(data[s])))throw new Error('This file is not a supported Campus FindIt export.');
  for(const s of STORES)for(const item of data[s])if(!item || typeof item.id!=='string')throw new Error(`Invalid ${s} record in import.`);
  for(const s of STORES){for(const item of data[s])await put(s,item);}
  return true;
}
export const STORE_NAMES=STORES;
