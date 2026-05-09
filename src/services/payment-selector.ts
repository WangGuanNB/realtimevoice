/**
 * @fileoverview 支付方式选择服务
 * @description 根据配置自动选择可用的支付方式，使用固定优先级顺序
 * 
 * 优先级顺序（固定）：
 * 1. Stripe（最成熟，支持最全面）
 * 2. PayPal（用户基数大）
 * 3. Creem（备选方案）
 * 
 * @usage
 * ```typescript
 * const method = selectPaymentMethod();
 * if (!method) {
 *   // 所有支付方式都未启用
 * }
 * ```
 */

export type PaymentMethod = 'stripe' | 'paypal' | 'creem';

export interface PaymentMethodConfig {
  enabled: boolean;
  name: string;
  priority: number;
}

/**
 * 获取所有支付方式的配置
 * @returns 支付方式配置对象
 */
export function getPaymentMethodConfigs(): Record<PaymentMethod, PaymentMethodConfig> {
  return {
    stripe: {
      enabled: process.env.NEXT_PUBLIC_PAYMENT_STRIPE_ENABLED === 'true',
      name: 'Stripe',
      priority: 1, // 最高优先级
    },
    paypal: {
      enabled: process.env.NEXT_PUBLIC_PAYMENT_PAYPAL_ENABLED === 'true',
      name: 'PayPal',
      priority: 2,
    },
    creem: {
      enabled: process.env.NEXT_PUBLIC_PAYMENT_CREEM_ENABLED === 'true',
      name: 'Creem',
      priority: 3, // 最低优先级
    },
  };
}

/**
 * 根据配置自动选择支付方式
 * 使用固定优先级顺序：Stripe > PayPal > Creem
 * 
 * @returns 选择的支付方式，如果所有支付方式都未启用则返回 null
 */
export function selectPaymentMethod(): PaymentMethod | null {
  const configs = getPaymentMethodConfigs();
  
  // 按固定优先级顺序检查
  const priorityOrder: PaymentMethod[] = ['stripe', 'paypal', 'creem'];
  
  for (const method of priorityOrder) {
    if (configs[method].enabled) {
      return method;
    }
  }
  
  // 所有支付方式都未启用
  return null;
}

/**
 * 检查是否有可用的支付方式
 * @returns 是否有可用的支付方式
 */
export function hasAvailablePaymentMethod(): boolean {
  return selectPaymentMethod() !== null;
}

/**
 * 获取所有启用的支付方式列表
 * @returns 启用的支付方式数组
 */
export function getEnabledPaymentMethods(): PaymentMethod[] {
  const configs = getPaymentMethodConfigs();
  const enabled: PaymentMethod[] = [];
  
  for (const [method, config] of Object.entries(configs) as [PaymentMethod, PaymentMethodConfig][]) {
    if (config.enabled) {
      enabled.push(method);
    }
  }
  
  return enabled;
}
