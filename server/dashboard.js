Markers = new Meteor.Collection('markers');
History = new Meteor.Collection('history');

Meteor.publish('markers',function(userEmail,usrId){
  
  if (!this.userId) {
    return this.ready();    //if not included loading state forever between different logs
  }
  new SimpleSchema({
    userEmail: {type: String}
  }).validate({ userEmail });
    new SimpleSchema({
        usrId: {type: String}
    }).validate({ usrId });
 if(userEmail == 'admin@gmail.com'){
    return Markers.find({$or:[{sent: "1"},{sent:"-1"},{request: "1"}]});  // sent:1 not available vehicles, sent:-1 available vehicles, request:1 users that requested a vehicle
  }
  else {
     return Markers.find({$or:[{friend: userEmail},{_id:usrId}]});
  }
});

Meteor.publish('history',function(){
    if (!this.userId) {
        return this.ready();    //if not included loading state forever between different logs
    }
    return History.find();
});
