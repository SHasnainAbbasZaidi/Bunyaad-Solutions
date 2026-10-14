"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
export function RichEditor({value,onChange,label}:{value:string;onChange:(value:string)=>void;label:string}){
 const editor=useEditor({extensions:[StarterKit],content:value,immediatelyRender:false,editorProps:{attributes:{"aria-label":label,role:"textbox","aria-multiline":"true"}},onUpdate:({editor})=>onChange(editor.getHTML())});
 if(!editor)return <p>Loading editor…</p>;
 const actions=[{label:"Bold",run:()=>editor.chain().focus().toggleBold().run()},{label:"Italic",run:()=>editor.chain().focus().toggleItalic().run()},{label:"Heading",run:()=>editor.chain().focus().toggleHeading({level:2}).run()},{label:"Bullet list",run:()=>editor.chain().focus().toggleBulletList().run()},{label:"Numbered list",run:()=>editor.chain().focus().toggleOrderedList().run()},{label:"Undo",run:()=>editor.chain().focus().undo().run()},{label:"Redo",run:()=>editor.chain().focus().redo().run()}];
 return <div className="rich-editor"><div className="flex flex-wrap gap-2 border-b p-2">{actions.map(action=><button type="button" key={action.label} onClick={action.run}>{action.label}</button>)}</div><EditorContent editor={editor}/></div>;
}