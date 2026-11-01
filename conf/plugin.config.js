/**
 * 一些插件
 */
module.exports = {
  // 网站全文搜索
  ALGOLIA_APP_ID: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || null, // 在这里查看 https://dashboard.algolia.com/account/api-keys/
  ALGOLIA_ADMIN_APP_KEY: process.env.ALGOLIA_ADMIN_APP_KEY || null, // 管理后台的KEY，不要暴露在代码中，在这里查看 https://dashboard.algolia.com/account/api-keys/
  ALGOLIA_SEARCH_ONLY_APP_KEY:
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_APP_KEY || null, // 客户端搜索用的KEY
  ALGOLIA_INDEX: process.env.NEXT_PUBLIC_ALGOLIA_INDEX || null, // 在Algolia中创建一个index用作数据库

  // AI 相关配置已迁移至 conf/ai.config.js

  // 邮件
  MAILCHIMP_ENABLE: true, // 订阅区开关及以下文案可在 Notion Config 修改，空值保留为空
  MAILCHIMP_TITLE: null,
  MAILCHIMP_DESCRIPTION: null,
  MAILCHIMP_EMAIL_PLACEHOLDER: null,
  MAILCHIMP_BUTTON_TEXT: null,
  MAILCHIMP_SUBMITTING_TEXT: null,
  MAILCHIMP_SUCCESS_TEXT: null,
  MAILCHIMP_ERROR_TEXT: null,
  MAILCHIMP_LIST_ID: process.env.MAILCHIMP_LIST_ID || null, // 开启mailichimp邮件订阅 客户列表ID ，具体使用方法参阅文档
  MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY || null, // 开启mailichimp邮件订阅 APIkey
  MAILCHIMP_DATA_CENTER: process.env.MAILCHIMP_DATA_CENTER || null
}
