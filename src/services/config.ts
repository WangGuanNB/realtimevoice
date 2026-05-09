/**
 * @fileoverview 系统配置服务
 * @description 统一管理所有可配置的系统参数，从环境变量读取，提供默认值
 */

/**
 * 获取新用户注册时赠送的积分数量
 * @returns 积分数量（默认：20）
 */
export function getNewUserCredits(): number {
  const credits = process.env.NEW_USER_CREDITS;
  if (credits) {
    const parsed = parseInt(credits, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 20; // 默认 20 积分
}

/**
 * 获取 AI 聊天每次消耗的积分数量
 * @returns 积分数量（默认：10）
 */
export function getAIChatCreditCost(): number {
  const cost = process.env.AI_CHAT_CREDIT_COST;
  if (cost) {
    const parsed = parseInt(cost, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 10; // 默认消耗 10 积分
}

/**
 * 判断是否为 Creem 测试模式
 * @returns true=测试环境，false=生产环境
 */
export function isCreemTestMode(): boolean {
  return process.env.CREEM_TEST_MODE === "true";
}

