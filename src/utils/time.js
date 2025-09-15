import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化时间
 * @param {string|Date|number} time - 时间
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的时间字符串
 */
export const formatTime = (time, format = 'YYYY-MM-DD HH:mm:ss') => {
  if (!time) return ''
  return dayjs(time).format(format)
}

/**
 * 获取相对时间
 * @param {string|Date|number} time - 时间
 * @returns {string} 相对时间字符串
 */
export const getRelativeTime = (time) => {
  if (!time) return ''
  return dayjs(time).fromNow()
}

/**
 * 获取聊天时间显示格式
 * @param {string|Date|number} time - 时间
 * @returns {string} 聊天时间显示
 */
export const getChatTimeDisplay = (time) => {
  if (!time) return ''
  
  const now = dayjs()
  const msgTime = dayjs(time)
  const diffDays = now.diff(msgTime, 'day')
  
  if (diffDays === 0) {
    // 今天：显示具体时间
    return msgTime.format('HH:mm')
  } else if (diffDays === 1) {
    // 昨天
    return '昨天 ' + msgTime.format('HH:mm')
  } else if (diffDays < 7) {
    // 本周：显示星期几
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return weekdays[msgTime.day()] + ' ' + msgTime.format('HH:mm')
  } else if (msgTime.year() === now.year()) {
    // 今年：显示月日
    return msgTime.format('MM-DD HH:mm')
  } else {
    // 往年：显示年月日
    return msgTime.format('YYYY-MM-DD HH:mm')
  }
}

/**
 * 判断是否为今天
 * @param {string|Date|number} time - 时间
 * @returns {boolean}
 */
export const isToday = (time) => {
  if (!time) return false
  return dayjs(time).isSame(dayjs(), 'day')
}

/**
 * 判断是否为昨天
 * @param {string|Date|number} time - 时间
 * @returns {boolean}
 */
export const isYesterday = (time) => {
  if (!time) return false
  return dayjs(time).isSame(dayjs().subtract(1, 'day'), 'day')
}