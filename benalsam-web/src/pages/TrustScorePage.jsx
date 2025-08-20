import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, CheckCircle, Edit, MailCheck, Package, Star, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const scoreCriteria = {
  profile_completeness: {
    title: "Profil Doluluğu",
    icon: <Edit className="w-5 h-5 text-blue-500" />,
    description: "Profilinize isim, biyografi ve avatar ekleyerek puan kazanın.",
    maxPoints: 20,
  },
  email_verification: {
    title: "E-posta Doğrulaması",
    icon: <MailCheck className="w-5 h-5 text-green-500" />,
    description: "E-posta adresinizi doğrulayarak güvenliğinizi ve puanınızı artırın.",
    maxPoints: 20,
  },
  listings: {
    title: "Aktif İlanlar",
    icon: <Package className="w-5 h-5 text-orange-500" />,
    description: "Yayınladığınız her aktif ilan size puan kazandırır (Maks. 20 puan).",
    maxPoints: 20,
  },
  completed_trades: {
    title: "Başarılı Takaslar",
    icon: <UserCheck className="w-5 h-5 text-purple-500" />,
    description: "Tamamladığınız her başarılı takas, güvenilirliğinizi kanıtlar.",
    maxPoints: 20,
  },
  reviews: {
    title: "Kullanıcı Yorumları",
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    description: "Aldığınız olumlu yorumlar puanınızı önemli ölçüde etkiler.",
    maxPoints: 20,
  },
};

const TrustScorePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching profile:', error);
        navigate(-1);
        return;
      }

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [userId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) return null;

  const breakdown = profile?.trust_score_breakdown || {};
  const totalScore = profile?.trust_score || 0;

  const getScore = (key) => {
    const item = breakdown[key];
    if (typeof item === 'number') return item;
    if (typeof item === 'object' && item !== null && 'score' in item) return item.score;
    return 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1920px] px-1 sm:px-2 lg:px-4 xl:px-6 py-8"
    >
      <div className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center">
          <Award className="w-7 h-7 mr-3 text-primary" />
          <h1 className="text-2xl font-bold text-gradient">Güven Puanı Detayları</h1>
        </div>
      </div>

      <div className="glass-effect rounded-2xl p-8">
        <p className="text-muted-foreground mb-8 text-center">
          Güven puanınız, platformdaki diğer kullanıcılara ne kadar güvenilir olduğunuzu gösterir. Puanınızı artırmak için aşağıdaki adımları tamamlayabilirsiniz.
        </p>

        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground mb-2">Toplam Puanınız</p>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-slate-700"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                className="text-primary"
                strokeDasharray={`${totalScore}, 100`}
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                transform="rotate(90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-white">{totalScore}</span>
              <span className="text-lg text-muted-foreground">/100</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {Object.entries(scoreCriteria).map(([key, criteria]) => {
            const currentScore = getScore(key);
            const isCompleted = criteria.maxPoints > 0 && currentScore >= criteria.maxPoints;
            return (
              <div key={key} className="p-3 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className={cn("flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center", isCompleted ? "bg-green-500/20" : "bg-slate-700")}>
                    {isCompleted ? <CheckCircle className="w-5 h-5 text-green-400" /> : criteria.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-white">{criteria.title}</h4>
                      <span className={cn("font-bold", isCompleted ? "text-green-400" : "text-primary")}>
                        {currentScore}
                        {criteria.maxPoints > 0 && ` / ${criteria.maxPoints}`}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{criteria.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default TrustScorePage;