export default function UserStatsCards({ baseUsers }) {
  if (baseUsers.length === 0) return null;

  const cards = [
    {
      label: "Total Usuarios",
      value: baseUsers.length,
      color: "border-l-cyan-500",
      bg: "bg-cyan-50",
      text: "text-cyan-500",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    },
    {
      label: "Activos",
      value: baseUsers.filter((u) => u.status === "ACTIVE").length,
      color: "border-l-green-500",
      bg: "bg-green-50",
      text: "text-green-500",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    },
    {
      label: "Inactivos",
      value: baseUsers.filter((u) => u.status === "INACTIVE").length,
      color: "border-l-red-500",
      bg: "bg-red-50",
      text: "text-red-500",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    },
    {
      label: "Suspendidos",
      value: baseUsers.filter((u) => u.status === "SUSPENDED").length,
      color: "border-l-yellow-500",
      bg: "bg-yellow-50",
      text: "text-yellow-500",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    },
    {
      label: "Bloqueados",
      value: baseUsers.filter((u) => u.status === "BLOCKED").length,
      color: "border-l-cyan-500",
      bg: "bg-cyan-50",
      text: "text-cyan-500",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    }
  ];

  return (
    <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className={`bg-white border-l-4 ${card.color} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-slate-800">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bg} ${card.text}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {card.icon}
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
