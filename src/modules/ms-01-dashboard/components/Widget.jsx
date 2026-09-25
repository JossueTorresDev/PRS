import React from 'react'

export default function Widget({ title, value, caption }){
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="text-2xl font-bold text-slate-900 mt-2">{value}</div>
      {caption && <div className="text-xs text-slate-400 mt-1">{caption}</div>}
    </div>
  )
}
