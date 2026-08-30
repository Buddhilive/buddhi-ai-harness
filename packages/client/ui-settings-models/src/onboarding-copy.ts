/** Durable settings namespace for product-wide GUI onboarding facts. */
export const WELCOME_NOTICE_SETTINGS_NAMESPACE = 'ui-onboarding'

/** Field storing the last welcome notice version the user acknowledged. */
export const WELCOME_NOTICE_ACK_FIELD = 'welcomeNoticeVersion'

/**
 * Bump only when the notice changes materially and every user should see it
 * again. The acknowledgement is compared for exact equality.
 */
export const WELCOME_NOTICE_VERSION = '2026-08-13.1'

/** The complete editable internal-testing notice in both supported GUI locales. */
export const WELCOME_NOTICE_COPY = {
  zh: {
    title: 'BuddhiAI Harness 欢迎指南',
    body: 'BuddhiAI Harness 是专为 BuddhiAI 本地智能生态设计的可扩展智能代理框架，与 BuddhiAI Studio 无缝集成提供完全私有化、高可用的本地推理服务。\n\n默认情况下，BuddhiAI Harness 依赖本地运行的 BuddhiAI Studio (http://localhost:8765)。欢迎加入 BuddhiAI 开源生态！',
    continueLabel: '继续',
  },
  en: {
    title: 'Welcome to BuddhiAI Harness',
    body: 'BuddhiAI Harness is an extensible AI agent harness designed for the BuddhiAI ecosystem, connecting seamlessly to BuddhiAI Studio for local, private, and high-performance inferencing.\n\nBy default, BuddhiAI Harness depends exclusively on your local BuddhiAI Studio service (running on http://localhost:8765). Welcome to the BuddhiAI ecosystem!',
    continueLabel: 'Continue',
  },
} as const
