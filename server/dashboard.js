Markers = new Mongo.Collection('markers');
History = new Mongo.Collection('history');

Meteor.publish('markers', function(userEmail, usrId) {
	if (!this.userId) {
		return this.ready(); //if not included loading state forever between different logs
	}

	new SimpleSchema({
		userEmail: {
			type: String,
		},
	}).validate({
		userEmail,
	});

	new SimpleSchema({
		usrId: {
			type: String,
		},
	}).validate({
		usrId,
	});

	userEmail === 'admin@gmail.com'
		? Markers.find({
				$or: [
					{
						sent: '1',
					},
					{
						sent: '-1',
					},
					{
						request: '1',
					},
				],
			}) // sent:1 not available doctors, sent:-1 available doctors, request:1 users that requested a doctor
		: Markers.find({
				$or: [
					{
						friend: userEmail,
					},
					{
						_id: usrId,
					},
				],
			});
});

Meteor.publish('history', function() {
	!this.userId
		? this.ready() //if not included loading state forever between different logs
		: History.find();
});
