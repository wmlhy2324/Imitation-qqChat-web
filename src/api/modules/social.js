import request from '@/utils/request'

// 社交相关API
export const socialApi = {
  // 获取好友列表
  getFriends: (params = {}) => {
    return request.get('/v1/social/friends', { params })
  },

  // 搜索用户
  searchUsers: (keyword) => {
    return request.get('/v1/social/search', {
      params: { keyword }
    })
  },

  // 发送好友请求
  sendFriendRequest: (requestData) => {
    return request.post('/v1/social/friend-requests', requestData)
  },

  // 获取好友请求列表
  getFriendRequests: () => {
    return request.get('/v1/social/friend-requests')
  },

  // 处理好友请求
  handleFriendRequest: (requestData) => {
    return request.put('/v1/social/friend-requests', requestData)
  },

  // 删除好友
  deleteFriend: (friendId) => {
    return request.delete(`/v1/social/friends/${friendId}`)
  },

  // 获取群组列表
  getGroups: (params = {}) => {
    return request.get('/v1/social/groups', { params })
  },

  // 创建群组
  createGroup: (groupData) => {
    return request.post('/v1/social/groups', groupData)
  },

  // 加入群组
  joinGroup: (groupId) => {
    return request.post(`/v1/social/groups/${groupId}/join`)
  },

  // 退出群组
  leaveGroup: (groupId) => {
    return request.post(`/v1/social/groups/${groupId}/leave`)
  },

  // 获取群组成员
  getGroupMembers: (groupId) => {
    return request.get(`/v1/social/groups/${groupId}/members`)
  },

  // 邀请用户加入群组
  inviteToGroup: (groupId, userIds) => {
    return request.post(`/v1/social/groups/${groupId}/invite`, { userIds })
  },

  // 踢出群成员
  removeFromGroup: (groupId, userId) => {
    return request.delete(`/v1/social/groups/${groupId}/members/${userId}`)
  }
}