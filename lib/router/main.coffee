Router.map ->
  @route "home",
    path: "/"
    layoutTemplate: "homeLayout"
# previously
    onBeforeAction: ->
#    if not Config.username or (Meteor.userId() and Meteor.user().username)
      Router.go '/dashboard'
#    @next()

  @route "dashboard",
    path: "/dashboard"
    waitOn: ->
      [
        subs.subscribe 'posts'
        subs.subscribe 'comments'
        subs.subscribe 'attachments'
      ]
    data: ->
      posts: Posts.find({},{sort: {createdAt: -1}}).fetch()