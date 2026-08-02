/**
 * 社交按钮相关的配置同意放这
 */
module.exports = {
  // 社交链接，不需要可留空白，例如 CONTACT_WEIBO:''
  CONTACT_EMAIL:
    (process.env.NEXT_PUBLIC_CONTACT_EMAIL &&
      btoa(
        unescape(encodeURIComponent(process.env.NEXT_PUBLIC_CONTACT_EMAIL))
      )) ||
    '', // 邮箱地址 例如mail@tangly1024.com
  CONTACT_WEIBO: process.env.NEXT_PUBLIC_CONTACT_WEIBO || '', // 你的微博个人主页
  CONTACT_TWITTER: process.env.NEXT_PUBLIC_CONTACT_TWITTER || '', // 你的twitter个人主页
  CONTACT_GITHUB: process.env.NEXT_PUBLIC_CONTACT_GITHUB || '', // 你的github个人主页 例如 https://github.com/tangly1024
  CONTACT_TELEGRAM: process.env.NEXT_PUBLIC_CONTACT_TELEGRAM || '', // 你的telegram 地址 例如 https://t.me/tangly_1024
  CONTACT_LINKEDIN: process.env.NEXT_PUBLIC_CONTACT_LINKEDIN || '', // 你的linkedIn 首页
  CONTACT_ORCID: process.env.NEXT_PUBLIC_CONTACT_ORCID || '', // ORCID 主页，例如 https://orcid.org/1234-1234-1234-1234
  CONTACT_INSTAGRAM: process.env.NEXT_PUBLIC_CONTACT_INSTAGRAM || '', // 您的instagram地址
  CONTACT_BILIBILI: process.env.NEXT_PUBLIC_CONTACT_BILIBILI || '', // B站主页
  CONTACT_YOUTUBE: process.env.NEXT_PUBLIC_CONTACT_YOUTUBE || '', // Youtube主页
  CONTACT_XIAOHONGSHU: process.env.NEXT_PUBLIC_CONTACT_XIAOHONGSHU || '', // 小红书主页
  CONTACT_ZHISHIXINGQIU: process.env.NEXT_PUBLIC_CONTACT_ZHISHIXINGQIU || '', // 知识星球
  CONTACT_WEHCHAT_PUBLIC: process.env.NEXT_PUBLIC_CONTACT_WEHCHAT_PUBLIC || '', // 微信公众号主页链接，不能填写二维码图片 URL
  CONTACT_WECHAT_QR_IMAGE:
    process.env.NEXT_PUBLIC_CONTACT_WECHAT_QR_IMAGE || '', // 个人微信二维码图片
  CONTACT_WECHAT_PUBLIC_QR_IMAGE:
    process.env.NEXT_PUBLIC_CONTACT_WECHAT_PUBLIC_QR_IMAGE || '', // 微信公众号二维码图片
  CONTACT_WECHAT_PUBLIC_NAME:
    process.env.NEXT_PUBLIC_CONTACT_WECHAT_PUBLIC_NAME || '' // 微信公众号名称
}
