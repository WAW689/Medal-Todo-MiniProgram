const pages = [
  'pages/home/index',
  'pages/time-view/index',
  'pages/profile/index',
  'pages/login/index',
  'pages/task-form/index',
  'pages/medal-detail/index',
  'pages/share-preview/index',
  'pages/invitations/index',
  'pages/tag-manager/index'
]

//  To fully leverage TypeScript's type safety and ensure its correctness, always enclose the configuration object within the global defineAppConfig helper function.
export default defineAppConfig({
  pages,
  tabBar: {
    color: '#999999',
    selectedColor: '#E02424',
    backgroundColor: '#1F1F1F',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: './assets/icons/home_unselected.png',
        selectedIconPath: './assets/icons/home_selected.png'
      },
      {
        pagePath: 'pages/time-view/index',
        text: '时间视图',
        iconPath: './assets/icons/time_unselected.png',
        selectedIconPath: './assets/icons/time_selected.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/icons/profile_unselected.png',
        selectedIconPath: './assets/icons/profile_selected.png'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#141414',
    navigationBarTitleText: '勋章待办',
    navigationBarTextStyle: 'white'
  },
  permission: {
    'scope.writePhotosAlbum': {
      desc: '需要保存分享图片到相册'
    }
  },
  requiredPrivateInfos: []
})
