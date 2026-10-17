// Read-only ownership reconstruction after interrupted CLI acknowledgement. No cleanup/resume writes.
import {readFile,writeFile} from 'node:fs/promises';
if(process.env.BA02_INSPECT_OWNED!=='YES') throw new Error('Explicit ownership inspection opt-in required');
const {Pool}=await import('pg');
const {readConfiguration}=await import('../dist/ba02-check/infrastructure/configuration.js');
const cleanup = process.argv[3] === '--cleanup';
const ledgerPath=process.argv[2];
const ledger=JSON.parse(await readFile(ledgerPath,'utf8'));
const report=JSON.parse(await readFile(new URL('./evidence/ba02-backend.json',import.meta.url),'utf8'));
if(report.runTag!==ledger.tag) throw new Error('Run ledger mismatch');
const pool=new Pool({...readConfiguration(process.env).database,max:1,application_name:'ba02-readonly-owned-state',options:cleanup ? '-c statement_timeout=15000 -c lock_timeout=5000' : '-c default_transaction_read_only=on',connectionTimeoutMillis:15000,query_timeout:20000});
let client;
const observation={inspectedAt:new Date().toISOString(),result:'failed'};
try{
 client=await pool.connect();await client.query(cleanup ? 'begin' : 'begin read only');
 const rows=(await client.query(`select b.id as business_id,br.id as branch_id,a.id as account_id,
 b.name=$1 as business_tag_matches,br.name=$1 as branch_tag_matches,a.display_name=$1 as account_tag_matches,
 a.username='ba02.owner' as username_matches,a.role='administrator' and a.status='active' and a.password_change_required as restricted_admin,
 c.password_hash like '$argon2id$%' as phc_hash_only,
 ib.business_id=b.id and ib.branch_id=br.id as binding_matches,
 g.business_id=b.id and g.branch_id=br.id as grant_matches
 from public.businesses b join public.branches br on br.business_id=b.id
 join public.installation_binding ib on ib.business_id=b.id
 join public.staff_accounts a on a.business_id=b.id
 join public.staff_credentials c on c.account_id=a.id
 join public.staff_branch_grants g on g.account_id=a.id where b.name=$1`,[ledger.tag])).rows;
 const counts={};for(const table of ['businesses','branches','installation_binding','staff_accounts','staff_credentials','staff_branch_grants','access_sessions','access_prelogins','access_limits','access_security_events']) counts[table]=Number((await client.query(`select count(*) as n from public.${table}`)).rows[0].n);
 observation.counts=counts;
 const valid=rows.length===1&&Object.entries(rows[0]).filter(([key])=>!key.endsWith('_id')).every(([,value])=>value===true)&&Object.values(counts).slice(0,6).every(n=>n===1)&&Object.values(counts).slice(6).every(n=>n===0);
 observation.exactRunOwnershipMatches=valid;
 if(valid){ledger.business=rows[0].business_id;ledger.branch=rows[0].branch_id;ledger.accounts=[rows[0].account_id];ledger.reconstructedReadOnly=true;await writeFile(ledgerPath,JSON.stringify(ledger),{mode:0o600});observation.result='passed';
 if(cleanup){
  await client.query('delete from public.staff_branch_grants where business_id=$1 and account_id=$2 and branch_id=$3',[ledger.business,ledger.accounts[0],ledger.branch]);
  await client.query('delete from public.staff_credentials where account_id=$1',[ledger.accounts[0]]);
  await client.query('delete from public.staff_accounts where id=$1 and business_id=$2',[ledger.accounts[0],ledger.business]);
  await client.query('delete from public.installation_binding where business_id=$1 and branch_id=$2',[ledger.business,ledger.branch]);
  await client.query('delete from public.branches where id=$1 and business_id=$2',[ledger.branch,ledger.business]);
  await client.query('delete from public.businesses where id=$1 and name=$2',[ledger.business,ledger.tag]);
  await client.query('commit');observation.cleanup='six exactly-owned records deleted; migration history preserved';
 }
 }
 else process.exitCode=1;
}finally{if(client){await client.query('rollback').catch(()=>{});client.release();}await pool.end();observation.poolClosed=pool.ended&&pool.totalCount===0;report.ownershipInspection=observation;await writeFile(new URL('./evidence/ba02-backend.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(observation));}
