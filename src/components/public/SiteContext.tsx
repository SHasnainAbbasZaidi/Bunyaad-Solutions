"use client";
import {createContext,useContext} from "react";
const SettingsContext=createContext<Record<string,string>>({});
export const SiteSettingsProvider=SettingsContext.Provider;
export const useSiteSettings=()=>useContext(SettingsContext);
export function sectionCopy(settings:Record<string,string>,key:string,fallback:string){
 try{return JSON.parse(settings.section_copy||"{}")[key]||fallback;}catch{return fallback;}
}