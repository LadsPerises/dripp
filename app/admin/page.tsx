'use client';

import { Package, Tags, Users, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState({
    products: 0,
    categories: 0,
    users: 0,
    sales: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const categoriesSnap = await getDocs(collection(db, 'categories'));
        const usersSnap = await getDocs(collection(db, 'users'));
        const ordersSnap = await getDocs(collection(db, 'orders'));

        let totalSales = 0;
        ordersSnap.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'delivered' && data.totalAmount) {
            totalSales += Number(data.totalAmount);
          }
        });

        setStatsData({
          products: productsSnap.size,
          categories: categoriesSnap.size,
          users: usersSnap.size,
          sales: totalSales
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const stats = [
    { title: 'Produtos Cadastrados', value: statsData.products.toString(), icon: Package, color: 'text-blue-500' },
    { title: 'Categorias Ativas', value: statsData.categories.toString(), icon: Tags, color: 'text-green-500' },
    { title: 'Usuários Cadastrados', value: statsData.users.toString(), icon: Users, color: 'text-purple-500' },
    { title: 'Vendas Totais', value: `${statsData.sales.toFixed(2).replace('.', ',')} Kz`, icon: DollarSign, color: 'text-[#FF4D00]' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-[#FF4D00]">Dashboard</h1>
        <p className="text-white/60 font-bold uppercase tracking-widest text-xs mt-2">Visão geral da sua operação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white/5 border-2 border-white/10 p-6 rounded-lg hover:border-white/20 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">{stat.title}</h3>
                <Icon size={20} className={stat.color} />
              </div>
              <p className="text-3xl font-black">{stat.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
