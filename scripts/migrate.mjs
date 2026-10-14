import {existsSync,mkdirSync,openSync,closeSync} from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
const url=process.env.DATABASE_URL;
if(!url?.startsWith("file:"))throw new Error("Set DATABASE_URL to a SQLite file URL.");
const file=path.resolve("prisma",url.slice(5));
if(!existsSync(file)){mkdirSync(path.dirname(file),{recursive:true});closeSync(openSync(file,"wx"));}
const result=spawnSync(process.execPath,["node_modules/prisma/build/index.js","migrate","deploy"],{stdio:"inherit",windowsHide:true});
process.exitCode=result.status??1;
