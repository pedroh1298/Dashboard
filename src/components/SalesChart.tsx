"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface SalesPoint {
  name: string;
  ML: number;
  Amazon: number;
}

export default function SalesChart({ data }: { data: SalesPoint[] }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorML" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#176b57" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#176b57" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorAmz" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#bd6a24" stopOpacity={0.16} />
              <stop offset="95%" stopColor="#bd6a24" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#303630" vertical={false} />
          <XAxis dataKey="name" stroke="#8f978f" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
          <YAxis stroke="#8f978f" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} tickFormatter={value => `R$${value / 1000}k`} dx={-10} />
          <Tooltip
            contentStyle={{ backgroundColor: '#171b18', borderColor: '#303630', borderRadius: '5px', color: '#f2f4f0' }}
            itemStyle={{ color: '#f2f4f0' }}
          />
          <Area type="monotone" dataKey="ML" stroke="#176b57" strokeWidth={2} fillOpacity={1} fill="url(#colorML)" />
          <Area type="monotone" dataKey="Amazon" stroke="#bd6a24" strokeWidth={2} fillOpacity={1} fill="url(#colorAmz)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
