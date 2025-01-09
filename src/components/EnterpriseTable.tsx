// import { Enterprise } from '../types/types';
// import { useEffect, useState } from 'react';
// import { 
//   CheckCircleIcon, 
//   XCircleIcon,
//   InformationCircleIcon,
// } from '@heroicons/react/24/outline';
// import { getEnterprise } from '../data/enterprise';
// import { formatDate } from '../utils/format';

// interface EnterpriseTableProps {
//   enterprises: Enterprise[];
//   onStatusChange: (id: string, status: string) => void;
// }

// interface InfoModalProps {
//   enterprise: Enterprise;
//   stats: any;
//   onClose: () => void;
// }

// function InfoModal({ enterprise, stats, onClose }: InfoModalProps) {
//   return (
//     <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
//       <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
//         <h3 className="text-lg font-bold mb-4">Détails de l'entreprise</h3>
//         <div className="space-y-3">
//           <div>
//             <p className="text-sm text-gray-500">Dernière connexion:</p>
//             <p className="font-medium">
//               {enterprise.lastLogin ? formatDate(enterprise.lastLogin) : 'Jamais'}
//             </p>
//           </div>
//           <div>
//             <p className="text-sm text-gray-500">Articles vendus:</p>
//             <p className="font-medium">
//               {stats?.total_products_sold || 0}
//             </p>
//           </div>
//           <div>
//             <p className="text-sm text-gray-500">Ventes totales:</p>
//             <p className="font-medium">
//               {stats?.total_sales ? `${stats.total_sales} FCFA` : '0 FCFA'}
//             </p>
//           </div>
//         </div>
//         <div className="mt-6 flex justify-end">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
//           >
//             Fermer
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function EnterpriseTable({ 
//   enterprises, 
//   onStatusChange 
// }: EnterpriseTableProps) {
//   const [stats, setStats] = useState<Record<string, any>>({});
//   const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null);

//   useEffect(() => {
//     const fetchStats = async () => {
//       const statsData: Record<string, any> = {};
//       for (const enterprise of enterprises) {
//         try {
//           const data = await getEnterprise(enterprise.id);
//           statsData[enterprise.id] = data;
//         } catch (error) {
//           console.error('Erreur stats:', error);
//           statsData[enterprise.id] = null;
//         }
//       }
//       setStats(statsData);
//     };

//     fetchStats();
//   }, [enterprises]);

//   return (
//     <div className="overflow-x-auto">
//       {selectedEnterprise && (
//         <InfoModal
//           enterprise={selectedEnterprise}
//           stats={stats[selectedEnterprise.id]}
//           onClose={() => setSelectedEnterprise(null)}
//         />
//       )}
      
//       <table className="min-w-full divide-y divide-gray-200">
//         <thead className="bg-gray-50">
//           <tr>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Nom
//             </th>
//             <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Email
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Statut
//             </th>
//             <th className="hidden sm:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Utilisation
//             </th>
//             <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//               Actions
//             </th>
//           </tr>
//         </thead>
//         <tbody className="bg-white divide-y divide-gray-200">
//           {enterprises.map((enterprise) => {
//             const enterpriseStats = stats[enterprise.id];
//             return (
//               <tr key={enterprise.id} className="hover:bg-gray-50">
//                 <td className="px-3 py-4 whitespace-nowrap">
//                   <div className="text-sm font-medium text-gray-900">
//                     {enterprise.name}
//                   </div>
//                   <div className="md:hidden text-sm text-gray-500">
//                     {enterprise.email}
//                   </div>
//                 </td>
//                 <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-500">
//                   {enterprise.email}
//                 </td>
//                 <td className="px-3 py-4 whitespace-nowrap">
//                   <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
//                     ${enterprise.subscriptionStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
//                     {enterprise.subscriptionStatus ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
//                     {enterprise.subscriptionStatus ? 'Actif' : 'Inactif'}
//                   </span>
//                 </td>
//                 <td className="hidden sm:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-500">
//                   {enterpriseStats ? (
//                     <div>
//                       <div>Clients: {enterpriseStats.total_clients}</div>
//                       <div>Ventes: {enterpriseStats.total_sales} FCFA</div>
//                     </div>
//                   ) : (
//                     'Chargement...'
//                   )}
//                 </td>
//                 <td className="px-3 py-4 whitespace-nowrap text-sm font-medium space-x-2">
//                   <button
//                     onClick={() => setSelectedEnterprise(enterprise)}
//                     className="p-1.5 text-gray-500 hover:text-blue-600"
//                     title="Détails"
//                   >
//                     <InformationCircleIcon className="h-5 w-5" />
//                   </button>
//                   <select
//                     value={enterprise.subscriptionStatus}
//                     onChange={(e) => onStatusChange(enterprise.id, e.target.value)}
//                     className="inline-block w-32 pl-3 pr-8 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
//                   >
//                     <option value="active">Actif</option>
//                     <option value="inactive">Inactif</option>
//                     <option value="suspended">Suspendu</option>
//                   </select>
//                 </td>
//               </tr>
//             );
//           })}
//         </tbody>
//       </table>
//     </div>
//   );
// }
