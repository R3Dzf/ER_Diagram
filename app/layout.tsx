import type { Metadata } from "next";
import type { ReactNode } from "react";
export const metadata: Metadata = {title:"Bosha Studio",description:"Design, validate, and export your database diagrams.",icons:{icon:[{url:"/icons/bosha-symbol.svg",type:"image/svg+xml"},{url:"/icons/bosha-favicon.ico"}],apple:"/icons/bosha-apple-180.png"}};
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body style={{margin:0}}>{children}</body></html>;}
