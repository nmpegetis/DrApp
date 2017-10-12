#@History = new Mongo.Collection('history');
#
#Schemas.History = new SimpleSchema
#  name:
#    type:String
#    max: 60
#
#  surname:
#    type:String
#    max: 60
#
#  createdAt:
#    type: Date
#    autoValue: ->
#      if this.isInsert
#        new Date()
#
#  updatedAt:
#    type:Date
#    optional:true
#    autoValue: ->
#      if this.isUpdate
#        new Date()
#
#  owner:
#    type: String
#    regEx: SimpleSchema.RegEx.Id
#    autoValue: ->
#      if this.isInsert
#        Meteor.userId()
#    autoform:
#      options: ->
#        _.map Meteor.users.find().fetch(), (user)->
#          label: user.emails[0].address
#          value: user._id
#
#History.attachSchema(Schemas.History)
#
#History.helpers
#  author: ->
#    user = Meteor.users.findOne(@owner)
#    if user?.profile?.firstName? and user?.profile?.lastName
#      user.profile.firstName + ' ' + user.profile.lastName
#    else
#      user?.emails?[0].address
