/**
 * @fileoverview 支付处理逻辑 Hook
 * @description 提供统一的支付处理逻辑，包括订单创建、Stripe/Creem支付跳转等功能
 *
 * @features
 * - 支付参数验证和处理
 * - Stripe/Creem支付会话创建
 * - 用户认证状态检查
 * - 支付加载状态管理
 * - 错误处理和用户提示
 * - 支付方式选择支持
 *
 * @usage
 * ```tsx
 * const { handleCheckout, isLoading, productId, showPaymentSelector, setShowPaymentSelector } = usePayment();
 *
 * const onPayment = async () => {
 *   const result = await handleCheckout(pricingItem, false);
 *   if (result.success) {
 *     // 支付成功处理
 *   }
 * };
 * ```
 */

"use client";

import { useState } from 'react';
import { useAppContext } from '@/contexts/app';
import { useLocale } from 'next-intl';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { PricingItem } from '@/types/blocks/pricing';
import { PaymentMethod } from '@/components/payment/PaymentMethodSelector';

/**
 * 支付处理 Hook
 * @returns {Object} 支付相关的状态和方法
 * @returns {Function} handleCheckout - 处理支付的主函数
 * @returns {boolean} isLoading - 支付处理中的加载状态
 * @returns {string|null} productId - 当前正在处理的产品ID
 * @returns {boolean} showPaymentSelector - 是否显示支付方式选择器
 * @returns {Function} setShowPaymentSelector - 设置支付方式选择器显示状态
 * @returns {Function} handlePaymentMethodSelect - 处理支付方式选择
 */
export function usePayment() {
  const { user, setShowSignModal } = useAppContext();
  const locale = useLocale();
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<{
    item: PricingItem;
    cn_pay: boolean;
  } | null>(null);

  /**
   * 处理支付流程 - 显示支付方式选择器
   * @param {PricingItem} item - 定价项目信息
   * @param {boolean} cn_pay - 是否使用中国支付方式（支付宝/微信）
   * @returns {Promise<Object>} 支付结果
   *
   * @description
   * 用户点击购买按钮后，先显示支付方式选择器
   * 用户选择支付方式后，再调用实际的支付流程
   */
  const handleCheckout = async (
    item: PricingItem,
    cn_pay: boolean = false
  ) => {
    // 检查用户登录状态
    if (!user) {
      setShowSignModal(true);
      return { needAuth: true };
    }

    // 保存待支付信息，显示支付方式选择器
    setPendingPayment({ item, cn_pay });
    setShowPaymentSelector(true);

    return { showingSelector: true };
  };

  /**
   * 处理支付方式选择
   * @param {PaymentMethod} paymentMethod - 用户选择的支付方式
   */
  const handlePaymentMethodSelect = async (paymentMethod: PaymentMethod) => {
    if (!pendingPayment) return;

    const { item, cn_pay } = pendingPayment;

    try {
      // 构建支付参数
      const params: {
        product_id: string;
        product_name?: string;
        credits?: number;
        interval: "month" | "year" | "one-time";
        amount?: number;
        currency?: string;
        valid_months?: number;
        locale: string;
        creem_product_id?: string;
        payment_method: PaymentMethod;
      } = {
        product_id: item.product_id,
        product_name: item.product_name,
        credits: item.credits,
        interval: item.interval,
        amount: cn_pay ? item.cn_amount : item.amount,
        currency: cn_pay ? "cny" : item.currency,
        valid_months: item.valid_months,
        locale: locale || "en",
        payment_method: paymentMethod,
      };

      // 如果使用 Creem，添加产品 ID（如果有配置）
      if (item.creem_product_id) {
        params.creem_product_id = item.creem_product_id;
      }

      // 设置加载状态
      setIsLoading(true);
      setProductId(item.product_id);

      // 调用 /api/checkout，传入用户选择的支付方式
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      // 处理未授权状态
      if (response.status === 401) {
        setIsLoading(false);
        setProductId(null);
        setShowSignModal(true);
        return { needAuth: true };
      }

      // 解析响应数据
      const { code, message, data } = await response.json();
      if (code !== 0) {
        toast.error(message);
        return { success: false, message };
      }

      // 根据返回的支付方式处理跳转
      if (paymentMethod === "creem") {
        // Creem 支付：在新标签页打开支付链接
        const { checkout_url } = data;
        if (checkout_url) {
          window.open(checkout_url, '_blank', 'noopener,noreferrer');
          return { success: true };
        } else {
          toast.error("Failed to get checkout URL");
          return { success: false, message: "Failed to get checkout URL" };
        }
      } else if (paymentMethod === "paypal") {
        // PayPal 支付：跳转到 PayPal 支付页面
        const { approval_url } = data;
        if (approval_url) {
          window.location.href = approval_url;
          return { success: true };
        } else {
          toast.error("Failed to get PayPal approval URL");
          return { success: false, message: "Failed to get PayPal approval URL" };
        }
      } else {
        // Stripe 支付：使用 Stripe SDK 跳转
        const { public_key, session_id } = data;
        if (!public_key || !session_id) {
          toast.error("Invalid payment response");
          return { success: false, message: "Invalid payment response" };
        }

        const stripe = await loadStripe(public_key);

        if (!stripe) {
          toast.error("checkout failed");
          return { success: false };
        }

        // 跳转到Stripe支付页面
        const result = await stripe.redirectToCheckout({
          sessionId: session_id,
        });

        if (result.error) {
          toast.error(result.error.message);
          return { success: false, message: result.error.message };
        }

        return { success: true };
      }
    } catch (e) {
      console.log("checkout failed: ", e);
      toast.error("checkout failed");
      return { success: false };
    } finally {
      // 清理加载状态
      setIsLoading(false);
      setProductId(null);
      setPendingPayment(null);
    }
  };

  return {
    handleCheckout,
    handlePaymentMethodSelect,
    isLoading,
    productId,
    showPaymentSelector,
    setShowPaymentSelector,
  };
}
