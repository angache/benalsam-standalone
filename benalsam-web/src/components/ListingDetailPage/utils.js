export const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Acil': return 'bg-red-600';
      case 'Normal': return 'bg-amber-500';
      case 'Acil Değil': return 'bg-green-500';
      default: return 'bg-slate-500';
    }
};

export const formatDate = (dateString) => {
    if (!dateString) return "Bilinmiyor";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};
  
export const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
      case 'accepted': return 'text-green-400 border-green-400/50 bg-green-400/10';
      case 'rejected': return 'text-red-400 border-red-400/50 bg-red-400/10';
      case 'cancelled': return 'text-slate-400 border-slate-400/50 bg-slate-400/10';
      default: return 'text-slate-500 border-slate-500/50 bg-slate-500/10';
    }
};