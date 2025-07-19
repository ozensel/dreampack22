import { supabase } from '../config/supabase';

class SubscriptionService {
  // Abonelik planlarını getir
  async getSubscriptionPlans() {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Abonelik planları getirme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Kullanıcının aktif aboneliğini getir
  async getUserActiveSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Aktif abonelik getirme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Kullanıcının günlük kullanım limitini kontrol et
  async checkDailyUsageLimit(userId) {
    try {
      // Önce aktif aboneliği kontrol et
      const subscriptionResult = await this.getUserActiveSubscription(userId);
      
      if (!subscriptionResult.success || !subscriptionResult.data) {
        // Ücretsiz kullanıcı - günlük 3 limit
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: usageData, error } = await supabase
          .from('usage_history')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString());

        if (error) throw error;

        const usedCount = usageData?.length || 0;
        const limit = 3;
        
        return {
          success: true,
          data: {
            canUse: usedCount < limit,
            usedCount,
            limit,
            isPremium: false,
            resetTime: tomorrow.toISOString()
          }
        };
      }

      // Premium kullanıcı - sınırsız
      const subscription = subscriptionResult.data;
      if (subscription.subscription_plans.dream_interpretations_limit === null) {
        return {
          success: true,
          data: {
            canUse: true,
            usedCount: subscription.dream_interpretations_used || 0,
            limit: null,
            isPremium: true,
            subscription: subscription
          }
        };
      }

      // Sınırlı premium plan
      const usedCount = subscription.dream_interpretations_used || 0;
      const limit = subscription.subscription_plans.dream_interpretations_limit;
      
      return {
        success: true,
        data: {
          canUse: usedCount < limit,
          usedCount,
          limit,
          isPremium: true,
          subscription: subscription
        }
      };
    } catch (error) {
      console.error('Günlük kullanım limiti kontrol hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Kullanım kaydı ekle
  async recordUsage(userId, actionType, dreamText, interpretationResult) {
    try {
      // Kullanım geçmişine kaydet
      const { error: usageError } = await supabase
        .from('usage_history')
        .insert({
          user_id: userId,
          action_type: actionType,
          dream_text: dreamText,
          interpretation_result: interpretationResult
        });

      if (usageError) throw usageError;

      // Aktif aboneliği güncelle (premium kullanıcılar için)
      const subscriptionResult = await this.getUserActiveSubscription(userId);
      if (subscriptionResult.success && subscriptionResult.data) {
        const { error: updateError } = await supabase
          .from('user_subscriptions')
          .update({
            dream_interpretations_used: (subscriptionResult.data.dream_interpretations_used || 0) + 1
          })
          .eq('id', subscriptionResult.data.id);

        if (updateError) throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('Kullanım kaydı ekleme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Abonelik oluştur
  async createSubscription(userId, planId, paymentData) {
    try {
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) throw planError;

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.duration_days);

      // Abonelik oluştur
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          starts_at: startDate.toISOString(),
          expires_at: endDate.toISOString(),
          payment_method: paymentData?.payment_method || 'stripe',
          stripe_subscription_id: paymentData?.stripe_subscription_id
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Ödeme işlemi kaydı
      if (plan.price > 0) {
        const { error: paymentError } = await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            subscription_id: subscription.id,
            amount: plan.price,
            currency: plan.currency,
            status: 'completed',
            payment_method: paymentData?.payment_method || 'stripe',
            stripe_payment_intent_id: paymentData?.stripe_payment_intent_id,
            stripe_charge_id: paymentData?.stripe_charge_id
          });

        if (paymentError) throw paymentError;
      }

      return { success: true, data: subscription };
    } catch (error) {
      console.error('Abonelik oluşturma hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Abonelik iptal et
  async cancelSubscription(userId, subscriptionId) {
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('id', subscriptionId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Abonelik iptal hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Kullanıcının ünlü kişi yorumu yapma yetkisi var mı?
  async canUseFeature(userId, featureName) {
    try {
      const subscriptionResult = await this.getUserActiveSubscription(userId);
      
      if (!subscriptionResult.success || !subscriptionResult.data) {
        // Ücretsiz kullanıcı
        return {
          success: true,
          data: {
            canUse: false,
            reason: 'premium_required',
            isPremium: false
          }
        };
      }

      const subscription = subscriptionResult.data;
      const features = subscription.subscription_plans.features || {};
      
      return {
        success: true,
        data: {
          canUse: features[featureName] === true,
          reason: features[featureName] ? null : 'feature_not_included',
          isPremium: true,
          subscription: subscription
        }
      };
    } catch (error) {
      console.error('Özellik yetki kontrol hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Kullanıcının abonelik geçmişini getir
  async getUserSubscriptionHistory(userId) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Abonelik geçmişi getirme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Aboneliği iptal et
  async cancelSubscription(userId) {
    try {
      // Aktif aboneliği bul
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (!activeSubscription.success || !activeSubscription.data) {
        return { success: false, error: 'Aktif abonelik bulunamadı.' };
      }

      // Abonelik durumunu 'cancelled' olarak güncelle
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', activeSubscription.data.id)
        .eq('user_id', userId);

      if (error) throw error;

      // Kullanıcının premium durumunu güncelle
      const { error: userError } = await supabase
        .from('users')
        .update({ is_premium: false })
        .eq('id', userId);

      if (userError) throw userError;

      return { success: true, data };
    } catch (error) {
      console.error('Abonelik iptal etme hatası:', error);
      return { success: false, error: error.message };
    }
  }

  // Abonelik durumunu kontrol et ve güncelle
  async refreshSubscriptionStatus(userId) {
    try {
      const activeSubscription = await this.getUserActiveSubscription(userId);
      
      if (activeSubscription.success && activeSubscription.data) {
        // Aktif abonelik var
        const { error } = await supabase
          .from('users')
          .update({ is_premium: true })
          .eq('id', userId);

        if (error) throw error;
        return { success: true, isPremium: true, subscription: activeSubscription.data };
      } else {
        // Aktif abonelik yok
        const { error } = await supabase
          .from('users')
          .update({ is_premium: false })
          .eq('id', userId);

        if (error) throw error;
        return { success: true, isPremium: false, subscription: null };
      }
    } catch (error) {
      console.error('Abonelik durumu güncelleme hatası:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SubscriptionService();