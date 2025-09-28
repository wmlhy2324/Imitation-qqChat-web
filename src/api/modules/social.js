import request from '@/utils/request'

// 社交相关API
export const socialApi = {
  // 获取好友列表
  getFriends: (params = {}) => {
    return request.get('/v1/social/friends', { params })
  },

  // 搜索用户 - 后端实现在social服务中
  searchUsers: (keyword) => {
    return request.get('/v1/social/user/search', {
      params: { keyword }
    })
  },

  // 搜索群组
  searchGroups: (keyword) => {
    return request.get('/v1/social/group/search', {
      params: { keyword }
    })
  },

  // 综合搜索好友和群组
  searchAll: (keyword) => {
    return request.get('/v1/social/search', {
      params: { keyword }
    })
  },

  // 发送好友申请 - 匹配后端接口
  sendFriendRequest: (requestData) => {
    const payload = {
      user_uid: requestData.userId,
      req_msg: requestData.reqMsg || requestData.message,
      req_time: Date.now()
    }
    console.log('Social API: 发送请求到', '/v1/social/friend/putIn', '数据:', payload)
    
    return request.post('/v1/social/friend/putIn', payload)
  },

  // 获取好友申请列表
  getFriendRequests: () => {
    return request.get('/v1/social/friend/putIns')
  },

  // 处理好友申请 - 匹配后端接口
  handleFriendRequest: (requestData) => {
    return request.put('/v1/social/friend/putIn', {
      friend_req_id: requestData.friendReqId,
      handle_result: requestData.handleResult // 1-同意，2-拒绝
    })
  },

  // 获取好友在线状态
  getFriendsOnline: () => {
    return request.get('/v1/social/friends/online')
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
    return request.post('/v1/social/group', groupData)
  },

  // 加入群组
  joinGroup: (groupId) => {
    return request.post(`/v1/social/group/${groupId}/join`)
  },

  // 退出群组
  leaveGroup: (groupId) => {
    return request.post(`/v1/social/group/${groupId}/leave`)
  },

  // 获取群组成员
  getGroupMembers: (groupId) => {
    return request.get(`/v1/social/group/${groupId}/members`)
  },

  // 邀请用户加入群组
  inviteToGroup: (groupId, userIds) => {
    return request.post(`/v1/social/groups/${groupId}/invite`, { userIds })
  },

  // 踢出群成员
  removeFromGroup: (groupId, userId) => {
    return request.delete(`/v1/social/groups/${groupId}/members/${userId}`)
  },

  // 申请加群
  joinGroupRequest: (requestData) => {
    const payload = {
      group_id: requestData.groupId,
      req_msg: requestData.reqMsg || requestData.message,
      req_time: requestData.reqTime || Date.now()
    }
    console.log('Social API: 发送申请加群请求到', '/v1/social/group/putIn', '数据:', payload)
    
    return request.post('/v1/social/group/putIn', payload)
  },

  // 获取群组申请列表
  getGroupRequests: () => {
    return request.get('/v1/social/group/putIns')
  },

  // 处理群组申请
  handleGroupRequest: (requestData) => {
    return request.put('/v1/social/group/putIn', {
      group_req_id: requestData.groupReqId,
      handle_result: requestData.handleResult // 1-同意，2-拒绝
    })
  }
}