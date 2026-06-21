import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrdersLog = async () => {
      try {
        const data = await api.admin.listOrders();
        setOrders(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load transaction order logs.');
      } finally {
        setLoading(false);
      }
    };
    loadOrdersLog();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-studio-dark flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-studio-border rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-studio-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 min-h-screen text-left">
      
      {/* Back button */}
      <div>
        <Link to="/admin" className="inline-flex items-center text-gray-400 hover:text-white text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-extrabold text-white">Sales & Orders Log</h1>
        <p className="text-studio-muted text-sm mt-1">Audit billing logs and customer checkout details.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="glass border border-studio-border rounded-xl overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-studio-muted">
            No sales or checkout records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-studio-border text-xs text-white uppercase font-bold border-b border-studio-border">
                <tr>
                  <th className="px-6 py-3">Order Details</th>
                  <th className="px-6 py-3">Customer User</th>
                  <th className="px-6 py-3">Payment ID</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-studio-border/50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-studio-border/25 transition-colors">
                    {/* Order ID & Date */}
                    <td className="px-6 py-4">
                      <span className="text-white font-semibold text-xs block truncate max-w-[140px]" title={order.id}>
                        {order.id}
                      </span>
                      <span className="text-[10px] text-studio-muted block mt-0.5">
                        {new Date(order.created_at).toLocaleString()}
                      </span>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4">
                      <span className="text-gray-300 block text-xs truncate max-w-[180px]">
                        {order.profiles?.full_name || 'N/A'}
                      </span>
                    </td>

                    {/* Payment Gate ID */}
                    <td className="px-6 py-4 text-xs font-mono font-medium text-studio-muted">
                      {order.razorpay_payment_id || 'Webhook Verification Pending'}
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4 text-center">
                      {order.status === 'paid' ? (
                        <span className="inline-flex items-center text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 px-2 py-0.5 rounded">
                          Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </td>

                    {/* Total Amount */}
                    <td className="px-6 py-4 text-right text-studio-gold font-bold">
                      ₹{order.total_amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
