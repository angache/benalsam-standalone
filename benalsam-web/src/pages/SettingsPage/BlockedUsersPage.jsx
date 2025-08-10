import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  UserX,
  User,
  Calendar,
  Unlock,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useHapticFeedback } from '../../hooks/useHapticFeedback';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores';

const BlockedUsersPage = () => {
  const navigate = useNavigate();
  const { triggerHaptic } = useHapticFeedback();
  const { currentUser } = useAuthStore();
  
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnblocking, setIsUnblocking] = useState(false);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocked_user_id,
          blocked_at,
          blocked_user:blocked_user_id (
            id,
            username,
            name,
            avatar_url
          )
        `)
        .eq('user_id', currentUser.id)
        .order('blocked_at', { ascending: false });

      if (error) {
        console.error('Error loading blocked users:', error);
        return;
      }

      setBlockedUsers(data || []);
    } catch (error) {
      console.error('Error loading blocked users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (blockedUserId) => {
    try {
      setIsUnblocking(true);
      triggerHaptic();

      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('blocked_user_id', blockedUserId);

      if (error) {
        console.error('Error unblocking user:', error);
        alert('Kullanıcının engellemesi kaldırılırken bir hata oluştu.');
        return;
      }

      // Remove from local state
      setBlockedUsers(prev => prev.filter(user => user.blocked_user_id !== blockedUserId));
      alert('Kullanıcının engellemesi kaldırıldı.');
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Kullanıcının engellemesi kaldırılırken bir hata oluştu.');
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleGoBack = () => {
    navigate('/ayarlar2');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderBlockedUser = (user) => {
    const blockedUser = user.blocked_user;
    if (!blockedUser) return null;

    return (
      <motion.div
        key={blockedUser.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              {blockedUser.avatar_url ? (
                <img 
                  src={blockedUser.avatar_url} 
                  alt={blockedUser.name || blockedUser.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <User size={24} className="text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 dark:text-white">
                {blockedUser.name || blockedUser.username}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{blockedUser.username}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-xs text-gray-400">
                  {formatDate(user.blocked_at)} tarihinde engellendi
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleUnblock(blockedUser.id)}
            disabled={isUnblocking}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {isUnblocking ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>...</span>
              </>
            ) : (
              <>
                <Unlock size={16} />
                <span>Engeli Kaldır</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleGoBack}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1 text-center">
          <h1 className="text-xl font-semibold">Engellenen Kullanıcılar</h1>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      {blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <UserX size={32} className="text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Engellenen Kullanıcı Yok
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
            Henüz hiçbir kullanıcıyı engellememiş görünüyorsunuz.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Info Card */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <AlertCircle size={20} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 dark:text-blue-100">Engellenen Kullanıcılar</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Engellediğiniz kullanıcılar burada listelenir. Engeli kaldırdığınızda kullanıcı size tekrar mesaj gönderebilir.
                </p>
              </div>
            </div>
          </div>

          {/* Blocked Users List */}
          <div className="space-y-3">
            {blockedUsers.map(renderBlockedUser)}
          </div>

          {/* Stats */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserX size={20} className="text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Toplam {blockedUsers.length} engellenen kullanıcı
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-xs text-green-600 dark:text-green-400">
                  Güncel
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default BlockedUsersPage; 