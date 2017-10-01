Parse.Cloud.beforeSave("User", function(request, response) {
	var user = request.object;

	if(user.isNew())
		user.set("balance", 0);

	if(user.dirty('balance') && !user.isNew()) {
		let query = new Parse.Query(Parse.User);
		query.get(user.id).then((oldUser) => {
			const value = oldUser.get("balance")-user.get("balance");
			let history = new Parse.Object("History");
			history.set("user", user);
			history.set("value", value);

			return history.save()
		}).then(() => {
			response.success();
		}, (error) => {
			response.error(error);
		})
	} else {
		response.success();
	}
});